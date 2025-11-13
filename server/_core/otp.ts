/**
 * OTP (One-Time Password) authentication module
 * Handles OTP generation, validation, and delivery for signup/login
 */

import { getDb } from "../db";
import { otpCodes } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

// In-memory fallback storage when database is unavailable
interface InMemoryOTP {
  code: string;
  expiresAt: Date;
  attempts: number;
}

const inMemoryOTPs = new Map<string, InMemoryOTP>();

// Rate limiting storage: email -> array of request timestamps
interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per hour

/**
 * Check if email has exceeded rate limit
 */
function checkRateLimit(email: string): { allowed: boolean; remainingRequests: number; resetTime?: Date } {
  const now = Date.now();
  const entry = rateLimitStore.get(email);
  
  if (!entry) {
    return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS };
  }
  
  // Remove timestamps older than the rate limit window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestTimestamp = Math.min(...entry.timestamps);
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW_MS);
    return { allowed: false, remainingRequests: 0, resetTime };
  }
  
  return { 
    allowed: true, 
    remainingRequests: RATE_LIMIT_MAX_REQUESTS - entry.timestamps.length 
  };
}

/**
 * Record an OTP request for rate limiting
 */
function recordOTPRequest(email: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(email);
  
  if (!entry) {
    rateLimitStore.set(email, { timestamps: [now] });
  } else {
    entry.timestamps.push(now);
  }
}

/**
 * Clear rate limit for email (after successful verification)
 */
function clearRateLimit(email: string): void {
  rateLimitStore.delete(email);
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store an OTP code for email verification
 */
export async function createOTP(email: string, purpose: "signup" | "login" | "loan_application"): Promise<string> {
  // Check rate limit first
  const rateLimit = checkRateLimit(email);
  
  if (!rateLimit.allowed) {
    const resetTimeStr = rateLimit.resetTime?.toLocaleTimeString() || "soon";
    throw new Error(`Too many OTP requests. Please try again after ${resetTimeStr}`);
  }
  
  // Record this request
  recordOTPRequest(email);
  
  const db = await getDb();
  const code = generateOTP();
  
  if (!db) {
    console.warn("[OTP] Database not available, using console-only mode");
    console.log(`
═══════════════════════════════════════
  OTP CODE GENERATED (NO DB MODE)
═══════════════════════════════════════
  Email: ${email}
  Code: ${code}
  Purpose: ${purpose}
  Expires in: 10 minutes
═══════════════════════════════════════
    `);
    return code;
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Invalidate any existing OTP codes for this email/purpose
    await db
      .update(otpCodes)
      .set({ verified: 1 }) // Mark as verified to prevent reuse
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.purpose, purpose),
          eq(otpCodes.verified, 0)
        )
      );
  } catch (error) {
    console.error("[OTP] Error invalidating old OTP codes:", error);
    // Continue anyway - this is not critical
  }

  try {
    // Create new OTP
    await db.insert(otpCodes).values({
      email,
      code,
      purpose,
      expiresAt,
      verified: 0,
      attempts: 0,
    });
  } catch (error) {
    console.error("[OTP] Error creating OTP in database:", error);
    console.log(`
═══════════════════════════════════════
  OTP CODE GENERATED (FALLBACK MODE)
═══════════════════════════════════════
  Email: ${email}
  Code: ${code}
  Purpose: ${purpose}
  Expires in: 10 minutes
  Note: Stored in memory only
═══════════════════════════════════════
    `);
    // Store in memory as fallback
    inMemoryOTPs.set(`${email}:${purpose}`, {
      code,
      expiresAt,
      attempts: 0,
    });
  }

  return code;
}

/**
 * Verify an OTP code
 */
export async function verifyOTP(
  email: string,
  code: string,
  purpose: "signup" | "login" | "loan_application"
): Promise<{ valid: boolean; error?: string }> {
  const db = await getDb();
  
  // Check in-memory storage first (fallback mode)
  const memoryKey = `${email}:${purpose}`;
  if (inMemoryOTPs.has(memoryKey)) {
    const otpData = inMemoryOTPs.get(memoryKey)!;
    
    // Check expiration
    if (otpData.expiresAt < new Date()) {
      inMemoryOTPs.delete(memoryKey);
      return { valid: false, error: "OTP expired" };
    }
    
    // Check attempts
    if (otpData.attempts >= 5) {
      inMemoryOTPs.delete(memoryKey);
      return { valid: false, error: "Too many failed attempts. Please request a new code." };
    }
    
    // Increment attempts
    otpData.attempts++;
    
    // Verify code
    if (otpData.code !== code) {
      return { valid: false, error: "Invalid code" };
    }
    
    // Success - remove from memory and clear rate limit
    inMemoryOTPs.delete(memoryKey);
    clearRateLimit(email);
    console.log(`[OTP] Successfully verified OTP from in-memory storage for ${email}`);
    return { valid: true };
  }
  
  if (!db) {
    return { valid: false, error: "Database not available and no in-memory OTP found" };
  }

  // Find the most recent unverified OTP for this email/purpose
  const results = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.purpose, purpose),
        eq(otpCodes.verified, 0),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(1);

  if (results.length === 0) {
    return { valid: false, error: "No valid OTP found or OTP expired" };
  }

  const otpRecord = results[0];

  // Check if too many attempts
  if (otpRecord.attempts >= 5) {
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  await db
    .update(otpCodes)
    .set({ attempts: otpRecord.attempts + 1 })
    .where(eq(otpCodes.id, otpRecord.id));

  // Verify code
  if (otpRecord.code !== code) {
    return { valid: false, error: "Invalid code" };
  }

  // Mark as verified
  await db
    .update(otpCodes)
    .set({ verified: 1 })
    .where(eq(otpCodes.id, otpRecord.id));

  // Clear rate limit on successful verification
  clearRateLimit(email);

  return { valid: true };
}

/**
 * Send OTP via email using SendGrid
 */
export async function sendOTPEmail(email: string, code: string, purpose: "signup" | "login" | "loan_application"): Promise<void> {
  // Check if SendGrid API key is configured
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const emailDomain = process.env.EMAIL_DOMAIN || 'amerilendloan.com';
  const noreplyEmail = process.env.EMAIL_NOREPLY || `noreply@${emailDomain}`;
  
  if (!sendgridApiKey) {
    // Fallback to console logging if no API key
    console.log(`
═══════════════════════════════════════
  OTP CODE FOR ${purpose.toUpperCase()}
═══════════════════════════════════════
  Email: ${email}
  Code: ${code}
  Expires in: 10 minutes
  
  ⚠️  SendGrid not configured
  Set SENDGRID_API_KEY in .env to send real emails
═══════════════════════════════════════
    `);
    return;
  }

  const APP_URL = process.env.APP_URL || 'https://www.amerilendloan.com';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 150px; height: auto; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .code { font-size: 32px; font-weight: bold; color: #0033A0; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border: 2px dashed #0033A0; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #0033A0; margin: 0;">AmeriLend</h1>
        </div>
        <div class="content">
          <h2>Your Verification Code</h2>
          <p>Hello,</p>
          <p>You requested a verification code to ${purpose === 'signup' ? 'create your account' : 'sign in to your account'}.</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 AmeriLend. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Use native HTTPS instead of @sendgrid/mail library (more reliable)
    const https = await import('https');
    
    const emailData = JSON.stringify({
      personalizations: [
        {
          to: [{ email: email }]
        }
      ],
      from: {
        email: noreplyEmail,
        name: 'AmeriLend'
      },
      subject: `Your AmeriLend ${purpose === 'signup' ? 'Sign Up' : 'Login'} Verification Code`,
      content: [
        {
          type: 'text/plain',
          value: `Your verification code is: ${code}. This code will expire in 10 minutes.`
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    });
    
    const requestOptions = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData)
      },
      timeout: 10000
    };
    
    await new Promise<void>((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 202) {
            console.log(`[Email] OTP sent successfully to ${email}`);
            resolve();
          } else {
            console.error('[Email] SendGrid error:', res.statusCode, data);
            reject(new Error(`SendGrid returned status ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (err) => {
        console.error('[Email] SendGrid request error:', err);
        reject(err);
      });
      
      req.on('timeout', () => {
        console.error('[Email] SendGrid request timeout');
        req.destroy();
        reject(new Error('SendGrid request timeout'));
      });
      
      req.write(emailData);
      req.end();
    });
    
  } catch (error) {
    console.error('[Email] Failed to send OTP email:', error);
    // Still log to console as fallback
    console.log(`
═══════════════════════════════════════
  OTP CODE (EMAIL FAILED - FALLBACK)
═══════════════════════════════════════
  Email: ${email}
  Code: ${code}
  Purpose: ${purpose}
  Error: ${error instanceof Error ? error.message : 'Unknown error'}
═══════════════════════════════════════
    `);
  }
}

/**
 * Clean up expired OTP codes (should be run periodically)
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  // Mark OTPs older than 1 hour as verified to prevent reuse
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  await db
    .update(otpCodes)
    .set({ verified: 1 })
    .where(
      and(
        eq(otpCodes.verified, 0),
        gt(otpCodes.expiresAt, oneHourAgo)
      )
    );
}
