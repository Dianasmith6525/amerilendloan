import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Define all enums first
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "qualified", "rewarded"]);
export const otpPurposeEnum = pgEnum("otp_purpose", ["signup", "login", "loan_application"]);
export const documentTypeEnum = pgEnum("document_type", ["drivers_license", "state_id", "passport", "other"]);
export const employmentStatusEnum = pgEnum("employment_status", ["employed", "self_employed", "unemployed", "retired"]);
export const loanTypeEnum = pgEnum("loan_type", ["installment", "short_term"]);
export const idVerificationStatusEnum = pgEnum("id_verification_status", ["pending", "verified", "failed", "manual_review"]);
export const loanStatusEnum = pgEnum("loan_status", ["pending", "under_review", "approved", "rejected", "disbursed", "active", "paid_off", "defaulted"]);
export const calculationModeEnum = pgEnum("calculation_mode", ["percentage", "fixed"]);
export const disbursementStatusEnum = pgEnum("disbursement_status", ["pending", "processing", "completed", "failed", "cancelled"]);
export const settingTypeEnum = pgEnum("setting_type", ["string", "number", "boolean", "json"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["email", "sms", "push"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed", "read"]);
export const supportStatusEnum = pgEnum("support_status", ["open", "in_progress", "resolved", "closed"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);
export const supportCategoryEnum = pgEnum("support_category", ["account", "billing", "technical", "feedback", "other"]);
export const senderTypeEnum = pgEnum("sender_type", ["user", "agent", "system"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "system", "file"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["general", "loan_inquiry", "payment_issue", "technical_support", "complaint", "other"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  phoneNumber: varchar("phone", { length: 20 }), // Maps to 'phone' column in DB
  password: varchar("passwordHash", { length: 255 }), // Maps to 'passwordHash' column in DB
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  // Note: referralCode and referredBy don't exist in current DB schema
  // referralCode: varchar("referralCode", { length: 10 }).unique(),
  // referredBy: integer("referredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
  dependents: integer("dependents"),
  citizenshipStatus: varchar("citizenshipStatus", { length: 50 }),
  employmentStatus: varchar("employmentStatus", { length: 50 }),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: integer("monthlyIncome"),
  priorBankruptcy: integer("priorBankruptcy"),
  bankruptcyDate: varchar("bankruptcyDate", { length: 10 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Referral tracking and rewards
 */
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrerId").notNull(), // User who made the referral
  referredUserId: integer("referredUserId").notNull(), // User who was referred
  referralCode: varchar("referralCode", { length: 10 }).notNull(), // Code used for tracking
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  rewardAmount: integer("rewardAmount"), // Reward amount in cents
  rewardPaidAt: timestamp("rewardPaidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
export const otpCodes = pgTable("otpCodes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  verified: integer("verified").default(0).notNull(), // 0 = not verified, 1 = verified
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

/**
 * Legal document acceptances tracking
 */
export const legalAcceptances = pgTable("legalAcceptances", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  loanApplicationId: integer("loanApplicationId"),  // Optional, for loan-specific agreements
  documentType: varchar("documentType", { length: 50 }).notNull(),
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
export const loanApplications = pgTable("loanApplications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  referenceNumber: varchar("referenceNumber", { length: 20 }).unique(), // Unique tracking number (auto-generated)
  
  // Applicant information
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  // phone: varchar("phone", { length: 20 }).notNull(), // Column doesn't exist in DB
  dateOfBirth: varchar("dateOfBirth", { length: 10 }).notNull(), // YYYY-MM-DD
  ssn: varchar("ssn", { length: 11 }).notNull(), // XXX-XX-XXXX
  
  // Address
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(), // US state code
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  
  // Employment information
  employmentStatus: varchar({ length: 50 }).notNull(),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: integer("monthlyIncome").notNull(), // in cents
  
  // Loan details
  loanType: varchar({ length: 50 }).notNull(),
  requestedAmount: integer("requestedAmount").notNull(), // in cents
  loanPurpose: text("loanPurpose").notNull(),
  
  // Approval details
  approvedAmount: integer("approvedAmount"), // in cents, null if not approved
  processingFeeAmount: integer("processingFeeAmount"), // in cents, calculated after approval
  processingFeePaid: integer("processingFeePaid").default(0).notNull(), // 0 = not paid, 1 = paid
  processingFeePaymentId: integer("processingFeePaymentId"), // Reference to payment record
  
  // Payment Verification by Admin
  paymentVerified: integer("paymentVerified").default(0).notNull(), // 0 = not verified, 1 = verified by admin
  paymentVerifiedBy: integer("paymentVerifiedBy"), // Admin user ID who verified payment
  paymentVerifiedAt: timestamp("paymentVerifiedAt"), // When payment was verified
  paymentVerificationNotes: text("paymentVerificationNotes"), // Admin notes on payment verification
  paymentProofUrl: text("paymentProofUrl"), // Optional: Screenshot/proof of payment uploaded by user
  
  // ID Verification Documents (stored as base64 encoded strings in database)
  // Using text to support up to 16MB per image (base64 encoded ~2-5MB typical)
  idFrontUrl: text("idFrontUrl"), // Front of government-issued ID (base64 data or file path for legacy)
  idBackUrl: text("idBackUrl"), // Back of government-issued ID (base64 data or file path for legacy)
  selfieUrl: text("selfieUrl"), // Selfie photo with ID (base64 data or file path for legacy)
  idVerificationStatus: varchar("idVerificationStatus", { length: 50 }).default("pending"),
  idVerificationNotes: text("idVerificationNotes"), // Admin notes on ID verification
  
  // IP Tracking and Location
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6 address
  ipCountry: varchar("ipCountry", { length: 100 }), // Country from IP lookup
  ipRegion: varchar("ipRegion", { length: 100 }), // State/Region from IP lookup
  ipCity: varchar("ipCity", { length: 100 }), // City from IP lookup
  ipTimezone: varchar("ipTimezone", { length: 100 }), // Timezone from IP lookup
  
  // Status tracking
  status: varchar({ length: 50 }).default("pending").notNull(),
  
  rejectionReason: text("rejectionReason"),
  adminNotes: text("adminNotes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  disbursedAt: timestamp("disbursedAt"),
});

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = typeof loanApplications.$inferInsert;

/**
 * System configuration for processing fees
 */
export const feeConfiguration = pgTable("feeConfiguration", {
  id: serial("id").primaryKey(),
  
  // Fee calculation mode
  calculationMode: varchar({ length: 50 }).default("percentage").notNull(),
  
  // Percentage mode settings (1.5% - 2.5%)
  percentageRate: integer("percentageRate").default(200).notNull(), // stored as basis points (200 = 2.00%)
  
  // Fixed fee mode settings ($1.50 - $2.50)
  fixedFeeAmount: integer("fixedFeeAmount").default(200).notNull(), // in cents (200 = $2.00)
  
  // Metadata
  isActive: integer("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  updatedBy: integer("updatedBy"), // admin user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FeeConfiguration = typeof feeConfiguration.$inferSelect;
export type InsertFeeConfiguration = typeof feeConfiguration.$inferInsert;

/**
 * Loan disbursement records
 */
export const disbursements = pgTable("disbursements", {
  id: serial("id").primaryKey(),
  loanApplicationId: integer("loanApplicationId").notNull(),
  userId: integer("userId").notNull(),
  
  // Disbursement details
  amount: integer("amount").notNull(), // in cents
  
  // Bank account details (simplified for demo)
  accountHolderName: varchar("accountHolderName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 50 }).notNull(),
  routingNumber: varchar("routingNumber", { length: 20 }).notNull(),
  
  // Status tracking
  status: varchar({ length: 50 }).default("pending").notNull(),
  
  transactionId: varchar("transactionId", { length: 255 }), // External transaction reference
  failureReason: text("failureReason"),
  adminNotes: text("adminNotes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  initiatedBy: integer("initiatedBy"), // admin user id
});

export type Disbursement = typeof disbursements.$inferSelect;
export type InsertDisbursement = typeof disbursements.$inferInsert;

/**
 * Notification logs for tracking emails and alerts sent to users
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  loanApplicationId: integer("loanApplicationId"),
  
  // Notification details
  type: varchar({ length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Status tracking
  status: varchar({ length: 50 }).default("pending").notNull(),
  
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Live chat conversations between users and support agents
 */
export const liveChatConversations = pgTable("liveChatConversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // Can be null for non-authenticated users
  guestName: varchar("guestName", { length: 255 }), // For non-authenticated users
  guestEmail: varchar("guestEmail", { length: 320 }), // For non-authenticated users
  
  // Assignment
  assignedAgentId: integer("assignedAgentId"), // Admin user handling the chat
  
  // Status
  status: varchar({ length: 50 }).default("waiting").notNull(),
  
  // Priority
  priority: varchar({ length: 50 }).default("normal").notNull(),
  
  // Subject/Category
  subject: varchar("subject", { length: 255 }),
  category: varchar({ length: 50 }).default("general").notNull(),
  
  // Ratings
  userRating: integer("userRating"), // 1-5 stars
  userFeedback: text("userFeedback"),
  
  // Session info
  sessionId: varchar("sessionId", { length: 100 }).unique(), // For tracking guest sessions
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  assignedAt: timestamp("assignedAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
});

export type LiveChatConversation = typeof liveChatConversations.$inferSelect;
export type InsertLiveChatConversation = typeof liveChatConversations.$inferInsert;

/**
 * Individual messages within live chat conversations
 */
export const liveChatMessages = pgTable("liveChatMessages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  
  // Sender
  senderId: integer("senderId"), // User or agent ID
  senderType: varchar({ length: 50 }).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  
  // Message content
  messageType: varchar({ length: 50 }).default("text").notNull(),
  content: text("content").notNull(),
  
  // File attachments (optional)
  fileUrl: text("fileUrl"),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: integer("fileSize"),
  
  // Status
  read: integer("read").default(0).notNull(), // 0 = unread, 1 = read
  readAt: timestamp("readAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type InsertLiveChatMessage = typeof liveChatMessages.$inferInsert;

/**
 * Audit log for system-wide actions and security events
 */
export const auditLog = pgTable("auditLog", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  
  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "loan_approved", "payment_processed"
  entityType: varchar("entityType", { length: 50 }), // e.g., "loanApplication", "payment"
  entityId: integer("entityId"),
  
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
export const supportMessages = pgTable("supportMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId"), // Can be null for non-logged-in users
  
  // Sender information
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderPhone: varchar("senderPhone", { length: 20 }),
  
  // Message details
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  category: varchar({ length: 50 }).default("general").notNull(),
  
  // Status tracking
  status: varchar({ length: 50 }).default("new").notNull(),
  priority: varchar({ length: 50 }).default("medium").notNull(),
  
  // Admin response
  adminResponse: text("adminResponse"),
  respondedBy: integer("respondedBy"), // Admin user ID who responded
  respondedAt: timestamp("respondedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Payment transactions and repayments
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  
  // Transaction details
  transactionId: varchar("transactionId", { length: 100 }).unique(), // Unique transaction reference (optional for pending payments)
  loanApplicationId: integer("loanApplicationId").notNull(), // Reference to loan application
  userId: integer("userId").notNull(), // Reference to user who made payment
  
  // Payment information
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).default("USD"), // USD, BTC, ETH, etc.
  
  // Payment method and provider
  paymentMethod: varchar({ length: 50 }).notNull(),
  paymentProvider: varchar({ length: 50 }),
  
  // Status tracking
  status: varchar({ length: 50 }).default("pending").notNull(),
  
  // Payment gateway details
  paymentIntentId: varchar("paymentIntentId", { length: 255 }), // Stripe/AuthorizeNet transaction ID
  
  // Card payment details
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardBrand: varchar("cardBrand", { length: 50 }), // Visa, Mastercard, etc.
  
  // Crypto payment details
  cryptoCurrency: varchar({ length: 50 }),
  cryptoAddress: varchar("cryptoAddress", { length: 255 }),
  cryptoAmount: varchar("cryptoAmount", { length: 50 }), // Crypto amount as string (e.g., "0.0012 BTC")
  cryptoTxHash: varchar("cryptoTxHash", { length: 255 }),
  
  // Payment details
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  reference: varchar("reference", { length: 255 }), // External payment reference (e.g., Stripe ID)
  description: text("description"), // Payment description or notes
  
  // Financial tracking
  principalAmount: integer("principalAmount"), // Amount applied to principal
  interestAmount: integer("interestAmount"), // Amount applied to interest
  feesAmount: integer("feesAmount"), // Amount applied to fees
  
  // Processor information
  processor: varchar("processor", { length: 100 }), // e.g., "stripe", "authorize.net", "coinbase"
  processorTransactionId: varchar("processorTransactionId", { length: 255 }),
  
  // Metadata
  metadata: text("metadata"), // JSON string for additional data
  
  // Admin tracking
  processedBy: integer("processedBy"), // Admin who processed/verified payment
  processedAt: timestamp("processedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * System settings table for configuration values
 */
export const systemSettings = pgTable("systemSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: varchar({ length: 50 }).default("string").notNull(),
  category: varchar("category", { length: 50 }), // Add category field
  description: text("description"),
  isPublic: integer("isPublic").default(0).notNull(), // 0 = private (admin only), 1 = public (visible to users)
  updatedBy: integer("updatedBy"), // Admin user who last updated this setting
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Draft loan applications table - for saving incomplete applications
 */
export const draftApplications = pgTable("draftApplications", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(), // User's email (even if not registered yet)
  userId: integer("userId"), // Optional - linked user if they have an account
  draftData: text("draftData").notNull(), // JSON string of form data
  currentStep: integer("currentStep").default(1).notNull(), // Which step they were on
  expiresAt: timestamp("expiresAt").notNull(), // Auto-delete old drafts after 30 days
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DraftApplication = typeof draftApplications.$inferSelect;
export type InsertDraftApplication = typeof draftApplications.$inferInsert;

/**
 * Password reset tokens table
 */
export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: integer("used").default(0).notNull(), // 0 = not used, 1 = used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;





