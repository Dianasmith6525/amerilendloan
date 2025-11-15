import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { users, notifications, loanApplications, payments, disbursements, legalAcceptances, supportMessages, referrals } from "../drizzle/schema";
import { createOTP, verifyOTP, sendOTPEmail } from "./_core/otp";
import { createPhoneOTP, verifyPhoneOTP, resendPhoneOTP, formatPhoneNumber, isValidPhoneNumber } from "./_core/sms-otp";
import { createAuthorizeNetTransaction, getAcceptJsConfig } from "./_core/authorizenet";
import { createCryptoCharge, checkCryptoPaymentStatus, getSupportedCryptos, convertUSDToCrypto } from "./_core/crypto-payment";
import { checkPaymentById } from "./_core/payment-monitor";
import { eq, and, desc, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { logger } from "./_core/logging";
import bcrypt from "bcryptjs";
import {
  sendEmail,
  sendLoanApplicationSubmittedEmail,
  sendLoanApprovalEmail,
  sendLoanRejectionEmail,
  sendPaymentConfirmationEmail,
  sendLoanDisbursementEmail,
  sendIDVerificationRejectionEmail,
  sendIDVerificationApprovalEmail,
  sendProfileUpdateEmail
} from "./_core/email";
import { generateDownloadUrl } from "./_core/fileUpload";
import { trackIPLocation } from "./_core/ipTracking";

/**
 * Helper function to save base64 encoded image/PDF directly (no file storage needed)
 * Returns the base64 data URL to be stored in the database
 */
async function saveBase64Image(base64Data: string, fileName: string, userId: number): Promise<string> {
  // Ensure data URL prefix is present (e.g., "data:image/png;base64,")
  if (!base64Data.startsWith('data:')) {
    // If no prefix, assume JPEG and add it
    return `data:image/jpeg;base64,${base64Data}`;
  }
  
  // Return the base64 data URL as-is to be stored in database
  return base64Data;
}

export const appRouter = router({
  system: systemRouter,
  
  // Authentication router
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    // Sign up with email and password
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
        password: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number")
          .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
          .optional(),
        referralCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }
        
        // Normalize email to lowercase to prevent duplicates with different casing
        const normalizedEmail = input.email.toLowerCase().trim();
        
        // Check if user already exists by email
        const existingUsers = await database.select().from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);
        const existingUser = existingUsers.length > 0 ? existingUsers[0] : undefined;
        
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please login instead.",
          });
        }
        
        // If phone number provided, check for duplicates
        if (input.phoneNumber) {
          const normalizedPhone = input.phoneNumber.replace(/\D/g, ''); // Remove non-digits
          const usersWithPhone = await database.select().from(users)
            .where(eq(users.phoneNumber, normalizedPhone))
            .limit(1);
          const userWithPhone = usersWithPhone.length > 0 ? usersWithPhone[0] : undefined;
          
          if (userWithPhone) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This phone number is already registered to another account.",
            });
          }
        }
        
        // If referral code provided, validate and get referrer
        let referrerId: number | undefined;
        if (input.referralCode) {
          const referrer = await db.getUserByReferralCode(input.referralCode);
          if (referrer && typeof referrer === 'object' && 'id' in referrer) {
            referrerId = referrer.id;
          }
        }
        
        // Require password for signup
        if (!input.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password is required for signup",
          });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        // Build name from firstName and lastName if provided
        const name = input.firstName && input.lastName 
          ? `${input.firstName} ${input.lastName}` 
          : input.email.split('@')[0];
        
        // Create user
        const userIdResult = await database.insert(users).values({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          phoneNumber: input.phoneNumber ? input.phoneNumber.replace(/\D/g, '') : null,
          loginMethod: "password",
          role: "user",
        }).returning({ id: users.id });
        
        const newUserResult = await database.select().from(users)
          .where(eq(users.id, userIdResult[0].id))
          .limit(1);
        const user = newUserResult[0];
        
        // If user was referred, create referral record
        if (referrerId && input.referralCode) {
          await db.createReferral({
            referrerId,
            referredUserId: user.id,
            referralCode: input.referralCode,
            status: "pending",
          });
        }
        
        console.log('[Signup] New user created:', user.id, normalizedEmail);
        
        // Create session for the new user
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);
        
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),
    
    // Login with email and password
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }
        
        // Find user by email
        const userResult = await database.select().from(users)
          .where(eq(users.email, input.email))
          .limit(1);
        const user = userResult.length > 0 ? userResult[0] : undefined;
        
        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
        
        // Update last signed in
        await database.update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);
        
        return { 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            role: user.role 
          } 
        };
      }),
    
    // Request password reset email
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const normalizedEmail = input.email.toLowerCase().trim();
        
        // Find user by email
        const usersList = await database.select().from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);
        
        // Always return success to prevent email enumeration
        if (usersList.length === 0) {
          return { success: true };
        }

        const user = usersList[0];
        
        // Generate secure random token
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token expires in 1 hour
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        // Store token in database
        const { passwordResetTokens } = await import('../drizzle/schema');
        await database.insert(passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
          used: 0,
        });
        
        // Send password reset email
        const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        await sendEmail({
          to: user.email!,
          subject: 'Reset Your Password - AmeriLend',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0033A0;">Reset Your Password</h2>
              <p>Hello ${user.name || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #0033A0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                This is an automated email from AmeriLend. Please do not reply to this email.
              </p>
            </div>
          `,
        });

        logger.info(`Password reset email sent to ${user.email}`);
        
        return { success: true };
      }),
    
    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[a-z]/, "Password must contain at least one lowercase letter")
          .regex(/[0-9]/, "Password must contain at least one number")
          .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const { passwordResetTokens } = await import('../drizzle/schema');
        
        // Find token
        const tokensList = await database.select().from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, input.token))
          .limit(1);
        
        if (tokensList.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired reset token",
          });
        }

        const resetToken = tokensList[0];
        
        // Check if token is used
        if (resetToken.used === 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This reset link has already been used",
          });
        }
        
        // Check if token is expired
        if (new Date() > new Date(resetToken.expiresAt)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This reset link has expired. Please request a new one.",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        
        // Update user password
        await database.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, resetToken.userId));
        
        // Mark token as used
        await database.update(passwordResetTokens)
          .set({ used: 1 })
          .where(eq(passwordResetTokens.id, resetToken.id));
        
        logger.info(`Password reset successful for user ID: ${resetToken.userId}`);
        
        return { success: true };
      }),
  }),

  // OTP Authentication router
  otp: router({  
    // Request OTP code for signup, login, or loan application
    requestCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        purpose: z.enum(["signup", "login", "loan_application"]),
      }))
      .mutation(async ({ input }) => {
        const code = await createOTP(input.email, input.purpose);
        await sendOTPEmail(input.email, code, input.purpose);
        return { success: true };
      }),

    // Verify OTP code
    verifyCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
        purpose: z.enum(["signup", "login", "loan_application"]),
        referralCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await verifyOTP(input.email, input.code, input.purpose);
        if (!result.valid) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: result.error || "Invalid code" 
          });
        }
        
        // If purpose is login, create session and log user in
        if (input.purpose === "login") {
          const database = await getDb();
          if (!database) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database not available",
            });
          }
          
          // Find user by email
          let user;
          try {
            const userResult = await database.select().from(users)
              .where(eq(users.email, input.email))
              .limit(1);
            user = userResult.length > 0 ? userResult[0] : undefined;
          } catch (error) {
            console.error("[OTP Login] Database query error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
          
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found. Please sign up first.",
            });
          }
          
          // Update last signed in
          try {
            await database.update(users)
              .set({ lastSignedIn: new Date() })
              .where(eq(users.id, user.id));
          } catch (error) {
            console.error("[OTP Login] Failed to update lastSignedIn:", error);
            // Non-critical, continue with login
          }
          
          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);
          
          return { 
            success: true, 
            user: { 
              id: user.id, 
              email: user.email, 
              name: user.name,
              role: user.role 
            } 
          };
        }
        
        // If purpose is signup, also create session
        if (input.purpose === "signup") {
          const database = await getDb();
          if (!database) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database not available",
            });
          }
          
          // Find user by email
          const userResult = await database.select().from(users)
            .where(eq(users.email, input.email))
            .limit(1);
          const user = userResult.length > 0 ? userResult[0] : undefined;
          
          if (!user) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found. Please complete signup first.",
            });
          }
          
          // Update last signed in
          await database.update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, user.id));
          
          // Track referral if referral code provided
          if (input.referralCode) {
            try {
              const referrer = await db.getUserByReferralCode(input.referralCode.toUpperCase());

              if (referrer && typeof referrer === 'object' && 'id' in referrer) {
                // Prevent self-referral
                if (referrer.id === user.id) {
                  console.log(`[OTP] Self-referral prevented: User ${user.id} tried to refer themselves`);
                } else {
                  // Check if referral already exists
                  const existingReferralResult = await database.select().from(referrals)
                    .where(and(
                      eq(referrals.referrerId, referrer.id),
                      eq(referrals.referredUserId, user.id)
                    ))
                    .limit(1);
                  const existingReferral = existingReferralResult.length > 0 ? existingReferralResult[0] : undefined;

                  if (!existingReferral) {
                    await db.createReferral({
                      referrerId: referrer.id,
                      referredUserId: user.id,
                      referralCode: input.referralCode.toUpperCase(),
                      status: "pending",
                    });
                    console.log(`[OTP] Referral tracked: ${referrer.id} referred ${user.id}`);
                  }
                }
              }
            } catch (error) {
              console.error("[OTP] Failed to track referral:", error);
              // Non-critical, continue with signup
            }
          }
          
          // Set session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);
          
          return { 
            success: true, 
            user: { 
              id: user.id, 
              email: user.email, 
              name: user.name,
              role: user.role 
            } 
          };
        }
        
        return { success: true };
      }),
  }),

  // Phone/SMS Authentication router
  phoneAuth: router({
    requestCode: publicProcedure
      .input(z.object({
        phone: z.string().min(10),
        purpose: z.enum(["signup", "login", "loan_application"]),
      }))
      .mutation(async ({ input }) => {
        if (!isValidPhoneNumber(input.phone)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid phone number" });
        }
        const result = await createPhoneOTP(input.phone, input.purpose);
        if (!result.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Failed to send SMS" });
        }
        return { success: true };
      }),

    verifyCode: publicProcedure
      .input(z.object({
        phone: z.string(),
        code: z.string().length(6),
        purpose: z.enum(["signup", "login", "loan_application"]),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await verifyPhoneOTP(input.phone, input.code, input.purpose);
        if (!result.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error || "Invalid code" });
        }

        if (input.purpose === "login" || input.purpose === "signup") {
          const database = await getDb();
          const formattedPhone = formatPhoneNumber(input.phone);
          
          let user;
          const userResult = await database.select().from(users)
            .where(eq(users.phoneNumber, formattedPhone))
            .limit(1);
          user = userResult[0];

          if (!user && input.purpose === "signup") {
            const name = input.firstName && input.lastName
              ? `${input.firstName} ${input.lastName}`
              : `User${formattedPhone.slice(-4)}`;

            const userIdResult = await database.insert(users).values({
              name,
              email: input.email || null,
              phoneNumber: formattedPhone,
              loginMethod: "phone",
              role: "user",
            }).returning({ id: users.id });

            const newUserResult = await database.select().from(users)
              .where(eq(users.id, userIdResult[0].id))
              .limit(1);
            user = newUserResult[0];
          }

          if (user) {
            await database.update(users)
              .set({ lastSignedIn: new Date() })
              .where(eq(users.id, user.id));

            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, user.id.toString(), cookieOptions);

            return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
          }
        }

        return { success: true };
      }),

    resendCode: publicProcedure
      .input(z.object({
        phone: z.string(),
        purpose: z.enum(["signup", "login", "loan_application"]),
      }))
      .mutation(async ({ input }) => {
        const result = await resendPhoneOTP(input.phone, input.purpose);
        if (!result.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Failed to resend" });
        }
        return { success: true };
      }),
  }),

  // Users management router (admin only)
  users: router({
    // Get all users
    adminList: adminProcedure.query(async () => {
      try {
        console.log('[Admin] Fetching all users');
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }
        
        const allUsers = await database.select().from(users).orderBy(desc(users.createdAt));
        console.log('[Admin] Found', allUsers.length, 'users');
        return allUsers || [];
      } catch (error) {
        console.error('[Admin] Error fetching users:', error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Failed to fetch users" 
        });
      }
    }),

    // Get user by ID
    adminGetById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return user;
      }),

    // Update user details
    adminUpdate: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log('[Admin] Updating user:', input.id);
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Get current user data before update
        const [currentUser] = await database.select().from(users)
          .where(eq(users.id, input.id));
        
        if (!currentUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const { id, ...updateData } = input;
        
        // Track what fields were changed
        const changedFields: Record<string, { old: any; new: any }> = {};
        
        if (updateData.name && updateData.name !== currentUser.name) {
          changedFields['Name'] = { old: currentUser.name || 'Not set', new: updateData.name };
        }
        if (updateData.email && updateData.email !== currentUser.email) {
          changedFields['Email'] = { old: currentUser.email, new: updateData.email };
        }
        if (updateData.phoneNumber !== undefined && updateData.phoneNumber !== currentUser.phoneNumber) {
          changedFields['Phone Number'] = { old: currentUser.phoneNumber || 'Not set', new: updateData.phoneNumber };
        }
        if (updateData.role && updateData.role !== currentUser.role) {
          changedFields['Account Type'] = { old: currentUser.role, new: updateData.role };
        }
        if (updateData.street && updateData.street !== currentUser.street) {
          changedFields['Street Address'] = { old: currentUser.street || 'Not set', new: updateData.street };
        }
        if (updateData.city && updateData.city !== currentUser.city) {
          changedFields['City'] = { old: currentUser.city || 'Not set', new: updateData.city };
        }
        if (updateData.state && updateData.state !== currentUser.state) {
          changedFields['State'] = { old: currentUser.state || 'Not set', new: updateData.state };
        }
        if (updateData.zipCode && updateData.zipCode !== currentUser.zipCode) {
          changedFields['ZIP Code'] = { old: currentUser.zipCode || 'Not set', new: updateData.zipCode };
        }
        
        // Map phoneNumber to phone for database
        const dbUpdateData: any = {};
        if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
        if (updateData.email !== undefined) dbUpdateData.email = updateData.email;
        if (updateData.phoneNumber !== undefined) dbUpdateData.phoneNumber = updateData.phoneNumber;
        if (updateData.role !== undefined) dbUpdateData.role = updateData.role;
        if (updateData.street !== undefined) dbUpdateData.street = updateData.street;
        if (updateData.city !== undefined) dbUpdateData.city = updateData.city;
        if (updateData.state !== undefined) dbUpdateData.state = updateData.state;
        if (updateData.zipCode !== undefined) dbUpdateData.zipCode = updateData.zipCode;
        
        await database.update(users)
          .set({ ...dbUpdateData, updatedAt: new Date() })
          .where(eq(users.id, id));

        // Send update confirmation email if there are changes
        if (Object.keys(changedFields).length > 0) {
          try {
            const emailAddress = updateData.email || currentUser.email;
            const fullName = updateData.name || currentUser.name || 'User';
            
            // Add a note that the update was made by admin
            const changesWithNote = {
              ...changedFields,
              'Updated By': { old: 'User self-service', new: `Admin (${ctx.user.email})` }
            };
            
            await sendProfileUpdateEmail(emailAddress, fullName, changesWithNote);
            console.log(`[Admin Update] Confirmation email sent to ${emailAddress}`);
          } catch (emailError) {
            console.error('[Admin Update] Failed to send confirmation email:', emailError);
            // Continue - email failure shouldn't block update
          }
        }

        return { success: true };
      }),

    // Delete user
    adminDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        console.log('[Admin] Deleting user:', input.id);
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Check if user has loan applications
        const userLoans = await database.select()
          .from(loanApplications)
          .where(eq(loanApplications.userId, input.id));

        if (userLoans.length > 0) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Cannot delete user with existing loan applications. Please cancel or complete all loans first." 
          });
        }

        await database.delete(users).where(eq(users.id, input.id));
        return { success: true };
      }),

    // Reset user password
    adminResetPassword: adminProcedure
      .input(z.object({ 
        id: z.number(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        console.log('[Admin] Resetting password for user:', input.id);
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        
        await database.update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.id));

        return { success: true };
      }),

    // Get user statistics
    adminGetUserStats: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        const userLoans = await database.select()
          .from(loanApplications)
          .where(eq(loanApplications.userId, input.id));

        const userPayments = await database.select()
          .from(payments)
          .where(eq(payments.userId, input.id));

        const totalLoans = userLoans.length;
        const approvedLoans = userLoans.filter(l => l.status === 'approved' || l.status === 'fee_paid' || l.status === 'disbursed').length;
        const activeLoans = userLoans.filter(l => l.status === 'disbursed').length;
        const totalBorrowed = userLoans.filter(l => l.status === 'disbursed').reduce((sum, l) => sum + (l.approvedAmount || 0), 0);
        const totalPaid = userPayments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);

        return {
          totalLoans,
          approvedLoans,
          activeLoans,
          totalBorrowed,
          totalPaid,
        };
      }),
  }),

  // Loan application router
  loans: router({
    // Submit a new loan application
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().min(1),
        email: z.string().email("Please enter a valid email address"),
        phone: z.string().min(10, "Phone number must be at least 10 digits"),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in format YYYY-MM-DD"),
        ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
        street: z.string().min(1, "Street address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().length(2, "State must be a 2-letter code"),
        zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
        employmentStatus: z.enum(["employed", "self_employed", "unemployed", "retired"]),
        employer: z.string().optional(),
        monthlyIncome: z.number().int().positive("Monthly income must be a positive number"),
        loanType: z.enum(["installment", "short_term"]),
        requestedAmount: z.number().int().positive("Loan amount must be a positive number"),
        loanPurpose: z.string().min(10, "Loan purpose must be at least 10 characters. Please provide more detail about how you'll use the loan."),
        // ID Verification images are now optional - users can upload in dashboard
        idFrontImage: z.string().optional(),
        idBackImage: z.string().optional(),
        selfieImage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log('[Loan Submission] Starting loan application submission for:', input.email);
          
          // Find or create user by email
          console.log('[Loan Submission] Looking up user by email...');
          let user = await db.getUserByEmail(input.email);
          
          if (!user) {
            console.log('[Loan Submission] User not found, creating new user...');
            // Create new user account for the applicant
            const userId = await db.createUser({
              email: input.email,
              name: input.fullName,
              phoneNumber: input.phone,
              role: "user",
              loginMethod: "email",
              street: input.street,
              city: input.city,
              state: input.state,
              zipCode: input.zipCode,
              dateOfBirth: input.dateOfBirth,
              ssn: input.ssn,
            });
            console.log('[Loan Submission] Created user with ID:', userId);
            user = await db.getUserById(userId);
          } else {
            console.log('[Loan Submission] Found existing user with ID:', user.id);
          }
          
          if (!user) {
            console.error('[Loan Submission] Failed to create or retrieve user');
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
          }
          
          // Save ID verification images if provided (optional)
          let idFrontUrl = null;
          let idBackUrl = null;
          let selfieUrl = null;
          
          if (input.idFrontImage) {
            console.log('[Loan Submission] Saving ID verification images...');
            idFrontUrl = await saveBase64Image(input.idFrontImage, `id-front-${user.id}-${Date.now()}`, user.id);
            if (input.idBackImage) {
              idBackUrl = await saveBase64Image(input.idBackImage, `id-back-${user.id}-${Date.now()}`, user.id);
            }
            if (input.selfieImage) {
              selfieUrl = await saveBase64Image(input.selfieImage, `selfie-${user.id}-${Date.now()}`, user.id);
            }
            console.log('[Loan Submission] Images saved successfully');
          } else {
            console.log('[Loan Submission] No ID images provided - user can upload later in dashboard');
          }
          
          console.log('[Loan Submission] Tracking IP location...');
          // Track IP address and location
          const ipLocation = await trackIPLocation(ctx.req);
          console.log('[Loan Submission] IP location tracked:', {
            ip: ipLocation.ipAddress,
            country: ipLocation.country,
            city: ipLocation.city
          });
          
          console.log('[Loan Submission] Creating loan application in database...');
          // Exclude base64 image data from input - we only store URLs
          const { idFrontImage, idBackImage, selfieImage, ...loanData } = input;
          const result = await db.createLoanApplication({
            userId: user.id,
            ...loanData,
            idFrontUrl,
            idBackUrl,
            selfieUrl,
            idVerificationStatus: 'pending',
            ipAddress: ipLocation.ipAddress,
            ipCountry: ipLocation.country,
            ipRegion: ipLocation.region,
            ipCity: ipLocation.city,
            ipTimezone: ipLocation.timezone,
          });
          
          const referenceNumber = result.referenceNumber;
          const insertId = result.insertId;
          console.log('[Loan Submission] Loan application created with reference:', referenceNumber);
          
          console.log('[Loan Submission] Sending confirmation email...');
          // Send confirmation email with reference number
          await sendLoanApplicationSubmittedEmail(
            input.email,
            input.fullName,
            insertId,
            referenceNumber || 'PENDING' // Provide fallback if null
          );
          console.log('[Loan Submission] Email sent successfully');
          
          // TODO: Create proper notification tracking table
          // The current notifications table is for system announcements, not email tracking
          // For now, we skip notification logging since emails are being sent successfully
          /*
          console.log('[Loan Submission] Creating notification record...');
          await db.createNotification({
            userId: user.id,
            loanApplicationId: insertId,
            type: "loan_submitted",
            channel: "email",
            recipient: input.email,
            subject: "Loan Application Received - AmeriLend",
            message: `Your loan application (Ref: ${referenceNumber}) has been submitted and is under review.`,
            status: "sent",
            sentAt: new Date(),
          });
          console.log('[Loan Submission] Notification created successfully');
          */
          
          console.log('[Loan Submission] Submission completed successfully!');
          return { 
            success: true,
            referenceNumber,
          };
        } catch (error) {
          console.error('[Loan Submission] ERROR:', error);
          console.error('[Loan Submission] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          throw error;
        }
      }),

    // Get user's loan applications
    myApplications: protectedProcedure.query(async ({ ctx }) => {
      console.log('[Loans] Fetching applications for user ID:', ctx.user.id);
      const applications = await db.getLoanApplicationsByUserId(ctx.user.id);
      console.log('[Loans] Found', applications.length, 'applications');
      console.log('[Loans] Applications data:', JSON.stringify(applications, null, 2));
      return applications;
    }),

    // Upload ID documents for existing loan application
    uploadIDDocuments: protectedProcedure
      .input(z.object({
        loanApplicationId: z.number(),
        idFrontImage: z.string(),
        idBackImage: z.string(),
        selfieImage: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[ID Upload] Uploading documents for loan:', input.loanApplicationId);

        try {
          const database = await getDb();
          if (!database) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database connection failed. Please try again later.",
            });
          }

          // Verify loan belongs to user
          const [loan] = await database
            .select()
            .from(loanApplications)
            .where(eq(loanApplications.id, input.loanApplicationId));

          if (!loan) {
            throw new Error('Loan application not found');
          }

          if (loan.userId !== ctx.user.id) {
            throw new Error('Unauthorized: This loan application does not belong to you');
          }

          // Save base64 images (ensure they have data URL prefix)
          const idFrontUrl = input.idFrontImage.startsWith('data:')
            ? input.idFrontImage
            : `data:image/jpeg;base64,${input.idFrontImage}`;

          const idBackUrl = input.idBackImage.startsWith('data:')
            ? input.idBackImage
            : `data:image/jpeg;base64,${input.idBackImage}`;

          const selfieUrl = input.selfieImage.startsWith('data:')
            ? input.selfieImage
            : `data:image/jpeg;base64,${input.selfieImage}`;

          console.log('[ID Upload] Processing ID documents (base64)');

          // Update loan application with ID URLs
          await database
            .update(loanApplications)
            .set({
              idFrontUrl,
              idBackUrl,
              selfieUrl,
              idVerificationStatus: 'pending',
            })
            .where(eq(loanApplications.id, input.loanApplicationId));

          console.log('[ID Upload] Successfully updated loan application');

          return {
            success: true,
            message: 'ID documents uploaded successfully',
          };
        } catch (error) {
          console.error('[ID Upload] Error:', error);
          throw error;
        }
      }),

    // Check for existing application by DOB and SSN
    checkExisting: publicProcedure
      .input(z.object({
        dateOfBirth: z.string(),
        ssn: z.string().min(11),
      }))
      .mutation(async ({ input }) => {
        console.log('[Loans] Checking for existing application with DOB and SSN');

        try {
          const database = await getDb();
          if (!database) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database not available",
            });
          }

          // Query database for applications matching DOB and SSN
          const existingApps = await database
            .select()
            .from(loanApplications)
            .where(eq(loanApplications.dateOfBirth, input.dateOfBirth))
            .execute();

          // Filter by SSN (in case we need to compare encrypted values)
          const matchingApp = existingApps.find(app => app.ssn === input.ssn);

          if (matchingApp) {
            console.log('[Loans] Found existing application:', matchingApp.referenceNumber);
            return {
              exists: true,
              application: {
                referenceNumber: matchingApp.referenceNumber,
                status: matchingApp.status,
                createdAt: matchingApp.createdAt,
                loanAmount: matchingApp.requestedAmount, // Use requestedAmount from schema
                email: matchingApp.email, // Include email for masking on frontend
              }
            };
          }

          console.log('[Loans] No existing application found');
          return { exists: false };
        } catch (error) {
          console.error('[Loans] Error checking existing application:', error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to check for existing application"
          });
        }
      }),

    // Track application by reference number (public - no authentication required)
    trackByReference: publicProcedure
      .input(z.object({ 
        referenceNumber: z.string()
          .min(1)
          .transform(val => val.trim().split(',')[0].split(' ')[0]) // Extract only the reference number, remove any concatenated text
      }))
      .query(async ({ input }) => {
        console.log('[Track Loan] Searching for reference number:', input.referenceNumber);
        const application = await db.getLoanApplicationByReferenceNumber(input.referenceNumber);
        if (!application) {
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "No application found with this reference number" 
          });
        }
        
        // Return limited information for privacy
        return {
          referenceNumber: application.referenceNumber,
          status: application.status,
          requestedAmount: application.requestedAmount,
          approvedAmount: application.approvedAmount,
          loanType: application.loanType,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
          // Don't expose personal information
          applicantInitials: application.fullName.split(' ').map(n => n[0]).join(''),
        };
      }),

    // Get single loan application by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
        }
        // Users can only view their own applications, admins can view all
        if (ctx.user.role !== "admin" && application.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return application;
      }),

    // Admin: Get all loan applications
    adminList: protectedProcedure.query(async ({ ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        console.log('[Admin] Fetching all loan applications for admin:', ctx.user.email);
        const applications = await db.getAllLoanApplications();
        console.log('[Admin] Found', applications.length, 'loan applications');
        return applications || [];
      } catch (error) {
        console.error('[Admin] Error fetching loan applications:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error instanceof Error ? error.message : "Failed to fetch loan applications" 
        });
      }
    }),

    // Admin: Approve loan application
    adminApprove: protectedProcedure
      .input(z.object({
        id: z.number(),
        approvedAmount: z.number().int().positive(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN",
            message: "Admin access required to approve loans"
          });
        }

        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ 
            code: "NOT_FOUND",
            message: "Loan application not found" 
          });
        }

        // Calculate processing fee
        const feeConfig = await db.getActiveFeeConfiguration();
        let processingFeeAmount: number;

        if (feeConfig?.calculationMode === "percentage") {
          // Percentage mode: basis points (200 = 2.00%)
          processingFeeAmount = Math.round((input.approvedAmount * feeConfig.percentageRate) / 10000);
        } else if (feeConfig?.calculationMode === "fixed") {
          // Fixed fee mode
          processingFeeAmount = feeConfig.fixedFeeAmount;
        } else {
          // Default to 3.6% processing fee (360 basis points)
          processingFeeAmount = Math.round((input.approvedAmount * 360) / 10000);
        }

        // Update database first
        await db.updateLoanApplicationStatus(input.id, "approved", {
          approvedAmount: input.approvedAmount,
          processingFeeAmount,
          adminNotes: input.adminNotes,
          approvedAt: new Date(),
        });

        console.log(`[Loan Approval] Loan #${input.id} approved in database for $${(input.approvedAmount / 100).toFixed(2)}`);

        // Send approval email to user (non-blocking - log errors but don't fail the approval)
        let emailSent = false;
        try {
          emailSent = await sendLoanApprovalEmail(
            application.email,
            application.fullName,
            input.id,
            input.approvedAmount,
            processingFeeAmount
          );
          console.log(`[Loan Approval] Email sent successfully to ${application.email}`);
        } catch (emailError) {
          console.error(`[Loan Approval] Email failed to send to ${application.email}:`, emailError);
          // Continue processing - email failure shouldn't block approval
        }
        
        // Log notification
        try {
          await db.createNotification({
            userId: application.userId,
            loanApplicationId: input.id,
            type: "loan_approved",
            channel: "email",
            recipient: application.email,
            subject: "🎉 Loan Approved - AmeriLend",
            message: `Your loan has been approved for $${(input.approvedAmount / 100).toFixed(2)}.`,
            status: emailSent ? "sent" : "failed",
            sentAt: emailSent ? new Date() : null,
          });
        } catch (notifError) {
          console.error('[Loan Approval] Failed to log notification:', notifError);
          // Continue - notification logging failure shouldn't block approval
        }

        return { 
          success: true, 
          processingFeeAmount,
          emailSent,
          warning: !emailSent ? "Loan approved but notification email failed to send. You may need to contact the applicant directly." : undefined
        };
      }),

    // Admin: Reject loan application
    adminReject: protectedProcedure
      .input(z.object({
        id: z.number(),
        rejectionReason: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.updateLoanApplicationStatus(input.id, "rejected", {
          rejectionReason: input.rejectionReason,
        });

        // Send rejection email to user
        await sendLoanRejectionEmail(
          application.email,
          application.fullName,
          input.id,
          input.rejectionReason
        );
        
        // Log notification
        await db.createNotification({
          userId: application.userId,
          loanApplicationId: input.id,
          type: "loan_rejected",
          channel: "email",
          recipient: application.email,
          subject: "Loan Application Update - AmeriLend",
          message: `Unfortunately, your loan application was not approved.`,
          status: "sent",
          sentAt: new Date(),
        });

        return { success: true };
      }),

    // Admin: Approve ID verification
    adminApproveIdVerification: adminProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ 
            code: "NOT_FOUND",
            message: "Application not found in database"
          });
        }

        // Get user details for email
        const database = await getDb();
        const [user] = await database
          .select()
          .from(users)
          .where(eq(users.id, application.userId));

        // Update database first
        await db.updateLoanApplication(input.id, {
          idVerificationStatus: 'verified',
          idVerificationNotes: input.notes,
        });

        console.log(`[ID Verification] Approved for application #${input.id}`);

        // Send approval email to user (non-blocking)
        let emailSent = false;
        if (user && user.email) {
          try {
            await sendIDVerificationApprovalEmail(
              user.email,
              application.fullName || 'Applicant',
              application.id,
              application.referenceNumber || 'N/A'
            );
            emailSent = true;
            console.log('[ID Verification] Approval email sent to:', user.email);
          } catch (error) {
            console.error('[ID Verification] Failed to send approval email:', error);
            // Don't fail the request if email fails
          }
        }

        return { 
          success: true,
          emailSent,
          warning: !emailSent ? "ID approved but notification email failed to send" : undefined
        };
      }),

    // Admin: Reject ID verification
    adminRejectIdVerification: adminProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ 
            code: "NOT_FOUND",
            message: "Application not found in database"
          });
        }

        // Get user details for email
        const database = await getDb();
        const [user] = await database
          .select()
          .from(users)
          .where(eq(users.id, application.userId));

        // Update database first
        await db.updateLoanApplication(input.id, {
          idVerificationStatus: 'rejected',
          idVerificationNotes: input.reason,
        });

        console.log(`[ID Verification] Rejected for application #${input.id}: ${input.reason}`);

        // Send rejection email with upload link to user (non-blocking)
        let emailSent = false;
        if (user && user.email) {
          try {
            // Construct the upload URL - adjust domain based on environment
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://yourdomain.com' 
              : 'http://localhost:5173';
            const uploadUrl = `${baseUrl}/upload-id/${application.id}`;

            await sendIDVerificationRejectionEmail(
              user.email,
              application.fullName || 'Applicant',
              application.id,
              application.referenceNumber || 'N/A',
              input.reason,
              uploadUrl
            );
            emailSent = true;
            console.log('[ID Verification] Rejection email sent to:', user.email);
          } catch (error) {
            console.error('[ID Verification] Failed to send rejection email:', error);
            // Don't fail the request if email fails
          }
        }

        return { 
          success: true,
          emailSent,
          warning: !emailSent ? "ID rejected but notification email failed to send" : undefined
        };
      }),

    // Admin: Verify payment (mark processing fee as verified)
    adminVerifyPayment: adminProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Loan application not found" });
        }

        // Check if processing fee is marked as paid
        if (!application.processingFeePaid) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Cannot verify payment - processing fee not yet marked as paid" 
          });
        }

        // Update payment verification status
        await db.updateLoanApplication(input.id, {
          paymentVerified: 1,
          paymentVerifiedBy: ctx.user.id,
          paymentVerifiedAt: new Date(),
          paymentVerificationNotes: input.notes,
          status: 'fee_paid', // Move to fee_paid status once verified
        });

        // Create notification for user
        await db.createNotification({
          userId: application.userId,
          loanApplicationId: application.id,
          type: 'payment_confirmed',
          channel: 'email',
          recipient: application.email,
          subject: 'Payment Verified - AmeriLend',
          message: `Your processing fee payment for loan application ${application.referenceNumber || 'N/A'} has been verified. Your loan will be disbursed shortly.`,
          status: 'sent',
          sentAt: new Date(),
        });

        console.log(`[Admin] Payment verified for loan ${application.id} by admin ${ctx.user.id}`);
        return { success: true };
      }),

    // Admin: Reject payment verification
    adminRejectPaymentVerification: adminProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().min(1, "Please provide a reason for rejecting the payment"),
      }))
      .mutation(async ({ input, ctx }) => {
        const application = await db.getLoanApplicationById(input.id);
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Loan application not found" });
        }

        // Update payment verification to rejected
        await db.updateLoanApplication(input.id, {
          paymentVerified: 0,
          paymentVerifiedBy: ctx.user.id,
          paymentVerifiedAt: new Date(),
          paymentVerificationNotes: input.reason,
          processingFeePaid: 0, // Reset payment status
          status: 'approved', // Move back to approved status
        });

        // Create notification for user
        await db.createNotification({
          userId: application.userId,
          loanApplicationId: application.id,
          type: 'loan_rejected',
          channel: 'email',
          recipient: application.email,
          subject: 'Payment Verification Failed - AmeriLend',
          message: `Your processing fee payment for loan application ${application.referenceNumber || 'N/A'} could not be verified. Reason: ${input.reason}. Please submit payment again.`,
          status: 'sent',
          sentAt: new Date(),
        });

        console.log(`[Admin] Payment rejected for loan ${application.id} by admin ${ctx.user.id}`);
        return { success: true };
      }),

    // Get admin statistics
    getAdminStats: adminProcedure.query(async () => {
      try {
        console.log('[Admin Stats] Fetching statistics...');
        const allLoans = await db.getAllLoanApplications();
        console.log('[Admin Stats] Found', allLoans.length, 'total loans');
        
        // Get all payments using direct database query
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }
        const allPayments = await database.select().from(payments);
        console.log('[Admin Stats] Found', allPayments.length, 'total payments');
        
        const totalApplications = allLoans.length || 0;
        const pendingApplications = allLoans.filter(l => l.status === 'pending' || l.status === 'under_review').length || 0;
        const approvedLoans = allLoans.filter(l => l.status === 'approved' || l.status === 'fee_paid' || l.status === 'disbursed').length || 0;
        const rejectedLoans = allLoans.filter(l => l.status === 'rejected').length || 0;
        const disbursedLoans = allLoans.filter(l => l.status === 'disbursed').length || 0;
        
        const totalRequested = allLoans.reduce((sum, l) => sum + (l.requestedAmount || 0), 0) || 0;
        const totalApproved = allLoans.filter(l => l.approvedAmount).reduce((sum, l) => sum + (l.approvedAmount || 0), 0) || 0;
        const totalDisbursed = allLoans.filter(l => l.status === 'disbursed' && l.approvedAmount).reduce((sum, l) => sum + (l.approvedAmount || 0), 0) || 0;
        
        const totalFeesPaid = allPayments.filter(p => p.status === 'succeeded').reduce((sum: number, p) => sum + (p.amount || 0), 0) || 0;
        const totalFeesProcessing = allPayments.filter(p => p.status === 'processing').reduce((sum: number, p) => sum + (p.amount || 0), 0) || 0;
        
        const pendingIdVerification = allLoans.filter(l => l.idVerificationStatus === 'pending').length || 0;
        
        const stats = {
          totalApplications,
          pendingApplications,
          approvedLoans,
          rejectedLoans,
          disbursedLoans,
          totalRequested,
          totalApproved,
          totalDisbursed,
          totalFeesPaid,
          totalFeesProcessing,
          pendingIdVerification,
          approvalRate: totalApplications > 0 ? ((approvedLoans / totalApplications) * 100) : 0,
          averageLoanAmount: approvedLoans > 0 ? (totalApproved / approvedLoans) : 0,
        };
        
        console.log('[Admin Stats] Stats calculated:', stats);
        return stats;
      } catch (error) {
        console.error('[Admin Stats] Error:', error);
        // Return default stats if error occurs
        return {
          totalApplications: 0,
          pendingApplications: 0,
          approvedLoans: 0,
          rejectedLoans: 0,
          disbursedLoans: 0,
          totalRequested: 0,
          totalApproved: 0,
          totalDisbursed: 0,
          totalFeesPaid: 0,
          totalFeesProcessing: 0,
          pendingIdVerification: 0,
          approvalRate: 0,
          averageLoanAmount: 0,
        };
      }
    }),

    // Get AI & Automation statistics
    getAIAutomationStats: adminProcedure.query(async () => {
      try {
        console.log('[AI Stats] Fetching AI & Automation statistics...');
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Fetch all necessary data in parallel
        const [allLoans, allPayments, allSupport] = await Promise.all([
          db.getAllLoanApplications(),
          database.select().from(payments),
          database.select().from(supportMessages),
        ]);

        console.log('[AI Stats] Data fetched - Loans:', allLoans.length, 'Payments:', allPayments.length, 'Support:', allSupport.length);

        // Support/Chat Statistics
        const totalConversations = allSupport.length;
        const resolvedConversations = allSupport.filter(s => s.status === 'resolved' || s.status === 'closed').length;
        const resolutionRate = totalConversations > 0 ? (resolvedConversations / totalConversations * 100) : 0;
        
        // Calculate average response time (time from created to responded)
        const respondedMessages = allSupport.filter(s => s.respondedAt && s.createdAt);
        let avgResponseTimeMinutes = 0;
        if (respondedMessages.length > 0) {
          const totalResponseTime = respondedMessages.reduce((sum, msg) => {
            const responseTime = new Date(msg.respondedAt!).getTime() - new Date(msg.createdAt).getTime();
            return sum + responseTime;
          }, 0);
          avgResponseTimeMinutes = Math.round((totalResponseTime / respondedMessages.length) / 1000 / 60); // Convert to minutes
        }

        // ID Verification Statistics (AI-powered document verification)
        const totalIDVerifications = allLoans.filter(l => l.idFrontUrl || l.idBackUrl).length;
        const approvedIDs = allLoans.filter(l => l.idVerificationStatus === 'verified').length;
        const rejectedIDs = allLoans.filter(l => l.idVerificationStatus === 'rejected').length;
        const pendingIDs = allLoans.filter(l => l.idVerificationStatus === 'pending').length;
        const idVerificationAccuracy = totalIDVerifications > 0 
          ? ((approvedIDs / totalIDVerifications) * 100) 
          : 0;

        // Fraud Detection (based on rejection rate and payment failures)
        const totalApplications = allLoans.length;
        const suspiciousApplications = allLoans.filter(l => 
          l.status === 'rejected' || 
          (l.idVerificationStatus === 'rejected')
        ).length;
        const fraudDetectionRate = totalApplications > 0 
          ? (((totalApplications - suspiciousApplications) / totalApplications) * 100)
          : 100;

        // Credit Risk Model (based on approval accuracy)
        const processedApplications = allLoans.filter(l => 
          l.status === 'approved' || l.status === 'rejected' || l.status === 'disbursed' || l.status === 'fee_paid'
        ).length;
        const approvedApplications = allLoans.filter(l => 
          l.status === 'approved' || l.status === 'disbursed' || l.status === 'fee_paid'
        ).length;
        const creditRiskAccuracy = processedApplications > 0 
          ? ((approvedApplications / processedApplications) * 100)
          : 0;

        // Payment Processing Statistics
        const successfulPayments = allPayments.filter(p => p.status === 'succeeded').length;
        const failedPayments = allPayments.filter(p => p.status === 'failed').length;
        const totalPayments = allPayments.length;
        const paymentSuccessRate = totalPayments > 0 ? ((successfulPayments / totalPayments) * 100) : 0;

        // Automated Workflow Status (based on actual data)
        const autoApprovalEnabled = allLoans.some(l => l.status === 'approved'); // Check if auto-approval is working
        const paymentRemindersEnabled = true; // Always enabled
        const creditCheckEnabled = allLoans.length > 0; // If we have loans, credit check is running
        const documentVerificationActive = totalIDVerifications > 0;
        const fraudDetectionActive = totalApplications > 0;

        const stats = {
          // Support/Chat metrics
          totalConversations,
          resolutionRate: Math.round(resolutionRate * 10) / 10,
          avgResponseTimeMinutes,
          
          // AI Model Performance
          creditRiskAccuracy: Math.round(creditRiskAccuracy * 10) / 10,
          fraudDetectionRate: Math.round(fraudDetectionRate * 10) / 10,
          idVerificationAccuracy: Math.round(idVerificationAccuracy * 10) / 10,
          paymentSuccessRate: Math.round(paymentSuccessRate * 10) / 10,
          
          // Document verification details
          totalIDVerifications,
          approvedIDs,
          rejectedIDs,
          pendingIDs,
          
          // Automated workflows
          workflows: {
            autoApproval: autoApprovalEnabled,
            paymentReminders: paymentRemindersEnabled,
            creditCheck: creditCheckEnabled,
            documentVerification: documentVerificationActive,
            fraudDetection: fraudDetectionActive,
          },
          
          // Additional metrics
          totalPayments,
          successfulPayments,
          failedPayments,
        };

        console.log('[AI Stats] Stats calculated:', stats);
        return stats;
      } catch (error) {
        console.error('[AI Stats] Error:', error);
        // Return default stats if error occurs
        return {
          totalConversations: 0,
          resolutionRate: 0,
          avgResponseTimeMinutes: 0,
          creditRiskAccuracy: 0,
          fraudDetectionRate: 0,
          idVerificationAccuracy: 0,
          paymentSuccessRate: 0,
          totalIDVerifications: 0,
          approvedIDs: 0,
          rejectedIDs: 0,
          pendingIDs: 0,
          workflows: {
            autoApproval: false,
            paymentReminders: true,
            creditCheck: false,
            documentVerification: false,
            fraudDetection: false,
          },
          totalPayments: 0,
          successfulPayments: 0,
          failedPayments: 0,
        };
      }
    }),

    // Save draft application (auto-save functionality)
    saveDraft: publicProcedure
      .input(z.object({
        email: z.string().email(),
        draftData: z.object({
          fullName: z.string().optional(),
          phone: z.string().optional(),
          dateOfBirth: z.string().optional(),
          ssn: z.string().optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          employmentStatus: z.string().optional(),
          employer: z.string().optional(),
          monthlyIncome: z.string().optional(),
          loanType: z.string().optional(),
          requestedAmount: z.string().optional(),
          loanPurpose: z.string().optional(),
        }),
        currentStep: z.number().int().min(1).max(5),
      }))
      .mutation(async ({ input }) => {
        console.log('[Draft] Saving draft for email:', input.email);
        
        const draftId = await db.saveDraftApplication({
          email: input.email,
          draftData: JSON.stringify(input.draftData),
          currentStep: input.currentStep,
        });
        
        console.log('[Draft] Draft saved with ID:', draftId);
        return { success: true, draftId };
      }),

    // Load draft application
    loadDraft: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .query(async ({ input }) => {
        console.log('[Draft] Loading draft for email:', input.email);
        
        const draft = await db.getDraftByEmail(input.email);
        
        if (!draft) {
          console.log('[Draft] No draft found');
          return null;
        }
        
        // Check if expired
        if (new Date(draft.expiresAt) < new Date()) {
          console.log('[Draft] Draft expired, deleting...');
          await db.deleteDraft(input.email);
          return null;
        }
        
        console.log('[Draft] Draft found, returning data');
        return {
          draftData: JSON.parse(draft.draftData),
          currentStep: draft.currentStep,
          updatedAt: draft.updatedAt,
        };
      }),

    // Delete draft application
    deleteDraft: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        console.log('[Draft] Deleting draft for email:', input.email);
        await db.deleteDraft(input.email);
        return { success: true };
      }),
  }),

  // Fee configuration router (admin only)
  feeConfig: router({
    // Get active fee configuration
    getActive: publicProcedure.query(async () => {
      const config = await db.getActiveFeeConfiguration();
      if (!config) {
        // Return default configuration
        return {
          calculationMode: "percentage" as const,
          percentageRate: 200, // 2.00%
          fixedFeeAmount: 200, // $2.00
        };
      }
      return config;
    }),

    // Admin: Update fee configuration
    adminUpdate: protectedProcedure
      .input(z.object({
        calculationMode: z.enum(["percentage", "fixed"]),
        percentageRate: z.number().int().min(150).max(250).optional(), // 1.5% - 2.5%
        fixedFeeAmount: z.number().int().min(150).max(250).optional(), // $1.50 - $2.50
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Validate that the appropriate field is provided
        if (input.calculationMode === "percentage" && !input.percentageRate) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Percentage rate is required for percentage mode" 
          });
        }
        if (input.calculationMode === "fixed" && !input.fixedFeeAmount) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Fixed fee amount is required for fixed mode" 
          });
        }

        await db.createFeeConfiguration({
          calculationMode: input.calculationMode,
          percentageRate: input.percentageRate || 200,
          fixedFeeAmount: input.fixedFeeAmount || 200,
          updatedBy: ctx.user.id,
        });

        return { success: true };
      }),
  }),

  // Payment router
  payments: router({
    // Get Authorize.net Accept.js configuration
    getAuthorizeNetConfig: publicProcedure.query(() => {
      return getAcceptJsConfig();
    }),

    // Get supported cryptocurrencies with rates
    getSupportedCryptos: publicProcedure.query(async () => {
      return getSupportedCryptos();
    }),

    // Convert USD amount to crypto
    convertToCrypto: publicProcedure
      .input(z.object({
        usdCents: z.number(),
        currency: z.enum(["BTC", "ETH", "USDT", "USDC"]),
      }))
      .query(async ({ input }) => {
        const amount = await convertUSDToCrypto(input.usdCents, input.currency);
        return { amount };
      }),
    // Create payment intent for processing fee (supports multiple payment methods)
    createIntent: protectedProcedure
      .input(z.object({
        loanApplicationId: z.number(),
        paymentMethod: z.enum(["card", "crypto"]).default("card"),
        paymentProvider: z.enum(["stripe", "authorizenet", "crypto"]).optional(),
        cryptoCurrency: z.enum(["BTC", "ETH", "USDT", "USDC"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (application.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        if (application.status !== "approved" && application.status !== "fee_pending") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Loan must be approved before payment" 
          });
        }
        
        if (!application.processingFeeAmount) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Processing fee not calculated" 
          });
        }

        // Determine payment provider
        const paymentProvider = input.paymentProvider || 
          (input.paymentMethod === "crypto" ? "crypto" : "stripe");

        // For crypto payments, create charge and get payment address
        let cryptoData;
        if (input.paymentMethod === "crypto" && input.cryptoCurrency) {
          const charge = await createCryptoCharge(
            application.processingFeeAmount,
            input.cryptoCurrency,
            `Processing fee for loan #${input.loanApplicationId}`,
            { loanApplicationId: input.loanApplicationId, userId: ctx.user.id }
          );

          if (!charge.success) {
            throw new TRPCError({ 
              code: "INTERNAL_SERVER_ERROR", 
              message: charge.error || "Failed to create crypto payment" 
            });
          }

          cryptoData = {
            cryptoCurrency: input.cryptoCurrency,
            cryptoAddress: charge.paymentAddress,
            cryptoAmount: charge.cryptoAmount,
            qrCodeDataUrl: charge.qrCodeDataUrl,
            paymentIntentId: charge.chargeId,
          };
        }

        // Create payment record
        await db.createPayment({
          loanApplicationId: input.loanApplicationId,
          userId: ctx.user.id,
          amount: application.processingFeeAmount,
          currency: "USD",
          paymentProvider,
          paymentMethod: input.paymentMethod,
          status: "pending",
          ...cryptoData,
        });

        // Update loan status to fee_pending
        await db.updateLoanApplicationStatus(input.loanApplicationId, "fee_pending");

        return { 
          success: true, 
          amount: application.processingFeeAmount,
          ...cryptoData,
        };
      }),

    // Simulate payment confirmation (in production, this would be a webhook)
    confirmPayment: protectedProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const payment = await db.getPaymentById(input.paymentId);
        
        if (!payment) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (payment.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const application = await db.getLoanApplicationById(payment.loanApplicationId);
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Update payment status
        await db.updatePaymentStatus(input.paymentId, "succeeded", {
          completedAt: new Date(),
        });

        // Update loan application status to fee_paid
        await db.updateLoanApplicationStatus(payment.loanApplicationId, "fee_paid");

        // Send payment confirmation email
        const paymentMethodText = payment.paymentMethod === "crypto" 
          ? `Cryptocurrency (${payment.cryptoCurrency})`
          : `Card ending in ${payment.cardLast4}`;
        
        await sendPaymentConfirmationEmail(
          application.email,
          application.fullName,
          payment.loanApplicationId,
          payment.amount,
          paymentMethodText
        );
        
        // Log notification
        await db.createNotification({
          userId: payment.userId,
          loanApplicationId: payment.loanApplicationId,
          type: "payment_confirmed",
          channel: "email",
          recipient: application.email,
          subject: "✅ Payment Confirmed - AmeriLend",
          message: `Your payment of $${(payment.amount / 100).toFixed(2)} has been confirmed.`,
          status: "sent",
          sentAt: new Date(),
        });

        return { success: true };
      }),

    // Process card payment via Authorize.Net
    processCardPayment: protectedProcedure
      .input(z.object({
        loanApplicationId: z.number(),
        opaqueData: z.object({
          dataDescriptor: z.string(),
          dataValue: z.string(),
        }),
        cardholderName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (application.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        if (application.status !== "approved" && application.status !== "fee_pending") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Loan must be approved before payment" 
          });
        }
        
        if (!application.processingFeeAmount) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Processing fee not calculated" 
          });
        }

        // Process payment through Authorize.Net
        const authNetResult = await createAuthorizeNetTransaction(
          application.processingFeeAmount,
          input.opaqueData,
          `Processing fee for loan #${input.loanApplicationId}`
        );

        if (!authNetResult.success) {
          // Send payment declined email
          await sendEmail({
            to: application.email,
            subject: "❌ Payment Declined - AmeriLend",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Declined</h2>
                <p>Dear ${application.fullName},</p>
                <p>We were unable to process your payment for the processing fee.</p>
                <div style="background-color: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                  <strong>Reason:</strong> ${authNetResult.error || "Payment processing failed"}
                </div>
                <p><strong>Loan Application:</strong> #${input.loanApplicationId}</p>
                <p><strong>Amount:</strong> $${(application.processingFeeAmount / 100).toFixed(2)}</p>
                <p>Please verify your payment information and try again, or contact your card issuer if the problem persists.</p>
                <p>You can retry the payment from your dashboard at any time.</p>
                <p>If you need assistance, please contact our support team.</p>
                <p>Best regards,<br>The AmeriLend Team</p>
              </div>
            `,
          });

          // Log notification
          await db.createNotification({
            userId: ctx.user.id,
            loanApplicationId: input.loanApplicationId,
            type: "payment_confirmed",
            channel: "email",
            recipient: application.email,
            subject: "❌ Payment Declined - AmeriLend",
            message: `Payment declined: ${authNetResult.error || "Payment processing failed"}`,
            status: "sent",
            sentAt: new Date(),
          });

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: authNetResult.error || "Payment processing failed",
          });
        }

        // Create payment record
        await db.createPayment({
          loanApplicationId: input.loanApplicationId,
          userId: ctx.user.id,
          amount: application.processingFeeAmount,
          currency: "USD",
          paymentProvider: "authorizenet",
          paymentMethod: "card",
          status: "succeeded",
          paymentIntentId: authNetResult.transactionId,
          cardLast4: authNetResult.cardLast4,
          cardBrand: authNetResult.cardBrand,
          completedAt: new Date(),
        });

        // Get the payment ID by searching for the transaction
        const paymentRecords = await db.getPaymentsByLoanApplicationId(input.loanApplicationId);
        const latestPayment = paymentRecords[paymentRecords.length - 1];

        // Update processing fee paid status
        await db.updateLoanApplicationStatus(input.loanApplicationId, "fee_paid", {
          processingFeePaid: 1,
          processingFeePaymentId: latestPayment?.id || null,
        });

        // Send payment confirmation email
        await sendPaymentConfirmationEmail(
          application.email,
          application.fullName,
          input.loanApplicationId,
          application.processingFeeAmount,
          `${authNetResult.cardBrand} ending in ${authNetResult.cardLast4}`
        );
        
        // Log notification
        await db.createNotification({
          userId: ctx.user.id,
          loanApplicationId: input.loanApplicationId,
          type: "payment_confirmed",
          channel: "email",
          recipient: application.email,
          subject: "✅ Payment Confirmed - AmeriLend",
          message: `Your payment of $${(application.processingFeeAmount / 100).toFixed(2)} has been confirmed.`,
          status: "sent",
          sentAt: new Date(),
        });

        return { 
          success: true,
          transactionId: authNetResult.transactionId,
        };
      }),

    // Process crypto payment
    processCryptoPayment: protectedProcedure
      .input(z.object({
        loanApplicationId: z.number(),
        cryptoCurrency: z.enum(["BTC", "ETH", "USDT", "USDC"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (application.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        if (application.status !== "approved" && application.status !== "fee_pending") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Loan must be approved before payment" 
          });
        }
        
        if (!application.processingFeeAmount) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Processing fee not calculated" 
          });
        }

        // Create crypto charge
        const charge = await createCryptoCharge(
          application.processingFeeAmount,
          input.cryptoCurrency,
          `Processing fee for loan #${input.loanApplicationId}`,
          { loanApplicationId: input.loanApplicationId, userId: ctx.user.id }
        );

        if (!charge.success) {
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: charge.error || "Failed to create crypto payment" 
          });
        }

        // Create payment record (pending until blockchain confirmation)
        const paymentRecord = await db.createPayment({
          loanApplicationId: input.loanApplicationId,
          userId: ctx.user.id,
          amount: application.processingFeeAmount,
          currency: "USD",
          paymentProvider: "crypto",
          paymentMethod: "crypto",
          status: "pending",
          paymentIntentId: charge.chargeId,
          cryptoCurrency: input.cryptoCurrency,
          cryptoAddress: charge.paymentAddress,
          cryptoAmount: charge.cryptoAmount,
        });

        // Update loan status to fee_pending
        await db.updateLoanApplicationStatus(input.loanApplicationId, "fee_pending");

        return { 
          success: true,
          chargeId: charge.chargeId,
          paymentAddress: charge.paymentAddress,
          cryptoAmount: charge.cryptoAmount,
          cryptoCurrency: input.cryptoCurrency,
          qrCodeDataUrl: charge.qrCodeDataUrl,
        };
      }),

    // Get payments for a loan application
    getByLoanId: protectedProcedure
      .input(z.object({ loanApplicationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (application.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return db.getPaymentsByLoanApplicationId(input.loanApplicationId);
      }),

    // Verify crypto payment on blockchain (manual trigger)
    verifyCryptoPayment: adminProcedure
      .input(z.object({
        paymentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const result = await checkPaymentById(input.paymentId);
        
        if (!result.success) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: result.message 
          });
        }

        return {
          success: true,
          verified: result.verified,
          txHash: result.txHash,
          message: result.message
        };
      }),

    // Admin: Get all payments
    adminGetAll: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "succeeded", "failed", "refunded"]).optional(),
        paymentMethod: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        try {
          const database = await getDb();
          
          const baseQuery = database
            .select()
            .from(db.payments)
            .orderBy(desc(db.payments.createdAt))
            .limit(input.limit)
            .offset(input.offset);
          
          const payments = input.status
            ? await database
                .select()
                .from(db.payments)
                .where(eq(db.payments.status, input.status))
                .orderBy(desc(db.payments.createdAt))
                .limit(input.limit)
                .offset(input.offset)
            : await baseQuery;
          
          // Get total count
          const totalPayments = input.status
            ? await database.select().from(db.payments).where(eq(db.payments.status, input.status))
            : await database.select().from(db.payments);
          
          return {
            payments: payments || [],
            total: totalPayments.length || 0,
            hasMore: input.offset + payments.length < totalPayments.length,
          };
        } catch (error) {
          console.error('[Admin Payments] Error:', error);
          return {
            payments: [],
            total: 0,
            hasMore: false,
          };
        }
      }),

    // Admin: Get payment statistics
    adminGetStats: adminProcedure.query(async () => {
      try {
        const database = await getDb();
        
        const allPayments = await database.select().from(db.payments);
        
        const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const succeededPayments = allPayments.filter(p => p.status === "succeeded");
        const succeededAmount = succeededPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        return {
          total: allPayments.length || 0,
          succeeded: succeededPayments.length || 0,
          pending: allPayments.filter(p => p.status === "pending").length || 0,
          failed: allPayments.filter(p => p.status === "failed").length || 0,
          totalAmount: totalAmount || 0,
          succeededAmount: succeededAmount || 0,
        };
      } catch (error) {
        console.error('[Payment Stats] Error:', error);
        // Return default stats if error occurs
        return {
          total: 0,
          succeeded: 0,
          pending: 0,
          failed: 0,
          totalAmount: 0,
          succeededAmount: 0,
        };
      }
    }),
  }),

  // Disbursement router (admin only)
  disbursements: router({
    // Admin: Initiate loan disbursement
    adminInitiate: protectedProcedure
      .input(z.object({
        loanApplicationId: z.number(),
        accountHolderName: z.string().min(1),
        accountNumber: z.string().min(1),
        routingNumber: z.string().min(9),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // CRITICAL: Validate that processing fee has been paid
        if (application.status !== "fee_paid") {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Processing fee must be paid before disbursement" 
          });
        }

        // Check if disbursement already exists
        const existingDisbursement = await db.getDisbursementByLoanApplicationId(input.loanApplicationId);
        if (existingDisbursement) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Disbursement already initiated for this loan" 
          });
        }

        // Create disbursement record
        await db.createDisbursement({
          loanApplicationId: input.loanApplicationId,
          userId: application.userId,
          amount: application.approvedAmount!,
          accountHolderName: input.accountHolderName,
          accountNumber: input.accountNumber,
          routingNumber: input.routingNumber,
          adminNotes: input.adminNotes,
          status: "pending",
          initiatedBy: ctx.user.id,
        });

        // Update loan status to disbursed
        await db.updateLoanApplicationStatus(input.loanApplicationId, "disbursed", {
          disbursedAt: new Date(),
        });

        // Send disbursement email
        const accountLast4 = input.accountNumber.slice(-4);
        await sendLoanDisbursementEmail(
          application.email,
          application.fullName,
          input.loanApplicationId,
          application.approvedAmount!,
          accountLast4
        );
        
        // Log notification
        await db.createNotification({
          userId: application.userId,
          loanApplicationId: input.loanApplicationId,
          type: "loan_disbursed",
          channel: "email",
          recipient: application.email,
          subject: "🎉 Loan Disbursed - AmeriLend",
          message: `Your loan of $${(application.approvedAmount! / 100).toFixed(2)} has been disbursed.`,
          status: "sent",
          sentAt: new Date(),
        });

        return { success: true };
      }),

    // Get disbursement by loan application ID
    getByLoanId: protectedProcedure
      .input(z.object({ loanApplicationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const application = await db.getLoanApplicationById(input.loanApplicationId);
        
        if (!application) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        if (application.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return db.getDisbursementByLoanApplicationId(input.loanApplicationId);
      }),
  }),

  // Legal documents router
  legal: router({
    // Record legal document acceptance
    acceptDocument: protectedProcedure
      .input(z.object({
        documentType: z.enum(["terms_of_service", "privacy_policy", "loan_agreement", "esign_consent"]),
        documentVersion: z.string(),
        loanApplicationId: z.number().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");

        await database.insert(legalAcceptances).values({
          userId: ctx.user.id,
          loanApplicationId: input.loanApplicationId,
          documentType: input.documentType,
          documentVersion: input.documentVersion,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        return { success: true };
      }),

    // Check if user has accepted a specific document
    hasAccepted: protectedProcedure
      .input(z.object({
        documentType: z.enum(["terms_of_service", "privacy_policy", "loan_agreement", "esign_consent"]),
        loanApplicationId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return false;

        const conditions = [
          eq(legalAcceptances.userId, ctx.user.id),
          eq(legalAcceptances.documentType, input.documentType),
        ];

        if (input.loanApplicationId) {
          conditions.push(eq(legalAcceptances.loanApplicationId, input.loanApplicationId));
        }

        const result = await database
          .select()
          .from(legalAcceptances)
          .where(and(...conditions))
          .limit(1);

        return result.length > 0;
      }),

    // Get all acceptances for current user
    getMyAcceptances: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) return [];

        return await database
          .select()
          .from(legalAcceptances)
          .where(eq(legalAcceptances.userId, ctx.user.id));
      }),
  }),

  chat: router({
    sendMessage: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
        includeUserContext: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          let userContext = "";
          
          // If user is authenticated and context is requested, fetch their data
          if (ctx.user && input.includeUserContext) {
            try {
              // Get user's loan applications
              const applications = await db.getLoanApplicationsByUserId(ctx.user.id);
              
              // Get user's payments
              const payments = await db.getPaymentsByUserId(ctx.user.id);
              
              // Build context string
              userContext = `\n\nCURRENT USER CONTEXT (use this to provide personalized assistance):
- User Name: ${ctx.user.name}
- User Email: ${ctx.user.email}
- User ID: ${ctx.user.id}
- Total Applications: ${applications.length}`;

              if (applications.length > 0) {
                const recentApp = applications[0];
                userContext += `\n- Most Recent Application:
  * Reference Number: ${recentApp.referenceNumber || 'N/A'}
  * Status: ${recentApp.status}
  * Loan Type: ${recentApp.loanType === 'installment' ? 'Installment Loan' : 'Short-Term Loan'}
  * Requested Amount: $${(recentApp.requestedAmount / 100).toLocaleString()}`;
                
                if (recentApp.approvedAmount) {
                  userContext += `\n  * Approved Amount: $${(recentApp.approvedAmount / 100).toLocaleString()}`;
                }
                
                if (recentApp.processingFeeAmount) {
                  userContext += `\n  * Processing Fee: $${(recentApp.processingFeeAmount / 100).toLocaleString()}`;
                  userContext += `\n  * Processing Fee Paid: ${recentApp.processingFeePaid ? 'Yes' : 'No'}`;
                }

                if (recentApp.idVerificationStatus) {
                  userContext += `\n  * ID Verification: ${recentApp.idVerificationStatus}`;
                }
                
                userContext += `\n  * Applied On: ${new Date(recentApp.createdAt).toLocaleDateString()}`;
              }

              if (payments.length > 0) {
                userContext += `\n- Total Payments Made: ${payments.length}`;
                const totalPaid = payments
                  .filter(p => p.status === 'completed')
                  .reduce((sum, p) => sum + p.amount, 0);
                userContext += `\n- Total Amount Paid: $${(totalPaid / 100).toLocaleString()}`;
              }

              userContext += `\n\nUSE THIS INFORMATION to provide specific, personalized help. Reference their actual data when relevant. Be proactive in helping them with next steps.`;
            } catch (error) {
              logger.error('Failed to fetch user context for chat', error as Error);
            }
          }

          const systemPrompt = `You are an intelligent AI assistant for AmeriLend, a consumer lending platform. You provide exceptional customer support with deep knowledge and problem-solving capabilities.

YOUR CAPABILITIES:
✓ Answer questions about loan products and services
✓ Help with application process and requirements
✓ Provide account-specific information (when user is logged in)
✓ Guide users through payment processes
✓ Explain fees, terms, and conditions
✓ Troubleshoot common issues
✓ Provide status updates on applications
✓ Offer personalized recommendations

LOAN PRODUCTS:
1. Installment Loans
   - Amount: $1,000 - $50,000
   - Features: Flexible repayment terms, fixed monthly payments
   - Use cases: Home improvements, debt consolidation, major purchases
   - Approval time: 24-48 hours

2. Short-Term Loans
   - Amount: $100 - $5,000
   - Features: Quick approval, short repayment period
   - Use cases: Emergency expenses, unexpected bills
   - Approval time: Same day to 24 hours

KEY INFORMATION:
- Processing Fee: 3.6% of approved loan amount (one-time, due before disbursement)
- Payment Methods: Credit/Debit cards, ACH bank transfer, Cryptocurrency (BTC, ETH, USDT, USDC)
- ID Verification Required: Government-issued ID (front & back) + selfie holding ID
- Contact Support: 1-945-212-1609 or support@amerilendloan.com
- Website: https://amerilendloan.com

APPLICATION PROCESS:
1. Create account or log in
2. Complete 5-step application form
3. Upload ID verification documents
4. Wait for approval (admin reviews)
5. Pay 3.6% processing fee
6. Receive loan disbursement

CUSTOMER SERVICE EXCELLENCE:
- Be warm, professional, and empathetic
- Provide specific, actionable answers
- Use user's actual data when available (see USER CONTEXT below)
- Anticipate follow-up questions
- Offer proactive next steps
- When you don't know something, be honest and direct to human support
- Use clear, simple language (avoid jargon)
- Format responses for readability (use line breaks, bullets)${userContext}`;

          // Build message history for context-aware conversation
          const messages: any[] = [
            { role: "system", content: systemPrompt }
          ];

          // Add conversation history (limit to last 10 messages for token efficiency)
          if (input.conversationHistory && input.conversationHistory.length > 0) {
            const recentHistory = input.conversationHistory.slice(-10);
            messages.push(...recentHistory.map(msg => ({
              role: msg.role,
              content: msg.content,
            })));
          }

          // Add current message
          messages.push({ role: "user", content: input.message });

          const response = await invokeLLM({
            messages,
          });
          
          const reply = (response.choices[0]?.message?.content as string) || "I'm having trouble responding right now. Please contact our support team at 1-945-212-1609.";
          return { reply };
        } catch (error) {
          logger.error('Chat AI error', error as Error);
          return { reply: "I'm experiencing a technical issue. Please call us at 1-945-212-1609 for immediate assistance." };
        }
      }),
  }),

  // ============================================
  // Referral Router
  // ============================================
  referrals: router({
    // Get or create user's referral code
    getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
      const referralCode = await db.createOrGetReferralCode(ctx.user.id);
      return { referralCode };
    }),

    // Get user's referral stats
    getMyStats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getReferralStats(ctx.user.id);
      return stats;
    }),

    // Get user's referral history
    getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
      const referrals = await db.getReferralsByUserId(ctx.user.id);
      
      // Get referred user details (limited info for privacy)
      const referralsWithDetails = await Promise.all(
        referrals.map(async (referral) => {
          const referredUser = await db.getUserById(referral.referredUserId);
          return {
            ...referral,
            referredUserName: referredUser?.name || 'User',
            referredUserInitials: referredUser?.name 
              ? referredUser.name.split(' ').map(n => n[0]).join('')
              : 'U',
          };
        })
      );
      
      return referralsWithDetails;
    }),

    // Validate referral code (public endpoint)
    validateCode: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .query(async ({ input }) => {
        const user = await db.getUserByReferralCode(input.code.toUpperCase());
        return { 
          valid: !!user,
          referrerName: (user && typeof user === 'object' && 'name' in user) ? user.name : null,
        };
      }),
  }),

  // User profile management
  user: router({
    // Update user profile
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if email is already taken by another user
        if (input.email && input.email !== ctx.user.email) {
          const existingUserResult = await database.select().from(users)
            .where(eq(users.email, input.email))
            .limit(1);
          const existingUser = existingUserResult.length > 0 ? existingUserResult[0] : undefined;
          
          if (existingUser) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Email already in use",
            });
          }
        }

        // Track what fields were changed
        const changedFields: Record<string, { old: any; new: any }> = {};
        
        if (input.name && input.name !== ctx.user.name) {
          changedFields['Name'] = { old: ctx.user.name || 'Not set', new: input.name };
        }
        if (input.email && input.email !== ctx.user.email) {
          changedFields['Email'] = { old: ctx.user.email, new: input.email };
        }
        if (input.phoneNumber !== undefined && input.phoneNumber !== ctx.user.phoneNumber) {
          changedFields['Phone Number'] = { old: ctx.user.phoneNumber || 'Not set', new: input.phoneNumber };
        }

        // Update user profile
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;

        await database.update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));

        // Send update confirmation email if there are changes
        if (Object.keys(changedFields).length > 0) {
          try {
            const emailAddress = input.email || ctx.user.email;
            const fullName = input.name || ctx.user.name || 'User';
            await sendProfileUpdateEmail(emailAddress, fullName, changedFields);
            console.log(`[Profile Update] Confirmation email sent to ${emailAddress}`);
          } catch (emailError) {
            console.error('[Profile Update] Failed to send confirmation email:', emailError);
            // Continue - email failure shouldn't block profile update
          }
        }

        return { success: true };
      }),

    // Change password
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Get current user with password
        const userResult = await database.select().from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        const user = userResult.length > 0 ? userResult[0] : undefined;

        if (!user || !user.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password authentication not available for this account",
          });
        }

        // Verify current password
        const isValid = await bcrypt.compare(input.currentPassword, user.password);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 10);

        // Update password
        await database.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
  }),

  // Notifications management
  notifications: router({
    // Get user notifications
    getMyNotifications: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(20),
        unreadOnly: z.boolean().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        let whereClause = eq(notifications.userId, ctx.user.id);
        
        if (input.unreadOnly) {
          whereClause = and(
            eq(notifications.userId, ctx.user.id),
            isNull(notifications.readAt)
          ) as any;
        }

        const notificationList = await database
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(desc(notifications.createdAt))
          .limit(input.limit);

        return notificationList;
      }),

    // Get unread count
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        return { count: 0 };
      }

      const notificationList = await database
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            isNull(notifications.readAt)
          ) as any
        );

      return { count: notificationList.length };
    }),

    // Mark notification as read
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await database
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.id, input.notificationId),
              eq(notifications.userId, ctx.user.id)
            ) as any
          );

        return { success: true };
      }),

    // Mark all as read
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await database
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, ctx.user.id));

      return { success: true };
    }),

    // Delete notification
    deleteNotification: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await database
          .delete(notifications)
          .where(
            and(
              eq(notifications.id, input.notificationId),
              eq(notifications.userId, ctx.user.id)
            ) as any
          );

        return { success: true };
      }),

    // Admin: Get all notifications
    adminGetAll: adminProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        userId: z.number().optional(),
        type: z.enum(["loan_status", "payment_reminder", "payment_received", "disbursement", "system", "referral"]).optional(),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        let whereConditions: any[] = [];
        
        if (input.userId) {
          whereConditions.push(eq(notifications.userId, input.userId));
        }
        
        if (input.type) {
          whereConditions.push(eq(notifications.type, input.type));
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const notificationList = await database
          .select({
            id: notifications.id,
            userId: notifications.userId,
            subject: notifications.subject,
            message: notifications.message,
            type: notifications.type,
            readAt: notifications.readAt,
            createdAt: notifications.createdAt,
            userName: users.name,
            userEmail: users.email,
          })
          .from(notifications)
          .leftJoin(users, eq(notifications.userId, users.id))
          .where(whereClause)
          .orderBy(desc(notifications.createdAt))
          .limit(input.limit);

        return notificationList;
      }),
  }),

  // File access router
  files: router({
    // Get download URL for a file (handles both base64 data and legacy file paths)
    getDownloadUrl: adminProcedure
      .input(z.object({ s3Key: z.string() }))
      .query(async ({ input }) => {
        // Check if s3Key is already a base64 data URL
        if (input.s3Key.startsWith('data:')) {
          // It's already a base64 data URL, return as-is
          return { url: input.s3Key };
        }
        
        // Legacy: it's a file path, try to load from file system or S3
        try {
          const url = await generateDownloadUrl(input.s3Key);
          return { url };
        } catch (error) {
          // If file not found, return a placeholder or error
          throw new TRPCError({ 
            code: "NOT_FOUND", 
            message: "File not found" 
          });
        }
      }),
  }),

  // Live Chat Support Router
  liveChat: router({
    // Start a new conversation (user or guest)
    startConversation: publicProcedure
      .input(z.object({
        category: z.enum(["loan_inquiry", "application_status", "payment_issue", "technical_support", "general", "other"]).default("general"),
        subject: z.string().optional(),
        guestName: z.string().optional(),
        guestEmail: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already has an active conversation
        if (ctx.user) {
          const existingConversation = await db.getActiveLiveChatConversation(ctx.user.id);
          if (existingConversation) {
            return { conversationId: existingConversation.id, sessionId: existingConversation.sessionId };
          }
        }

        // Generate session ID for tracking
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Create new conversation
        const conversation = await db.createLiveChatConversation({
          userId: ctx.user?.id || null,
          guestName: input.guestName || null,
          guestEmail: input.guestEmail || null,
          category: input.category,
          subject: input.subject || null,
          sessionId,
          status: "waiting",
          priority: "normal",
        });

        // Create initial system message
        await db.createLiveChatMessage({
          conversationId: conversation.id,
          senderId: null,
          senderType: "system",
          senderName: "System",
          messageType: "system",
          content: ctx.user 
            ? `${ctx.user.name} has started a live chat conversation. Waiting for an available agent...`
            : `${input.guestName || 'Guest'} has started a live chat conversation. Waiting for an available agent...`,
        });

        return { conversationId: conversation.id, sessionId };
      }),

    // Get conversation details
    getConversation: publicProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        sessionId: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        let conversation;

        if (input.conversationId) {
          conversation = await db.getLiveChatConversation(input.conversationId);
        } else if (input.sessionId) {
          conversation = await db.getLiveChatConversationBySessionId(input.sessionId);
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either conversationId or sessionId is required",
          });
        }

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify access
        if (conversation.userId && ctx.user?.id !== conversation.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        return conversation;
      }),

    // Send a message in conversation
    sendMessage: publicProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getLiveChatConversation(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify access
        if (conversation.userId && ctx.user?.id !== conversation.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        // Create message
        const message = await db.createLiveChatMessage({
          conversationId: input.conversationId,
          senderId: ctx.user?.id || null,
          senderType: "user",
          senderName: ctx.user?.name || conversation.guestName || "Guest",
          messageType: "text",
          content: input.content,
        });

        return message;
      }),

    // Get messages for a conversation
    getMessages: publicProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getLiveChatConversation(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify access
        if (conversation.userId && ctx.user?.id !== conversation.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const messages = await db.getLiveChatMessages(input.conversationId);
        return messages;
      }),

    // Close conversation
    closeConversation: publicProcedure
      .input(z.object({
        conversationId: z.number(),
        rating: z.number().min(1).max(5).optional(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getLiveChatConversation(input.conversationId);
        
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify access
        if (conversation.userId && ctx.user?.id !== conversation.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        await db.updateLiveChatConversation(input.conversationId, {
          status: "closed",
          closedAt: new Date(),
          userRating: input.rating || null,
          userFeedback: input.feedback || null,
        });

        return { success: true };
      }),

    // Admin: Get all conversations
    getAllConversations: adminProcedure
      .query(async () => {
        const conversations = await db.getAllLiveChatConversations();
        return conversations;
      }),

    // Admin: Assign conversation to agent
    assignToAgent: adminProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.assignLiveChatToAgent(input.conversationId, ctx.user.id);

        // Send system message
        await db.createLiveChatMessage({
          conversationId: input.conversationId,
          senderId: null,
          senderType: "system",
          senderName: "System",
          messageType: "system",
          content: `${ctx.user.name} has joined the conversation.`,
        });

        return { success: true };
      }),

    // Admin: Send message as agent
    sendAgentMessage: adminProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const message = await db.createLiveChatMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          senderType: "agent",
          senderName: ctx.user.name || "Support Agent",
          messageType: "text",
          content: input.content,
        });

        return message;
      }),

    // Admin: Resolve conversation
    resolveConversation: adminProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateLiveChatConversation(input.conversationId, {
          status: "resolved",
          resolvedAt: new Date(),
        });

        // Send system message
        await db.createLiveChatMessage({
          conversationId: input.conversationId,
          senderId: null,
          senderType: "system",
          senderName: "System",
          messageType: "system",
          content: `Conversation marked as resolved by ${ctx.user.name}.`,
        });

        return { success: true };
      }),
  }),

  // Receipts router
  receipts: router({
    // Generate payment receipt
    generatePaymentReceipt: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Get loan
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Loan application not found",
          });
        }

        // Get payment
        const payment = await db.getPaymentByLoanId(input.loanId);
        if (!payment || payment.status !== 'succeeded') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No successful payment found for this loan",
          });
        }

        const { generatePaymentReceiptHTML } = await import('./_core/receipts');
        const html = generatePaymentReceiptHTML(payment, loan, ctx.user.email || 'customer@amerilend.com');

        return { html };
      }),

    // Generate disbursement receipt
    generateDisbursementReceipt: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Get loan
        const loan = await db.getLoanById(input.loanId);
        if (!loan || loan.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Loan application not found",
          });
        }

        // Get disbursement
        const disbursement = await db.getDisbursementByLoanId(input.loanId);
        if (!disbursement) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No disbursement found for this loan",
          });
        }

        const { generateDisbursementReceiptHTML } = await import('./_core/receipts');
        const html = generateDisbursementReceiptHTML(disbursement, loan, ctx.user.email || 'customer@amerilend.com');

        return { html };
      }),
  }),

  // Support Messages router
  support: router({
    // Send support message (available to all users, even non-authenticated)
    sendMessage: publicProcedure
      .input(z.object({
        senderName: z.string().min(1, "Name is required"),
        senderEmail: z.string().email("Valid email is required"),
        senderPhone: z.string().optional(),
        subject: z.string().min(1, "Subject is required").max(500),
        message: z.string().min(10, "Message must be at least 10 characters").max(5000),
        category: z.enum(["general", "loan_inquiry", "payment_issue", "technical_support", "complaint", "other"]).default("general"),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        
        // Create support message in database
        const [supportMessage] = await database.insert(db.supportMessages).values({
          userId: ctx.user?.id || null,
          senderName: input.senderName,
          senderEmail: input.senderEmail,
          senderPhone: input.senderPhone || null,
          subject: input.subject,
          message: input.message,
          category: input.category,
          status: "new",
          priority: "medium",
        });

        // Send email notification to admin
        const { sendEmail } = await import('./_core/email');
        
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Admin email not configured",
          });
        }
        
        await sendEmail({
          to: adminEmail,
          subject: `New Support Message: ${input.subject}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0033A0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #0033A0; }
                .value { margin-top: 5px; }
                .message-box { background: white; border-left: 4px solid #FFA500; padding: 15px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .badge { display: inline-block; padding: 4px 12px; background: #FFA500; color: white; border-radius: 4px; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🆘 New Support Message</h1>
                </div>
                <div class="content">
                  <div class="field">
                    <div class="label">Category:</div>
                    <div class="value"><span class="badge">${input.category.replace(/_/g, ' ').toUpperCase()}</span></div>
                  </div>
                  
                  <div class="field">
                    <div class="label">From:</div>
                    <div class="value">${input.senderName}</div>
                  </div>
                  
                  <div class="field">
                    <div class="label">Email:</div>
                    <div class="value"><a href="mailto:${input.senderEmail}">${input.senderEmail}</a></div>
                  </div>
                  
                  ${input.senderPhone ? `
                    <div class="field">
                      <div class="label">Phone:</div>
                      <div class="value"><a href="tel:${input.senderPhone}">${input.senderPhone}</a></div>
                    </div>
                  ` : ''}
                  
                  ${ctx.user ? `
                    <div class="field">
                      <div class="label">User Account:</div>
                      <div class="value">Logged in as User #${ctx.user.id}</div>
                    </div>
                  ` : ''}
                  
                  <div class="field">
                    <div class="label">Subject:</div>
                    <div class="value">${input.subject}</div>
                  </div>
                  
                  <div class="message-box">
                    <div class="label">Message:</div>
                    <div class="value" style="margin-top: 10px; white-space: pre-wrap;">${input.message}</div>
                  </div>
                  
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" style="display: inline-block; padding: 12px 24px; background: #0033A0; color: white; text-decoration: none; border-radius: 4px;">
                      View in Admin Panel
                    </a>
                  </p>
                </div>
                <div class="footer">
                  <p>This is an automated notification from AmeriLend Support System.</p>
                  <p>Please reply directly to ${input.senderEmail} to respond to this message.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        return { 
          success: true, 
          messageId: supportMessage.insertId,
          message: "Your message has been sent. We'll get back to you shortly!" 
        };
      }),

    // Admin: Get all support messages
    adminList: adminProcedure
      .input(z.object({
        status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        
        let baseQuery = database
          .select()
          .from(db.supportMessages)
          .orderBy(desc(db.supportMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        const messages = input.status
          ? await database
              .select()
              .from(db.supportMessages)
              .where(eq(db.supportMessages.status, input.status))
              .orderBy(desc(db.supportMessages.createdAt))
              .limit(input.limit)
              .offset(input.offset)
          : await baseQuery;
        
        // Get total count
        const totalMessages = input.status
          ? await database.select().from(db.supportMessages).where(eq(db.supportMessages.status, input.status))
          : await database.select().from(db.supportMessages);
        
        return {
          messages,
          total: totalMessages.length,
          hasMore: input.offset + messages.length < totalMessages.length,
        };
      }),

    // Admin: Get single support message
    adminGetById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        
        const result = await database
          .select()
          .from(db.supportMessages)
          .where(eq(db.supportMessages.id, input.id))
          .limit(1);
        
        const message = result[0];
        
        if (!message) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Support message not found",
          });
        }
        
        return message;
      }),

    // Admin: Update support message status
    adminUpdateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "in_progress", "resolved", "closed"]),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        
        await database
          .update(db.supportMessages)
          .set({
            status: input.status,
            ...(input.priority && { priority: input.priority }),
          })
          .where(eq(db.supportMessages.id, input.id));
        
        return { success: true };
      }),

    // Admin: Add response to support message
    adminRespond: adminProcedure
      .input(z.object({
        id: z.number(),
        response: z.string().min(1, "Response cannot be empty"),
        sendEmail: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        
        // Get the support message
        const result = await database
          .select()
          .from(db.supportMessages)
          .where(eq(db.supportMessages.id, input.id))
          .limit(1);
        
        const message = result[0];
        
        if (!message) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Support message not found",
          });
        }
        
        // Update with admin response
        await database
          .update(db.supportMessages)
          .set({
            adminResponse: input.response,
            respondedBy: ctx.user.id,
            respondedAt: new Date(),
            status: "resolved",
          })
          .where(eq(db.supportMessages.id, input.id));
        
        // Send email to user if requested
        if (input.sendEmail) {
          const { sendEmail } = await import('./_core/email');
          
          await sendEmail({
            to: message.senderEmail,
            subject: `Re: ${message.subject}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #0033A0; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; background: #f9fafb; }
                  .original-message { background: white; border-left: 4px solid #ccc; padding: 15px; margin: 20px 0; }
                  .response-box { background: white; border-left: 4px solid #0033A0; padding: 15px; margin: 20px 0; }
                  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>AmeriLend Support Response</h1>
                  </div>
                  <div class="content">
                    <h2>Hello ${message.senderName},</h2>
                    <p>Thank you for contacting AmeriLend Support. We have reviewed your inquiry and here is our response:</p>
                    
                    <div class="response-box">
                      <strong>Our Response:</strong>
                      <p style="margin-top: 10px; white-space: pre-wrap;">${input.response}</p>
                    </div>
                    
                    <div class="original-message">
                      <strong>Your Original Message:</strong>
                      <p style="margin-top: 10px;"><strong>Subject:</strong> ${message.subject}</p>
                      <p style="white-space: pre-wrap;">${message.message}</p>
                    </div>
                    
                    <p>If you have any further questions, please feel free to reply to this email or contact us again.</p>
                    
                    <p style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 12px 24px; background: #0033A0; color: white; text-decoration: none; border-radius: 4px;">
                        Log In to Your Account
                      </a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>Best regards,<br>AmeriLend Support Team</p>
                    <p>Phone: 1-945-212-1609</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        }
        
        return { success: true };
      }),

    // Admin: Delete support message
    adminDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        
        await database
          .delete(db.supportMessages)
          .where(eq(db.supportMessages.id, input.id));
        
        return { success: true };
      }),
  }),

  /**
   * System Settings Router
   * Admin endpoints for managing system configuration
   */
  settings: router({
    /**
     * Get all system settings (admin only)
     */
    getAll: adminProcedure.query(async () => {
      return await db.getAllSystemSettings();
    }),

    /**
     * Get settings by pattern (admin only)
     */
    getByPattern: adminProcedure
      .input(z.object({
        pattern: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getSystemSettingsByPattern(input.pattern);
      }),

    /**
     * Get a specific setting (admin only)
     */
    get: adminProcedure
      .input(z.object({
        key: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getSystemSetting(input.key);
      }),

    /**
     * Update or create a system setting (admin only)
     */
    upsert: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
        type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log('[settings.upsert] Mutation called:', { 
          key: input.key, 
          value: input.value, 
          type: input.type,
          userId: ctx.user?.id 
        });
        
        if (!ctx.user?.id) {
          console.error('[settings.upsert] No user ID in context');
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const result = await db.upsertSystemSetting(
          input.key,
          input.value,
          input.description || null,
          input.type || 'string',
          ctx.user.id
        );
        
        console.log('[settings.upsert] Upsert successful:', result);
        return result;
      }),

    /**
     * Get crypto wallet addresses
     */
    getCryptoWallets: adminProcedure.query(async () => {
      return await db.getCryptoWallets();
    }),

    /**
     * Update crypto wallet addresses (admin only)
     */
    updateCryptoWallets: adminProcedure
      .input(z.object({
        btc: z.string().optional(),
        eth: z.string().optional(),
        usdt: z.string().optional(),
        usdc: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const updates = [];

        if (input.btc !== undefined) {
          updates.push(
            db.upsertSystemSetting(
              'WALLET_ADDRESS_BTC',
              input.btc,
              'Bitcoin wallet address for receiving payments',
              'string',
              ctx.user.id
            )
          );
        }

        if (input.eth !== undefined) {
          updates.push(
            db.upsertSystemSetting(
              'WALLET_ADDRESS_ETH',
              input.eth,
              'Ethereum wallet address for receiving payments',
              'string',
              ctx.user.id
            )
          );
        }

        if (input.usdt !== undefined) {
          updates.push(
            db.upsertSystemSetting(
              'WALLET_ADDRESS_USDT',
              input.usdt,
              'USDT wallet address for receiving payments',
              'string',
              ctx.user.id
            )
          );
        }

        if (input.usdc !== undefined) {
          updates.push(
            db.upsertSystemSetting(
              'WALLET_ADDRESS_USDC',
              input.usdc,
              'USDC wallet address for receiving payments',
              'string',
              ctx.user.id
            )
          );
        }

        await Promise.all(updates);

        return {
          success: true,
          message: 'Crypto wallet addresses updated successfully',
        };
      }),
  }),

  // Analytics router (admin only)
  analytics: router({
    getOverview: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const allLoans = await db.getAllLoanApplications();
      const allPayments = await database.select().from(payments);
      
      // Calculate total revenue (sum of all succeeded payments)
      const totalRevenue = allPayments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0);
      
      // Active loans (approved, fee_paid, or disbursed)
      const activeLoans = allLoans.filter(l => 
        l.status === 'approved' || l.status === 'fee_paid' || l.status === 'disbursed'
      ).length;
      
      // Approval rate
      const totalApps = allLoans.length;
      const approvedApps = allLoans.filter(l => 
        l.status === 'approved' || l.status === 'fee_paid' || l.status === 'disbursed'
      ).length;
      const approvalRate = totalApps > 0 ? (approvedApps / totalApps) * 100 : 0;
      
      // Default rate (for now, track rejected vs approved)
      const rejectedLoans = allLoans.filter(l => l.status === 'rejected').length;
      const defaultRate = approvedApps > 0 ? (rejectedLoans / (approvedApps + rejectedLoans)) * 100 : 0;
      
      return {
        totalRevenue,
        activeLoans,
        approvalRate: Math.round(approvalRate * 10) / 10, // Round to 1 decimal
        defaultRate: Math.round(defaultRate * 10) / 10,
      };
    }),

    getLoanTrend: adminProcedure.query(async () => {
      const allLoans = await db.getAllLoanApplications();
      
      // Get last 6 months of data
      const monthlyData = new Map<string, number>();
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.set(monthKey, 0);
      }
      
      // Count applications by month
      allLoans.forEach(loan => {
        const loanDate = new Date(loan.createdAt);
        const monthKey = loanDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
        }
      });
      
      return Array.from(monthlyData.entries()).map(([month, value]) => ({
        month,
        value,
      }));
    }),

    getRevenueBreakdown: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const allPayments = await database.select().from(payments);
      const succeededPayments = allPayments.filter(p => p.status === 'succeeded');
      
      const totalRevenue = succeededPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Break down by amount types
      const interestIncome = succeededPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
      const principalPayments = succeededPayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
      const feeIncome = succeededPayments.reduce((sum, p) => sum + (p.feesAmount || 0), 0);
      
      // Calculate percentages
      const total = interestIncome + principalPayments + feeIncome || 1; // Avoid division by zero
      
      return {
        interestIncome: {
          amount: interestIncome,
          percentage: Math.round((interestIncome / total) * 100),
        },
        originationFees: {
          amount: feeIncome,
          percentage: Math.round((feeIncome / total) * 100),
        },
        principalPayments: {
          amount: principalPayments,
          percentage: Math.round((principalPayments / total) * 100),
        },
        totalRevenue,
      };
    }),

    getLoanStatusDistribution: adminProcedure.query(async () => {
      const allLoans = await db.getAllLoanApplications();
      const total = allLoans.length || 1; // Avoid division by zero
      
      const statusCounts = {
        pending: allLoans.filter(l => l.status === 'pending').length,
        under_review: allLoans.filter(l => l.status === 'under_review').length,
        approved: allLoans.filter(l => l.status === 'approved' || l.status === 'fee_paid').length,
        disbursed: allLoans.filter(l => l.status === 'disbursed').length,
        rejected: allLoans.filter(l => l.status === 'rejected').length,
      };
      
      return {
        pending: {
          count: statusCounts.pending,
          percentage: Math.round((statusCounts.pending / total) * 100),
        },
        underReview: {
          count: statusCounts.under_review,
          percentage: Math.round((statusCounts.under_review / total) * 100),
        },
        approved: {
          count: statusCounts.approved,
          percentage: Math.round((statusCounts.approved / total) * 100),
        },
        disbursed: {
          count: statusCounts.disbursed,
          percentage: Math.round((statusCounts.disbursed / total) * 100),
        },
        rejected: {
          count: statusCounts.rejected,
          percentage: Math.round((statusCounts.rejected / total) * 100),
        },
      };
    }),

    getUserGrowth: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const allUsers = await database.select().from(users);
      
      // Get last 12 months of user registrations
      const monthlyData = new Map<string, number>();
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, 0);
      }
      
      // Count new users by month
      allUsers.forEach(user => {
        const userDate = new Date(user.createdAt);
        const monthKey = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
        }
      });
      
      return Array.from(monthlyData.values());
    }),
  }),

  /**
   * Audit Log Routes
   */
  auditLogs: router({
    /**
     * Get all audit logs (admin only)
     */
    getAll: adminProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        const logs = await db.getAuditLogs(input.limit, input.offset);
        
        // Get user info for each log
        const database = await getDb();
        if (!database) return [];

        const logsWithUsers = await Promise.all(
          logs.map(async (log) => {
            let userName = 'System';
            let userEmail = null;
            
            if (log.userId) {
              const userResult = await database.select()
                .from(users)
                .where(eq(users.id, log.userId))
                .limit(1);
              const user = userResult.length > 0 ? userResult[0] : null;
              
              if (user) {
                userName = user.name || user.email || 'Unknown';
                userEmail = user.email;
              }
            }

            return {
              ...log,
              userName,
              userEmail,
            };
          })
        );

        return logsWithUsers;
      }),

    /**
     * Get audit logs by action type (admin only)
     */
    getByAction: adminProcedure
      .input(z.object({
        action: z.string(),
        limit: z.number().optional().default(100),
      }))
      .query(async ({ input }) => {
        return await db.getAuditLogsByAction(input.action, input.limit);
      }),

    /**
     * Get audit logs for a specific user (admin only)
     */
    getByUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().optional().default(100),
      }))
      .query(async ({ input }) => {
        return await db.getAuditLogsByUser(input.userId, input.limit);
      }),

    /**
     * Create audit log entry (admin only)
     */
    create: adminProcedure
      .input(z.object({
        action: z.string(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createAuditLog({
          userId: ctx.user.id,
          action: input.action,
          entityType: input.entityType || null,
          entityId: input.entityId || null,
          ipAddress: null, // TODO: Get from request
          userAgent: null, // TODO: Get from request
          oldValue: input.oldValue || null,
          newValue: input.newValue || null,
          metadata: input.metadata || null,
        });
      }),
  }),

  /**
   * Admin Utilities Router
   * System maintenance and testing tools
   */
  adminUtils: router({
    /**
     * Send test email to verify email configuration
     */
    sendTestEmail: adminProcedure
      .input(z.object({
        recipient: z.string().email(),
        subject: z.string().optional().default("Test Email - AmeriLend System"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log('[Admin Utils] Sending test email to:', input.recipient);
          
          const testHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✓ Email System Test</h1>
                    <p style="margin: 0; opacity: 0.9;">AmeriLend Financial Services</p>
                  </div>
                  <div class="content">
                    <div class="success-icon">✅</div>
                    <h2 style="color: #667eea; text-align: center;">Email Configuration Working!</h2>
                    <p>This is a test email from your AmeriLend admin dashboard. If you're seeing this, your email configuration is working correctly.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-top: 0;">Test Details:</h3>
                      <ul style="list-style: none; padding: 0;">
                        <li><strong>📧 Recipient:</strong> ${input.recipient}</li>
                        <li><strong>👤 Sent by:</strong> ${ctx.user.name || ctx.user.email}</li>
                        <li><strong>🕐 Timestamp:</strong> ${new Date().toLocaleString()}</li>
                        <li><strong>📮 Provider:</strong> SendGrid</li>
                        <li><strong>✓ Status:</strong> <span class="badge">Delivered</span></li>
                      </ul>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px;">
                      <strong>Your email system is ready for:</strong><br/>
                      Loan notifications • Payment confirmations • User alerts • Support messages
                    </p>
                  </div>
                  <div class="footer">
                    <p>AmeriLend Financial Services<br/>
                    Automated System Email - Do Not Reply</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          await sendEmail({
            to: input.recipient,
            subject: input.subject,
            html: testHtml,
          });

          // Log the test in audit trail
          await db.createAuditLog({
            userId: ctx.user.id,
            action: 'test_email_sent',
            entityType: 'system',
            entityId: null,
            ipAddress: null,
            userAgent: null,
            oldValue: null,
            newValue: input.recipient,
            metadata: JSON.stringify({ subject: input.subject }),
          });

          console.log('[Admin Utils] Test email sent successfully');
          return {
            success: true,
            message: `Test email sent successfully to ${input.recipient}`,
          };
        } catch (error) {
          console.error('[Admin Utils] Failed to send test email:', error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to send test email",
          });
        }
      }),

    /**
     * Create database backup
     */
    createBackup: adminProcedure.mutation(async ({ ctx }) => {
      try {
        console.log('[Admin Utils] Creating database backup...');
        const database = await getDb();
        if (!database) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Fetch all data from critical tables
        const [
          allUsers,
          allLoans,
          allPayments,
          allDisbursements,
          allSupport,
          allSettings,
          allReferrals,
        ] = await Promise.all([
          database.select().from(users),
          database.select().from(loanApplications),
          database.select().from(payments),
          database.select().from(disbursements),
          database.select().from(supportMessages),
          db.getAllSystemSettings(),
          database.select().from(referrals),
        ]);

        const backup = {
          metadata: {
            created_at: new Date().toISOString(),
            created_by: ctx.user.email,
            version: "1.0",
            database: "amerilend",
            tables: ["users", "loanApplications", "payments", "disbursements", "supportMessages", "systemSettings", "referrals"],
          },
          data: {
            users: allUsers.map(u => ({
              ...u,
              password: "[REDACTED]", // Don't include password hashes in backup
            })),
            loanApplications: allLoans,
            payments: allPayments,
            disbursements: allDisbursements,
            supportMessages: allSupport,
            systemSettings: allSettings,
            referrals: allReferrals,
          },
          statistics: {
            total_users: allUsers.length,
            total_loans: allLoans.length,
            total_payments: allPayments.length,
            total_disbursements: allDisbursements.length,
            total_support_messages: allSupport.length,
            total_settings: allSettings.length,
            total_referrals: allReferrals.length,
          },
        };

        // Log backup creation
        await db.createAuditLog({
          userId: ctx.user.id,
          action: 'database_backup_created',
          entityType: 'system',
          entityId: null,
          ipAddress: null,
          userAgent: null,
          oldValue: null,
          newValue: null,
          metadata: JSON.stringify({
            tables: backup.metadata.tables.length,
            total_records: Object.values(backup.statistics).reduce((a, b) => a + b, 0),
          }),
        });

        console.log('[Admin Utils] Backup created successfully');
        return {
          success: true,
          backup: JSON.stringify(backup, null, 2),
          filename: `amerilend-backup-${new Date().toISOString().split('T')[0]}.json`,
          statistics: backup.statistics,
        };
      } catch (error) {
        console.error('[Admin Utils] Failed to create backup:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create backup",
        });
      }
    }),

    /**
     * Restore database from backup (DANGEROUS - use with caution)
     */
    restoreBackup: adminProcedure
      .input(z.object({
        backupData: z.string(),
        confirmEmail: z.string().email(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Security check: require admin email confirmation
          if (input.confirmEmail !== ctx.user.email) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Email confirmation does not match. Restore cancelled for security.",
            });
          }

          console.log('[Admin Utils] Restoring database backup...');
          console.log('[Admin Utils] WARNING: This will overwrite existing data!');

          // Parse and validate backup
          let backup: any;
          try {
            backup = JSON.parse(input.backupData);
          } catch (parseError) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid backup file format. Unable to parse JSON.",
            });
          }

          // Validate backup structure
          if (!backup.metadata || !backup.data || !backup.metadata.version) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid backup structure. Missing required fields.",
            });
          }

          // For safety, we'll only restore specific tables and NOT delete existing data
          // This is a "merge" restore rather than a full wipe and restore
          console.log('[Admin Utils] Restore validation passed');
          console.log('[Admin Utils] Backup created:', backup.metadata.created_at);
          console.log('[Admin Utils] Backup by:', backup.metadata.created_by);

          // Log restore attempt
          await db.createAuditLog({
            userId: ctx.user.id,
            action: 'database_restore_attempted',
            entityType: 'system',
            entityId: null,
            ipAddress: null,
            userAgent: null,
            oldValue: null,
            newValue: backup.metadata.created_at,
            metadata: JSON.stringify({
              backup_date: backup.metadata.created_at,
              backup_creator: backup.metadata.created_by,
              confirmed_by: input.confirmEmail,
            }),
          });

          // Return success with warnings
          return {
            success: true,
            message: "Backup validated successfully. Manual restore required for safety.",
            warning: "Automatic restore is disabled for data safety. Please contact database administrator for manual restore.",
            backup_info: {
              created: backup.metadata.created_at,
              created_by: backup.metadata.created_by,
              tables: backup.metadata.tables,
              statistics: backup.statistics,
            },
          };
        } catch (error) {
          console.error('[Admin Utils] Failed to restore backup:', error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to restore backup",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
