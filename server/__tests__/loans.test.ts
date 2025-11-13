/**
 * Loan Processing Tests
 * Tests for loan application, approval, rejection workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  createTestUser,
  createTestLoan,
  cleanupTestUser,
  getTestLoan,
} from "../../tests/helpers/test-db";
import { getDb } from "../db";
import { loanApplications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const db = await getDb();

describe("Loan Processing", () => {
  let testUser: any;
  const testEmail = "test-loan@test.com";

  beforeAll(async () => {
    testUser = await createTestUser({
      email: testEmail,
      password: "Test123!@#",
      firstName: "Loan",
      lastName: "Tester",
    });
  });

  afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  describe("Loan Application Creation", () => {
    it("should create a pending loan application", async () => {
      const loan = await createTestLoan({
        userId: testUser.id,
        requestedAmount: 5000,
        purpose: "debt_consolidation",
      });

      expect(loan).toBeDefined();
      expect(loan.userId).toBe(testUser.id);
      expect(loan.requestedAmount).toBe(5000);
      expect(loan.status).toBe("pending");
      expect(loan.purpose).toBe("debt_consolidation");
    });

    it("should require valid loan amount", async () => {
      await expect(
        createTestLoan({
          userId: testUser.id,
          requestedAmount: -1000, // Invalid negative amount
        })
      ).rejects.toThrow();
    });

    it("should store all required fields", async () => {
      const loan = await createTestLoan({
        userId: testUser.id,
        requestedAmount: 10000,
        purpose: "home_improvement",
      });

      expect(loan.employmentStatus).toBeDefined();
      expect(loan.monthlyIncome).toBeDefined();
      expect(loan.creditScore).toBeDefined();
      expect(loan.createdAt).toBeDefined();
    });
  });

  describe("Loan Approval", () => {
    let loanId: number;

    beforeEach(async () => {
      const loan = await createTestLoan({
        userId: testUser.id,
        requestedAmount: 7500,
        purpose: "medical",
      });
      loanId = loan.id;
    });

    it("should approve a loan", async () => {
      await db
        .update(loanApplications)
        .set({
          status: "approved",
          approvedBy: 1, // Admin ID
          approvedAt: new Date(),
          approvalNotes: "Test approval",
        })
        .where(eq(loanApplications.id, loanId));

      const loan = await getTestLoan(testUser.id);
      expect(loan.status).toBe("approved");
      expect(loan.approvedBy).toBeDefined();
      expect(loan.approvedAt).toBeDefined();
    });

    it("should reject a loan", async () => {
      await db
        .update(loanApplications)
        .set({
          status: "rejected",
          rejectedBy: 1,
          rejectedAt: new Date(),
          rejectionReason: "Insufficient credit score",
        })
        .where(eq(loanApplications.id, loanId));

      const loan = await getTestLoan(testUser.id);
      expect(loan.status).toBe("rejected");
      expect(loan.rejectionReason).toBe("Insufficient credit score");
    });
  });

  describe("Loan Disbursement", () => {
    it("should mark loan as disbursed", async () => {
      const loan = await createTestLoan({
        userId: testUser.id,
        requestedAmount: 15000,
        status: "approved",
      });

      await db
        .update(loanApplications)
        .set({
          status: "disbursed",
          disbursedAt: new Date(),
          disbursementMethod: "bank_transfer",
        })
        .where(eq(loanApplications.id, loan.id));

      const [updatedLoan] = await db
        .select()
        .from(loanApplications)
        .where(eq(loanApplications.id, loan.id));

      expect(updatedLoan.status).toBe("disbursed");
      expect(updatedLoan.disbursedAt).toBeDefined();
      expect(updatedLoan.disbursementMethod).toBe("bank_transfer");
    });
  });

  describe("Multiple Loans", () => {
    it("should allow multiple loans per user", async () => {
      await createTestLoan({
        userId: testUser.id,
        requestedAmount: 3000,
        purpose: "education",
      });

      await createTestLoan({
        userId: testUser.id,
        requestedAmount: 5000,
        purpose: "car_repair",
      });

      const loans = await db
        .select()
        .from(loanApplications)
        .where(eq(loanApplications.userId, testUser.id));

      expect(loans.length).toBeGreaterThanOrEqual(2);
    });
  });
});
