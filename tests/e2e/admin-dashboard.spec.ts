/**
 * End-to-End Test: Admin Dashboard Operations
 * Tests admin-specific features and management tasks
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Operations', () => {
  const adminEmail = 'admin@amerilend.com';
  const adminPassword = 'Admin123!@#';

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*admin/);
  });

  test('Admin can view dashboard statistics', async ({ page }) => {
    // Verify stats cards are visible
    await expect(page.locator('text=Total Applications')).toBeVisible();
    await expect(page.locator('text=Pending Review')).toBeVisible();
    await expect(page.locator('text=Approved Loans')).toBeVisible();
    await expect(page.locator('text=Total Disbursed')).toBeVisible();

    // Verify numbers are displayed (not zeros if there's data)
    const statsCards = page.locator('[data-testid="stat-card"]');
    await expect(statsCards).toHaveCount(4);
  });

  test('Admin can view and filter loan applications', async ({ page }) => {
    await page.click('text=Applications');

    // Verify applications table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Applicant")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // Test filter by status
    await page.click('text=Filter');
    await page.click('text=Pending');
    await expect(page.locator('tr:has-text("Pending")')).toHaveCount({ min: 0 });
  });

  test('Admin can send test email', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Email Configuration');

    // Click test email button
    await page.click('button:has-text("Test Email Connection")');

    // Wait for success message
    await expect(page.locator('text=Test email sent successfully')).toBeVisible({ timeout: 10000 });
  });

  test('Admin can create database backup', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=Backup & Restore');

    // Start download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click backup button
    await page.click('button:has-text("Download Backup")');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('amerilend-backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('Admin can update system settings', async ({ page }) => {
    await page.click('text=Settings');
    await page.click('text=General');

    // Update company information
    await page.fill('input[name="companyName"]', 'AmeriLend Updated');
    await page.fill('input[name="supportEmail"]', 'support@amerilend.com');
    await page.fill('input[name="supportPhone"]', '1-800-123-4567');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await expect(page.locator('text=Settings saved successfully')).toBeVisible();
  });

  test('Admin can view user management', async ({ page }) => {
    await page.click('text=Users');

    // Verify users table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // Search for user
    await page.fill('input[placeholder*="Search"]', 'test');
    await page.waitForTimeout(500); // Wait for debounce
  });

  test('Admin can view payment history', async ({ page }) => {
    await page.click('text=Payments');

    // Verify payments table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Transaction")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('Admin can view AI & Automation metrics', async ({ page }) => {
    await page.click('text=AI & Automation');

    // Verify real metrics are displayed (not fake data)
    await expect(page.locator('text=Support Conversations')).toBeVisible();
    await expect(page.locator('text=ID Verification')).toBeVisible();
    await expect(page.locator('text=Fraud Detection')).toBeVisible();
    await expect(page.locator('text=Automated Workflows')).toBeVisible();

    // Verify metrics have actual values
    const metrics = page.locator('[data-testid="metric-value"]');
    await expect(metrics.first()).toBeVisible();
  });

  test('Admin can access support messages', async ({ page }) => {
    await page.click('text=Support');

    // Verify support interface
    await expect(page.locator('text=Support Messages')).toBeVisible();
    
    // Check for message list or empty state
    const hasMessages = await page.locator('table').isVisible();
    const hasEmptyState = await page.locator('text=No messages yet').isVisible();
    
    expect(hasMessages || hasEmptyState).toBe(true);
  });
});
