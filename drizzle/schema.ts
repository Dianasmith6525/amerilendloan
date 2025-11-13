import { int, mysqlEnum, mysqlTable, text, mediumtext, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phoneNumber: varchar("phone", { length: 20 }), // Maps to 'phone' column in DB
  password: varchar("passwordHash", { length: 255 }), // Maps to 'passwordHash' column in DB
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Note: referralCode and referredBy don't exist in current DB schema
  // referralCode: varchar("referralCode", { length: 10 }).unique(),
  // referredBy: int("referredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  
  // Additional fields from actual database
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  middleInitial: varchar("middleInitial", { length: 1 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  ssn: varchar("ssn", { length: 11 }),
  idType: varchar("idType", { length: 50 }),
  idNumber: varchar("idNumber", { length: 100 }),
  maritalStatus: varchar("maritalStatus", { length: 50 }),
  dependents: int("dependents"),
  citizenshipStatus: varchar("citizenshipStatus", { length: 50 }),
  employmentStatus: varchar("employmentStatus", { length: 50 }),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: int("monthlyIncome"),
  priorBankruptcy: int("priorBankruptcy"),
  bankruptcyDate: varchar("bankruptcyDate", { length: 10 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Referral tracking and rewards
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who made the referral
  referredUserId: int("referredUserId").notNull(), // User who was referred
  referralCode: varchar("referralCode", { length: 10 }).notNull(), // Code used for tracking
  status: mysqlEnum("status", [
    "pending",      // Referred user signed up
    "qualified",    // Referred user got approved loan
    "rewarded"      // Referrer received reward
  ]).default("pending").notNull(),
  rewardAmount: int("rewardAmount"), // Reward amount in cents
  rewardPaidAt: timestamp("rewardPaidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * OTP codes for authentication (signup and login)
```

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OTP codes for authentication (signup and login)
 */
export const otpCodes = mysqlTable("otpCodes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: mysqlEnum("purpose", ["signup", "login", "loan_application"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verified: int("verified").default(0).notNull(), // 0 = not verified, 1 = verified
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

/**
 * Legal document acceptances tracking
 */
export const legalAcceptances = mysqlTable("legalAcceptances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loanApplicationId: int("loanApplicationId"),  // Optional, for loan-specific agreements
  documentType: mysqlEnum("documentType", [
    "terms_of_service",
    "privacy_policy",
    "loan_agreement",
    "esign_consent"
  ]).notNull(),
  documentVersion: varchar("documentVersion", { length: 20 }).notNull(),  // e.g., "1.0", "2.1"
  ipAddress: varchar("ipAddress", { length: 45 }),  // IPv4 or IPv6
  userAgent: text("userAgent"),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});

export type LegalAcceptance = typeof legalAcceptances.$inferSelect;
export type InsertLegalAcceptance = typeof legalAcceptances.$inferInsert;

/**
 * Loan applications submitted by users
 */
export const loanApplications = mysqlTable("loanApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 20 }).unique(), // Unique tracking number (auto-generated)
  
  // Applicant information
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(), // YYYY-MM-DD
  ssn: varchar("ssn", { length: 11 }).notNull(), // XXX-XX-XXXX
  
  // Address
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(), // US state code
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  
  // Employment information
  employmentStatus: mysqlEnum("employmentStatus", ["employed", "self_employed", "unemployed", "retired"]).notNull(),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: int("monthlyIncome").notNull(), // in cents
  
  // Loan details
  loanType: mysqlEnum("loanType", ["installment", "short_term"]).notNull(),
  requestedAmount: int("requestedAmount").notNull(), // in cents
  loanPurpose: text("loanPurpose").notNull(),
  
  // Approval details
  approvedAmount: int("approvedAmount"), // in cents, null if not approved
  processingFeeAmount: int("processingFeeAmount"), // in cents, calculated after approval
  processingFeePaid: int("processingFeePaid").default(0).notNull(), // 0 = not paid, 1 = paid
  processingFeePaymentId: int("processingFeePaymentId"), // Reference to payment record
  
  // Payment Verification by Admin
  paymentVerified: int("paymentVerified").default(0).notNull(), // 0 = not verified, 1 = verified by admin
  paymentVerifiedBy: int("paymentVerifiedBy"), // Admin user ID who verified payment
  paymentVerifiedAt: timestamp("paymentVerifiedAt"), // When payment was verified
  paymentVerificationNotes: text("paymentVerificationNotes"), // Admin notes on payment verification
  paymentProofUrl: mediumtext("paymentProofUrl"), // Optional: Screenshot/proof of payment uploaded by user
  
  // ID Verification Documents (stored as base64 encoded strings in database)
  // Using mediumtext to support up to 16MB per image (base64 encoded ~2-5MB typical)
  idFrontUrl: mediumtext("idFrontUrl"), // Front of government-issued ID (base64 data or file path for legacy)
  idBackUrl: mediumtext("idBackUrl"), // Back of government-issued ID (base64 data or file path for legacy)
  selfieUrl: mediumtext("selfieUrl"), // Selfie photo with ID (base64 data or file path for legacy)
  idVerificationStatus: mysqlEnum("idVerificationStatus", [
    "pending",    // Not yet reviewed
    "verified",   // ID verified by admin
    "rejected"    // ID verification failed
  ]).default("pending"),
  idVerificationNotes: text("idVerificationNotes"), // Admin notes on ID verification
  
  // IP Tracking and Location
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6 address
  ipCountry: varchar("ipCountry", { length: 100 }), // Country from IP lookup
  ipRegion: varchar("ipRegion", { length: 100 }), // State/Region from IP lookup
  ipCity: varchar("ipCity", { length: 100 }), // City from IP lookup
  ipTimezone: varchar("ipTimezone", { length: 100 }), // Timezone from IP lookup
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",        // Initial submission
    "under_review",   // Being reviewed by admin
    "approved",       // Approved, awaiting fee payment
    "fee_pending",    // Fee payment initiated
    "fee_paid",       // Fee confirmed paid
    "disbursed",      // Loan disbursed
    "rejected",       // Application rejected
    "cancelled"       // Cancelled by user
  ]).default("pending").notNull(),
  
  rejectionReason: text("rejectionReason"),
  adminNotes: text("adminNotes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  disbursedAt: timestamp("disbursedAt"),
});

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = typeof loanApplications.$inferInsert;

/**
 * System configuration for processing fees
 */
export const feeConfiguration = mysqlTable("feeConfiguration", {
  id: int("id").autoincrement().primaryKey(),
  
  // Fee calculation mode
  calculationMode: mysqlEnum("calculationMode", ["percentage", "fixed"]).default("percentage").notNull(),
  
  // Percentage mode settings (1.5% - 2.5%)
  percentageRate: int("percentageRate").default(200).notNull(), // stored as basis points (200 = 2.00%)
  
  // Fixed fee mode settings ($1.50 - $2.50)
  fixedFeeAmount: int("fixedFeeAmount").default(200).notNull(), // in cents (200 = $2.00)
  
  // Metadata
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  updatedBy: int("updatedBy"), // admin user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeeConfiguration = typeof feeConfiguration.$inferSelect;
export type InsertFeeConfiguration = typeof feeConfiguration.$inferInsert;

/**
 * Loan disbursement records
 */
export const disbursements = mysqlTable("disbursements", {
  id: int("id").autoincrement().primaryKey(),
  loanApplicationId: int("loanApplicationId").notNull(),
  userId: int("userId").notNull(),
  
  // Disbursement details
  amount: int("amount").notNull(), // in cents
  
  // Bank account details (simplified for demo)
  accountHolderName: varchar("accountHolderName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  routingNumber: varchar("routingNumber", { length: 20 }).notNull(),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",      // Awaiting processing
    "processing",   // Being processed
    "completed",    // Successfully disbursed
    "failed"        // Disbursement failed
  ]).default("pending").notNull(),
  
  transactionId: varchar("transactionId", { length: 255 }), // External transaction reference
  failureReason: text("failureReason"),
  adminNotes: text("adminNotes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
  initiatedBy: int("initiatedBy"), // admin user id
});

export type Disbursement = typeof disbursements.$inferSelect;
export type InsertDisbursement = typeof disbursements.$inferInsert;

/**
 * Notification logs for tracking emails and alerts sent to users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loanApplicationId: int("loanApplicationId"),
  
  // Notification details
  type: mysqlEnum("type", [
    "loan_submitted",
    "loan_approved",
    "loan_rejected",
    "payment_confirmed",
    "loan_disbursed",
    "payment_reminder",
    "general"
  ]).notNull(),
  
  channel: mysqlEnum("channel", ["email", "sms", "push"]).default("email").notNull(),
  
  recipient: varchar("recipient", { length: 320 }).notNull(), // email or phone
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",
    "sent",
    "delivered",
    "failed",
    "bounced"
  ]).default("pending").notNull(),
  
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  errorMessage: text("errorMessage"),
  
  // Metadata
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * In-app notifications for users
 */
export const userNotifications = mysqlTable("userNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "loan_status",
    "payment_reminder",
    "payment_received",
    "disbursement",
    "system",
    "referral"
  ]).notNull(),
  read: int("read").default(0).notNull(), // 0 = unread, 1 = read
  actionUrl: varchar("actionUrl", { length: 500 }), // Optional link to relevant page
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = typeof userNotifications.$inferInsert;

/**
 * Live chat conversations between users and support agents
 */
export const liveChatConversations = mysqlTable("liveChatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Can be null for non-authenticated users
  guestName: varchar("guestName", { length: 255 }), // For non-authenticated users
  guestEmail: varchar("guestEmail", { length: 320 }), // For non-authenticated users
  
  // Assignment
  assignedAgentId: int("assignedAgentId"), // Admin user handling the chat
  
  // Status
  status: mysqlEnum("status", [
    "waiting",      // Waiting for agent
    "active",       // Active conversation with agent
    "resolved",     // Conversation resolved
    "closed"        // Conversation closed
  ]).default("waiting").notNull(),
  
  // Priority
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  
  // Subject/Category
  subject: varchar("subject", { length: 255 }),
  category: mysqlEnum("category", [
    "loan_inquiry",
    "application_status",
    "payment_issue",
    "technical_support",
    "general",
    "other"
  ]).default("general").notNull(),
  
  // Ratings
  userRating: int("userRating"), // 1-5 stars
  userFeedback: text("userFeedback"),
  
  // Session info
  sessionId: varchar("sessionId", { length: 100 }).unique(), // For tracking guest sessions
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  assignedAt: timestamp("assignedAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
});

export type LiveChatConversation = typeof liveChatConversations.$inferSelect;
export type InsertLiveChatConversation = typeof liveChatConversations.$inferInsert;

/**
 * Individual messages within live chat conversations
 */
export const liveChatMessages = mysqlTable("liveChatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  
  // Sender
  senderId: int("senderId"), // User or agent ID
  senderType: mysqlEnum("senderType", ["user", "agent", "system"]).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  
  // Message content
  messageType: mysqlEnum("messageType", ["text", "system", "file"]).default("text").notNull(),
  content: text("content").notNull(),
  
  // File attachments (optional)
  fileUrl: text("fileUrl"),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"),
  
  // Status
  read: int("read").default(0).notNull(), // 0 = unread, 1 = read
  readAt: timestamp("readAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type InsertLiveChatMessage = typeof liveChatMessages.$inferInsert;

/**
 * Audit log for system-wide actions and security events
 */
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "loan_approved", "payment_processed"
  entityType: varchar("entityType", { length: 50 }), // e.g., "loanApplication", "payment"
  entityId: int("entityId"),
  
  // Request details
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  // Change tracking
  oldValue: text("oldValue"), // JSON string of old state
  newValue: text("newValue"), // JSON string of new state
  
  // Metadata
  metadata: text("metadata"), // JSON string for additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Support messages from users to admin
 */
export const supportMessages = mysqlTable("supportMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Can be null for non-logged-in users
  
  // Sender information
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 20 }),
  
  // Message details
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  category: mysqlEnum("category", ["general", "loan_inquiry", "payment_issue", "technical_support", "complaint", "other"]).default("general").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", ["new", "in_progress", "resolved", "closed"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  
  // Admin response
  adminResponse: text("adminResponse"),
  respondedBy: int("respondedBy"), // Admin user ID who responded
  respondedAt: timestamp("respondedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Payment transactions and repayments
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  
  // Transaction details
  transactionId: varchar("transactionId", { length: 100 }).unique(), // Unique transaction reference (optional for pending payments)
  loanApplicationId: int("loanApplicationId").notNull(), // Reference to loan application
  userId: int("userId").notNull(), // Reference to user who made payment
  
  // Payment information
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).default("USD"), // USD, BTC, ETH, etc.
  
  // Payment method and provider
  paymentMethod: mysqlEnum("paymentMethod", [
    "card",
    "credit_card",
    "debit_card", 
    "bank_transfer",
    "ach",
    "crypto",
    "cash",
    "check",
    "other"
  ]).notNull(),
  paymentProvider: mysqlEnum("paymentProvider", [
    "stripe",
    "authorizenet",
    "crypto",
    "other"
  ]),
  
  // Status tracking
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "completed",
    "succeeded",
    "failed",
    "refunded",
    "cancelled"
  ]).default("pending").notNull(),
  
  // Payment gateway details
  paymentIntentId: varchar("paymentIntentId", { length: 255 }), // Stripe/AuthorizeNet transaction ID
  
  // Card payment details
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }), // Visa, Mastercard, etc.
  
  // Crypto payment details
  cryptoCurrency: mysqlEnum("cryptoCurrency", ["BTC", "ETH", "USDT", "USDC"]),
  cryptoAddress: varchar("cryptoAddress", { length: 255 }),
  cryptoAmount: varchar("cryptoAmount", { length: 50 }), // Crypto amount as string (e.g., "0.0012 BTC")
  cryptoTxHash: varchar("cryptoTxHash", { length: 255 }),
  
  // Payment details
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  reference: varchar("reference", { length: 255 }), // External payment reference (e.g., Stripe ID)
  description: text("description"), // Payment description or notes
  
  // Financial tracking
  principalAmount: int("principalAmount"), // Amount applied to principal
  interestAmount: int("interestAmount"), // Amount applied to interest
  feesAmount: int("feesAmount"), // Amount applied to fees
  
  // Processor information
  processor: varchar("processor", { length: 100 }), // e.g., "stripe", "authorize.net", "coinbase"
  processorTransactionId: varchar("processorTransactionId", { length: 255 }),
  
  // Metadata
  metadata: text("metadata"), // JSON string for additional data
  
  // Admin tracking
  processedBy: int("processedBy"), // Admin who processed/verified payment
  processedAt: timestamp("processedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * System settings table for configuration values
 */
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  category: varchar("category", { length: 50 }), // Add category field
  description: text("description"),
  isPublic: int("isPublic").default(0).notNull(), // 0 = private (admin only), 1 = public (visible to users)
  updatedBy: int("updatedBy"), // Admin user who last updated this setting
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Draft loan applications table - for saving incomplete applications
 */
export const draftApplications = mysqlTable("draftApplications", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(), // User's email (even if not registered yet)
  userId: int("userId"), // Optional - linked user if they have an account
  draftData: mediumtext("draftData").notNull(), // JSON string of form data
  currentStep: int("currentStep").default(1).notNull(), // Which step they were on
  expiresAt: timestamp("expiresAt").notNull(), // Auto-delete old drafts after 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DraftApplication = typeof draftApplications.$inferSelect;
export type InsertDraftApplication = typeof draftApplications.$inferInsert;

/**
 * Password reset tokens table
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: int("used").default(0).notNull(), // 0 = not used, 1 = used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
