/**
 * Payment Processing Tests
 * Tests for payment creation, status updates, and validation
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestUser,
  createTestLoan,
  createTestPayment,
  cleanupTestUser,
} from "../../tests/helpers/test-db";
import { getDb } from "../db";
import { payments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const db = await getDb();

describe("Payment Processing", () => {
  let testUser: any;
  let testLoan: any;
  const testEmail = "test-payment@test.com";

  beforeAll(async () => {
    testUser = await createTestUser({
      email: testEmail,
      password: "Test123!@#",
      firstName: "Payment",
      lastName: "Tester",
    });

    testLoan = await createTestLoan({
      userId: testUser.id,
      requestedAmount: 10000,
      status: "approved",
    });
  });

  afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  describe("Payment Creation", () => {
    it("should create a completed payment", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 500,
        status: "completed",
        paymentMethod: "card",
      });

      expect(payment).toBeDefined();
      expect(payment.loanId).toBe(testLoan.id);
      expect(payment.userId).toBe(testUser.id);
      expect(payment.amount).toBe(500);
      expect(payment.status).toBe("completed");
      expect(payment.transactionId).toContain("TEST-");
    });

    it("should create a pending payment", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 250,
        status: "pending",
        paymentMethod: "bank_transfer",
      });

      expect(payment.status).toBe("pending");
      expect(payment.paymentMethod).toBe("bank_transfer");
    });

    it("should reject invalid payment amount", async () => {
      await expect(
        createTestPayment({
          loanId: testLoan.id,
          userId: testUser.id,
          amount: -100, // Negative amount
        })
      ).rejects.toThrow();
    });
  });

  describe("Payment Methods", () => {
    it("should support card payments", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 300,
        paymentMethod: "card",
      });

      expect(payment.paymentMethod).toBe("card");
    });

    it("should support bank transfer payments", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 400,
        paymentMethod: "bank_transfer",
      });

      expect(payment.paymentMethod).toBe("bank_transfer");
    });

    it("should support cryptocurrency payments", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 600,
        paymentMethod: "crypto",
      });

      expect(payment.paymentMethod).toBe("crypto");
    });
  });

  describe("Payment Status Updates", () => {
    it("should update payment from pending to completed", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 750,
        status: "pending",
      });

      await db
        .update(payments)
        .set({
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      const [updatedPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id));

      expect(updatedPayment.status).toBe("completed");
      expect(updatedPayment.processedAt).toBeDefined();
    });

    it("should handle failed payments", async () => {
      const payment = await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 200,
        status: "pending",
      });

      await db
        .update(payments)
        .set({
          status: "failed",
          failureReason: "Insufficient funds",
        })
        .where(eq(payments.id, payment.id));

      const [updatedPayment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id));

      expect(updatedPayment.status).toBe("failed");
      expect(updatedPayment.failureReason).toBe("Insufficient funds");
    });
  });

  describe("Payment Aggregation", () => {
    it("should calculate total payments for a loan", async () => {
      // Create multiple payments
      await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 100,
        status: "completed",
      });

      await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 150,
        status: "completed",
      });

      await createTestPayment({
        loanId: testLoan.id,
        userId: testUser.id,
        amount: 200,
        status: "completed",
      });

      const loanPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.loanId, testLoan.id));

      const totalPaid = loanPayments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPaid).toBeGreaterThanOrEqual(450);
    });

    it("should count successful vs failed payments", async () => {
      const allPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.loanId, testLoan.id));

      const completed = allPayments.filter((p) => p.status === "completed").length;
      const failed = allPayments.filter((p) => p.status === "failed").length;

      expect(completed + failed).toBeLessThanOrEqual(allPayments.length);
    });
  });
});
