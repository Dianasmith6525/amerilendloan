import { desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { 
  InsertUser, 
  users,
  referrals,
  Referral,
  InsertReferral,
  loanApplications,
  LoanApplication,
  InsertLoanApplication,
  feeConfiguration,
  FeeConfiguration,
  InsertFeeConfiguration,
  payments,
  Payment,
  InsertPayment,
  disbursements,
  Disbursement,
  InsertDisbursement,
  notifications,
  Notification,
  InsertNotification,
  liveChatConversations,
  LiveChatConversation,
  InsertLiveChatConversation,
  liveChatMessages,
  LiveChatMessage,
  InsertLiveChatMessage,
  supportMessages,
  SupportMessage,
  InsertSupportMessage,
  systemSettings,
  SystemSetting,
  InsertSystemSetting,
  auditLog,
  AuditLog,
  InsertAuditLog,
  draftApplications,
  DraftApplication,
  InsertDraftApplication
} from "../drizzle/schema";
import { ENV } from './_core/env';
import * as schema from "../drizzle/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

let _db: NodePgDatabase<typeof schema> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] DATABASE_URL found, attempting connection...");
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true
        }
      });
      _db = drizzle(pool, { 
        schema
      });
      console.log("[Database] Connection pool created successfully");
    } catch (error) {
      console.error("[Database] Failed to create connection:", error);
      throw new Error(`Database setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL ? "set (hidden)" : "NOT SET";
    console.error(`[Database] DATABASE_URL status: ${dbUrl}`);
    throw new Error("[Database] No database connection available. Please check DATABASE_URL in .env file.");
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId));

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId));

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email));

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(userData: {
  email: string;
  name: string;
  phoneNumber?: string;
  role?: "user" | "admin";
  loginMethod?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  ssn?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [result] = await db.insert(users).values({
    email: userData.email,
    name: userData.name,
    phoneNumber: userData.phoneNumber || null,
    role: (userData.role || "user") as "user" | "admin",
    loginMethod: userData.loginMethod || "email",
    street: userData.street || null,
    city: userData.city || null,
    state: userData.state || null,
    zipCode: userData.zipCode || null,
    dateOfBirth: userData.dateOfBirth || null,
    ssn: userData.ssn || null,
  }).$returningId();

  return result.id;
}

// ============================================
// Loan Application Queries
// ============================================

/**
 * Generate a unique reference number for loan applications
 * Format: AL-YYYYMMDD-XXXX (e.g., AL-20251110-A3B5)
 */
async function generateReferenceNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Generate random alphanumeric string
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const refNumber = `AL-${dateStr}-${randomStr}`;
  
  // Check if it already exists (very unlikely, but just in case)
  const existing = await db.select().from(loanApplications)
    .where(eq(loanApplications.referenceNumber, refNumber));
  
  if (existing.length > 0) {
    // Recursive call to generate a new one
    return generateReferenceNumber();
  }
  
  return refNumber;
}

export async function createLoanApplication(data: InsertLoanApplication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate unique reference number if not provided
  const referenceNumber = data.referenceNumber || await generateReferenceNumber();
  
  // Insert the loan application - DON'T capture the result as it contains binary corruption
  await db.insert(loanApplications).values({
    ...data,
    referenceNumber,
  });
  
  // Query back the inserted record using the unique reference number
  const inserted = await db
    .select()
    .from(loanApplications)
    .where(eq(loanApplications.referenceNumber, referenceNumber))
    .limit(1);
  
  if (!inserted || inserted.length === 0) {
    throw new Error("Failed to create loan application");
  }
  
  return { 
    insertId: inserted[0].id,
    referenceNumber: inserted[0].referenceNumber
  };
}

export async function getLoanApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(loanApplications).where(eq(loanApplications.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function getLoanApplicationByReferenceNumber(referenceNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Sanitize reference number - extract only the actual reference part
  const sanitizedRef = referenceNumber.trim().split(',')[0].split(' ')[0];
  console.log('[DB] Looking up reference number:', sanitizedRef, '(original:', referenceNumber, ')');
  
  try {
    const result = await db.select().from(loanApplications)
      .where(eq(loanApplications.referenceNumber, sanitizedRef));
    return result && result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error('[DB] Error looking up loan by reference:', error);
    return undefined;
  }
}

export async function getLoanApplicationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const loans = await db.select().from(loanApplications).where(eq(loanApplications.userId, userId)).orderBy(desc(loanApplications.createdAt));
  
  // Fetch related payments and disbursements for each loan
  const loansWithDetails = await Promise.all(
    loans.map(async (loan) => {
      try {
        const paymentResult = await db.select().from(payments).where(eq(payments.loanApplicationId, loan.id));
        const disbursementResult = await db.select().from(disbursements).where(eq(disbursements.loanApplicationId, loan.id));
        
        return {
          ...loan,
          payment: paymentResult.length > 0 ? paymentResult[0] : null,
          disbursement: disbursementResult.length > 0 ? disbursementResult[0] : null,
        };
      } catch (error) {
        // If fetching related data fails, return loan without payment/disbursement details
        console.error('[DB] Error fetching payment/disbursement for loan', loan.id, error);
        return {
          ...loan,
          payment: null,
          disbursement: null,
        };
      }
    })
  );
  
  return loansWithDetails;
}

export async function getAllLoanApplications() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(loanApplications).orderBy(desc(loanApplications.createdAt));
}

export async function updateLoanApplicationStatus(
  id: number,
  status: LoanApplication["status"],
  additionalData?: Partial<LoanApplication>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(loanApplications)
    .set({ status, ...additionalData, updatedAt: new Date() })
    .where(eq(loanApplications.id, id));
}

export async function updateLoanApplication(
  id: number,
  data: Partial<LoanApplication>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(loanApplications)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(loanApplications.id, id));
}

// ============================================
// Fee Configuration Queries
// ============================================

export async function getActiveFeeConfiguration() {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(feeConfiguration)
    .where(eq(feeConfiguration.isActive, 1))
    .orderBy(desc(feeConfiguration.createdAt));
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createFeeConfiguration(data: InsertFeeConfiguration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deactivate all existing configurations
  await db.update(feeConfiguration).set({ isActive: 0 });
  
  // Insert new active configuration
  const result = await db.insert(feeConfiguration).values({ ...data, isActive: 1 });
  return result;
}

export async function updateFeeConfiguration(id: number, data: Partial<FeeConfiguration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(feeConfiguration)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feeConfiguration.id, id));
}

// ============================================
// Payment Queries
// ============================================

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(data);
  return result;
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function getPaymentsByLoanApplicationId(loanApplicationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(payments)
    .where(eq(payments.loanApplicationId, loanApplicationId))
    .orderBy(desc(payments.createdAt));
}

export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function updatePaymentStatus(
  id: number,
  status: Payment["status"],
  additionalData?: Partial<Payment>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(payments)
    .set({ status, ...additionalData, updatedAt: new Date() })
    .where(eq(payments.id, id));
}

// ============================================
// Disbursement Queries
// ============================================

export async function createDisbursement(data: InsertDisbursement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(disbursements).values(data);
  return result;
}

export async function getDisbursementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(disbursements).where(eq(disbursements.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function getDisbursementByLoanApplicationId(loanApplicationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(disbursements)
    .where(eq(disbursements.loanApplicationId, loanApplicationId));
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDisbursementStatus(
  id: number,
  status: Disbursement["status"],
  additionalData?: Partial<Disbursement>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(disbursements)
    .set({ status, ...additionalData, updatedAt: new Date() })
    .where(eq(disbursements.id, id));
}

// ============================================
// Notification Queries
// ============================================

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function updateNotificationStatus(
  id: number,
  status: Notification["status"],
  additionalData?: Partial<Notification>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(notifications)
    .set({ status, ...additionalData })
    .where(eq(notifications.id, id));
}

// ============================================
// Draft Application Queries
// ============================================

export async function saveDraftApplication(data: {
  email: string;
  userId?: number;
  draftData: string; // JSON string
  currentStep: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Check if draft already exists for this email
  const existing = await db.select().from(draftApplications)
    .where(eq(draftApplications.email, data.email));
  
  if (existing.length > 0) {
    // Update existing draft
    await db.update(draftApplications)
      .set({
        draftData: data.draftData,
        currentStep: data.currentStep,
        userId: data.userId || null,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(draftApplications.id, existing[0].id));
    
    return existing[0].id;
  } else {
    // Create new draft
    const [result] = await db.insert(draftApplications).values({
      email: data.email,
      userId: data.userId || null,
      draftData: data.draftData,
      currentStep: data.currentStep,
      expiresAt,
    }).$returningId();
    
    return result.id;
  }
}

export async function getDraftByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(draftApplications)
    .where(eq(draftApplications.email, email))
    .orderBy(desc(draftApplications.updatedAt));
  
  return result.length > 0 ? result[0] : null;
}

export async function deleteDraft(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(draftApplications)
    .where(eq(draftApplications.email, email));
}

export async function cleanupExpiredDrafts() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.delete(draftApplications)
    .where(lt(draftApplications.expiresAt, new Date()));
  
  return result;
}

// ============================================
// Referral Queries
// ============================================

/**
 * Generates a unique referral code
 * NOTE: Currently disabled as referralCode field doesn't exist in users schema
 */
export async function generateReferralCode(): Promise<string> {
  /* Disabled until referralCode is added back to schema
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding 0, O, 1, I for readability
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Check if it already exists
  const existing = await db.select().from(users)
    .where(eq(users.referralCode, code))
    .limit(1);
  
  if (existing.length > 0) {
    // Recursive call to generate a new one
    return generateReferralCode();
  }
  
  return code;
  */
  
  // Temporary implementation
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createOrGetReferralCode(userId: number): Promise<string> {
  /* Disabled until referralCode is added back to schema
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a referral code
  const user = await getUserById(userId);
  if (user?.referralCode) {
    return user.referralCode;
  }

  // Generate new referral code
  const referralCode = await generateReferralCode();
  
  // Update user with referral code
  await db.update(users)
    .set({ referralCode })
    .where(eq(users.id, userId));

  return referralCode;
  */
  
  // Temporary implementation - just generate without storing
  return generateReferralCode();
}

export async function getUserByReferralCode(referralCode: string): Promise<typeof users.$inferSelect | null> {
  /* Disabled until referralCode is added back to schema
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users)
    .where(eq(users.referralCode, referralCode))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
  */
  
  // Temporary implementation - return null (referralCode not in schema yet)
  return null;
}

export async function createReferral(data: InsertReferral) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(referrals).values(data);
}

export async function getReferralsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(referrals)
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));
}

export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, qualified: 0, rewarded: 0, totalEarnings: 0 };
  
  const allReferrals = await db.select().from(referrals)
    .where(eq(referrals.referrerId, userId));
  
  return {
    total: allReferrals.length,
    pending: allReferrals.filter(r => r.status === 'pending').length,
    qualified: allReferrals.filter(r => r.status === 'qualified').length,
    rewarded: allReferrals.filter(r => r.status === 'rewarded').length,
    totalEarnings: allReferrals
      .filter(r => r.status === 'rewarded')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
  };
}

export async function updateReferralStatus(
  id: number,
  status: Referral["status"],
  rewardAmount?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status, updatedAt: new Date() };
  
  if (status === 'rewarded' && rewardAmount) {
    updateData.rewardAmount = rewardAmount;
    updateData.rewardPaidAt = new Date();
  }
  
  return db.update(referrals)
    .set(updateData)
    .where(eq(referrals.id, id));
}

// ============================================
// Live Chat Functions
// ============================================

/**
 * Create a new live chat conversation
 */
export async function createLiveChatConversation(
  data: InsertLiveChatConversation
): Promise<LiveChatConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [conversation] = await db.insert(liveChatConversations).values(data).$returningId();
  const [result] = await db.select().from(liveChatConversations).where(eq(liveChatConversations.id, conversation.id));
  return result;
}

/**
 * Get live chat conversation by ID
 */
export async function getLiveChatConversation(id: number): Promise<LiveChatConversation | null> {
  const db = await getDb();
  if (!db) return null;

  const [conversation] = await db.select().from(liveChatConversations).where(eq(liveChatConversations.id, id));
  return conversation || null;
}

/**
 * Get live chat conversation by session ID (for guest users)
 */
export async function getLiveChatConversationBySessionId(sessionId: string): Promise<LiveChatConversation | null> {
  const db = await getDb();
  if (!db) return null;

  const [conversation] = await db.select().from(liveChatConversations).where(eq(liveChatConversations.sessionId, sessionId));
  return conversation || null;
}

/**
 * Get active conversation for a user
 */
export async function getActiveLiveChatConversation(userId: number): Promise<LiveChatConversation | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.select()
    .from(liveChatConversations)
    .where(eq(liveChatConversations.userId, userId))
    .orderBy(desc(liveChatConversations.createdAt));
  
  const conversation = results.length > 0 ? results[0] : null;
  
  // Return only if status is waiting or active
  if (conversation && (conversation.status === 'waiting' || conversation.status === 'active')) {
    return conversation;
  }
  return null;
}

/**
 * Get all conversations for admin (support agents)
 */
export async function getAllLiveChatConversations(): Promise<LiveChatConversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(liveChatConversations)
    .orderBy(desc(liveChatConversations.createdAt));
}

/**
 * Get conversations assigned to an agent
 */
export async function getAgentLiveChatConversations(agentId: number): Promise<LiveChatConversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(liveChatConversations)
    .where(eq(liveChatConversations.assignedAgentId, agentId))
    .orderBy(desc(liveChatConversations.updatedAt));
}

/**
 * Update live chat conversation
 */
export async function updateLiveChatConversation(
  id: number,
  data: Partial<LiveChatConversation>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(liveChatConversations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(liveChatConversations.id, id));
}

/**
 * Assign conversation to an agent
 */
export async function assignLiveChatToAgent(
  conversationId: number,
  agentId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(liveChatConversations)
    .set({
      assignedAgentId: agentId,
      status: 'active',
      assignedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(liveChatConversations.id, conversationId));
}

/**
 * Create a live chat message
 */
export async function createLiveChatMessage(
  data: InsertLiveChatMessage
): Promise<LiveChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [message] = await db.insert(liveChatMessages).values(data).$returningId();
  const [result] = await db.select().from(liveChatMessages).where(eq(liveChatMessages.id, message.id));
  
  // Update conversation's updatedAt timestamp
  await db.update(liveChatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(liveChatConversations.id, data.conversationId));
  
  return result;
}

/**
 * Get messages for a conversation
 */
export async function getLiveChatMessages(conversationId: number): Promise<LiveChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(liveChatMessages)
    .where(eq(liveChatMessages.conversationId, conversationId))
    .orderBy(liveChatMessages.createdAt);
}

/**
 * Mark messages as read
 */
export async function markLiveChatMessagesAsRead(
  conversationId: number,
  readerId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(liveChatMessages)
    .set({ read: 1, readAt: new Date() })
    .where(eq(liveChatMessages.conversationId, conversationId));
}

// Export supportMessages table for use in routers
export { supportMessages };

// Export payments table for use in routers
export { payments };

/**
 * System Settings Functions
 */

/**
 * Get a system setting by key
 */
export async function getSystemSetting(settingKey: string): Promise<SystemSetting | null> {
  const db = await getDb();
  if (!db) return null;

  const [setting] = await db.select()
    .from(systemSettings)
    .where(eq(systemSettings.key, settingKey));

  return setting || null;
}

/**
 * Get all system settings by key pattern (e.g., 'WALLET_ADDRESS_%')
 */
export async function getSystemSettingsByPattern(pattern: string): Promise<SystemSetting[]> {
  const db = await getDb();
  if (!db) return [];

  // For MySQL LIKE queries with Drizzle
  const { sql } = await import('drizzle-orm');
  return db.select()
    .from(systemSettings)
    .where(sql`${systemSettings.key} LIKE ${pattern}`);
}

/**
 * Get all system settings
 */
export async function getAllSystemSettings(): Promise<SystemSetting[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(systemSettings);
}

/**
 * Update or create a system setting
 */
export async function upsertSystemSetting(
  settingKey: string,
  settingValue: string,
  description: string | null,
  settingType: 'string' | 'number' | 'boolean' | 'json',
  updatedBy: number
): Promise<SystemSetting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if setting exists
  const existing = await getSystemSetting(settingKey);

  if (existing) {
    // Update existing setting
    await db.update(systemSettings)
      .set({
        value: settingValue,
        type: settingType,
        description: description || existing.description,
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.key, settingKey));

    const [updated] = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, settingKey));

    return updated;
  } else {
    // Insert new setting
    const [inserted] = await db.insert(systemSettings).values({
      key: settingKey,
      value: settingValue,
      type: settingType,
      description: description || null,
      isPublic: 0, // Default to private
      updatedBy
    }).$returningId();

    const [result] = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.id, inserted.id));

    return result;
  }
}

/**
 * Delete a system setting
 */
export async function deleteSystemSetting(key: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(systemSettings)
    .where(eq(systemSettings.key, key));
}

/**
 * Get crypto wallet addresses with fallback to environment variables
 */
export async function getCryptoWallets(): Promise<{
  btc: string;
  eth: string;
  usdt: string;
  usdc: string;
}> {
  const db = await getDb();
  if (!db) {
    // Fallback to environment variables
    return {
      btc: process.env.WALLET_ADDRESS_BTC || '',
      eth: process.env.WALLET_ADDRESS_ETH || '',
      usdt: process.env.WALLET_ADDRESS_USDT || '',
      usdc: process.env.WALLET_ADDRESS_USDC || ''
    };
  }

  const settings = await getSystemSettingsByPattern('WALLET_ADDRESS_%');
  const wallets = {
    btc: process.env.WALLET_ADDRESS_BTC || '',
    eth: process.env.WALLET_ADDRESS_ETH || '',
    usdt: process.env.WALLET_ADDRESS_USDT || '',
    usdc: process.env.WALLET_ADDRESS_USDC || ''
  };

  // Override with database values if they exist
  for (const setting of settings) {
    if (setting.key === 'WALLET_ADDRESS_BTC' && setting.value) {
      wallets.btc = setting.value;
    } else if (setting.key === 'WALLET_ADDRESS_ETH' && setting.value) {
      wallets.eth = setting.value;
    } else if (setting.key === 'WALLET_ADDRESS_USDT' && setting.value) {
      wallets.usdt = setting.value;
    } else if (setting.key === 'WALLET_ADDRESS_USDC' && setting.value) {
      wallets.usdc = setting.value;
    }
  }

  return wallets;
}

/**
 * Audit Log Functions
 */

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(auditLog)
    .values(data)
    .$returningId();
  
  return await db.select()
    .from(auditLog)
    .where(eq(auditLog.id, result.id))
    .then(rows => rows[0]);
}

export async function getAuditLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAuditLogsByAction(action: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(auditLog)
    .where(eq(auditLog.action, action))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

export async function getAuditLogsByUser(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(auditLog)
    .where(eq(auditLog.userId, userId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

export async function getLoanById(loanId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(loanApplications)
    .where(eq(loanApplications.id, loanId));
  
  return result[0] || null;
}

export async function getPaymentByLoanId(loanId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(payments)
    .where(eq(payments.loanApplicationId, loanId));
  
  return result[0] || null;
}

export async function getDisbursementByLoanId(loanId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(disbursements)
    .where(eq(disbursements.loanApplicationId, loanId));
  
  return result[0] || null;
}

