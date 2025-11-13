/**
 * Authentication Tests
 * Tests for user registration, login, and session management
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, cleanupTestUser, getTestUser } from "../../tests/helpers/test-db";
import bcrypt from "bcryptjs";

describe("Authentication", () => {
  const testEmail = "test-auth@test.com";
  const testPassword = "Test123!@#";

  afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  describe("User Registration", () => {
    it("should create a new user with hashed password", async () => {
      const user = await createTestUser({
        email: testEmail,
        password: testPassword,
        firstName: "Auth",
        lastName: "Test",
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.password).not.toBe(testPassword); // Password should be hashed
      expect(user.firstName).toBe("Auth");
      expect(user.lastName).toBe("Test");
      expect(user.isAdmin).toBe(false);
    });

    it("should hash password correctly", async () => {
      const user = await getTestUser(testEmail);
      expect(user).toBeDefined();

      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      expect(isPasswordValid).toBe(true);
    });

    it("should not allow duplicate emails", async () => {
      await expect(
        createTestUser({
          email: testEmail,
          password: "AnotherPassword123!",
        })
      ).rejects.toThrow();
    });
  });

  describe("User Login", () => {
    it("should validate correct password", async () => {
      const user = await getTestUser(testEmail);
      const isValid = await bcrypt.compare(testPassword, user.password);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const user = await getTestUser(testEmail);
      const isValid = await bcrypt.compare("WrongPassword", user.password);
      expect(isValid).toBe(false);
    });
  });

  describe("Admin Users", () => {
    const adminEmail = "test-admin@test.com";

    afterAll(async () => {
      await cleanupTestUser(adminEmail);
    });

    it("should create admin user", async () => {
      const admin = await createTestUser({
        email: adminEmail,
        password: testPassword,
        isAdmin: true,
      });

      expect(admin.isAdmin).toBe(true);
    });

    it("should retrieve admin status", async () => {
      const admin = await getTestUser(adminEmail);
      expect(admin.isAdmin).toBe(true);
    });
  });
});
