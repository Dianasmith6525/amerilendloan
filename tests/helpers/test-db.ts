/**
 * Database Test Utilities
 * Helpers for seeding, cleanup, and assertions
 */

import { getDb } from "../../server/db";
import { users, loanApplications, payments, systemSettings, supportMessages } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Get database instance
const db = await getDb();

export interface TestUser {
  id?: number;
  email: string;
  password: string;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
}

export interface TestLoan {
  userId: number;
  requestedAmount: number;
  purpose?: string;
  status?: string;
}

/**
 * Create a test user
 */
export async function createTestUser(userData: TestUser) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const [user] = await db.insert(users).values({
    email: userData.email,
    password: hashedPassword,
    isAdmin: userData.isAdmin || false,
    firstName: userData.firstName || "Test",
    lastName: userData.lastName || "User",
    phoneNumber: "1234567890",
    dateOfBirth: "1990-01-01",
    ssn: "123456789",
    address: "123 Test St",
    city: "Test City",
    state: "CA",
    zipCode: "12345",
    employmentStatus: "employed",
    monthlyIncome: 5000,
    creditScore: 700,
  }).returning();
  
  return user;
}

/**
 * Create a test loan application
 */
export async function createTestLoan(loanData: TestLoan) {
  const [loan] = await db.insert(loanApplications).values({
    userId: loanData.userId,
    requestedAmount: loanData.requestedAmount,
    purpose: loanData.purpose || "debt_consolidation",
    status: loanData.status || "pending",
    employmentStatus: "employed",
    monthlyIncome: 5000,
    creditScore: 700,
  }).returning();
  
  return loan;
}

/**
 * Create a test payment
 */
export async function createTestPayment(paymentData: {
  loanId: number;
  userId: number;
  amount: number;
  status?: string;
  paymentMethod?: string;
}) {
  const [payment] = await db.insert(payments).values({
    loanId: paymentData.loanId,
    userId: paymentData.userId,
    amount: paymentData.amount,
    status: paymentData.status || "completed",
    paymentMethod: paymentData.paymentMethod || "card",
    transactionId: `TEST-${Date.now()}`,
  }).returning();
  
  return payment;
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  // Delete in correct order to respect foreign keys
  await db.delete(payments).where(sql`1=1`);
  await db.delete(supportMessages).where(sql`1=1`);
  await db.delete(loanApplications).where(sql`1=1`);
  await db.delete(users).where(eq(users.email, sql`LIKE 'test%@test.com'`));
}

/**
 * Clean up specific test user and related data
 */
export async function cleanupTestUser(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  
  if (user) {
    // Delete related data first
    await db.delete(payments).where(eq(payments.userId, user.id));
    await db.delete(supportMessages).where(eq(supportMessages.userId, user.id));
    await db.delete(loanApplications).where(eq(loanApplications.userId, user.id));
    
    // Delete user
    await db.delete(users).where(eq(users.id, user.id));
  }
}

/**
 * Get test user by email
 */
export async function getTestUser(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

/**
 * Get test loan by user ID
 */
export async function getTestLoan(userId: number) {
  const [loan] = await db.select().from(loanApplications).where(eq(loanApplications.userId, userId));
  return loan;
}

/**
 * Count records in a table
 */
export async function countRecords(table: string): Promise<number> {
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.raw(table)}`);
  return Number(result[0]?.count || 0);
}

/**
 * Seed minimal settings for testing
 */
export async function seedTestSettings() {
  const existingSettings = await db.select().from(systemSettings);
  
  if (existingSettings.length === 0) {
    await db.insert(systemSettings).values({
      companyName: "AmeriLend Test",
      supportEmail: "test@amerilend.com",
      supportPhone: "1234567890",
      companyAddress: "123 Test St",
      websiteUrl: "http://localhost:3000",
      maintenanceMode: false,
    });
  }
}
