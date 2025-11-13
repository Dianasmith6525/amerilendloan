/**
 * End-to-End Test: Complete Loan Application Flow
 * Tests the entire user journey from registration to loan disbursement
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Loan Application Flow', () => {
  const testEmail = `e2e-test-${Date.now()}@test.com`;
  const testPassword = 'Test123!@#';

  test('User can complete entire loan application process', async ({ page }) => {
    // Step 1: Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/AmeriLend/);

    // Step 2: Click Apply Now
    await page.click('text=Apply Now');
    await expect(page).toHaveURL(/.*apply/);

    // Step 3: Fill out personal information
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phoneNumber"]', '1234567890');
    await page.fill('input[name="dateOfBirth"]', '1990-01-01');
    
    // Step 4: Fill out address
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="city"]', 'Test City');
    await page.fill('input[name="state"]', 'CA');
    await page.fill('input[name="zipCode"]', '12345');

    // Step 5: Fill out employment information
    await page.selectOption('select[name="employmentStatus"]', 'employed');
    await page.fill('input[name="monthlyIncome"]', '5000');
    await page.fill('input[name="employerName"]', 'Test Company');

    // Step 6: Fill out loan details
    await page.fill('input[name="requestedAmount"]', '10000');
    await page.selectOption('select[name="purpose"]', 'debt_consolidation');
    await page.fill('input[name="loanTerm"]', '36');

    // Step 7: Set password
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Step 8: Submit application
    await page.click('button[type="submit"]');

    // Step 9: Wait for success message
    await expect(page.locator('text=Application Submitted')).toBeVisible({ timeout: 10000 });
    
    // Step 10: Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // Step 11: Verify loan appears in dashboard
    await expect(page.locator('text=$10,000')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('Admin can review and approve loan', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@amerilend.com');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');

    // Navigate to admin dashboard
    await expect(page).toHaveURL(/.*admin/);

    // Go to loan applications
    await page.click('text=Loan Applications');
    
    // Find pending applications
    await expect(page.locator('text=Pending')).toBeVisible();

    // Click on first pending loan
    await page.locator('tr').filter({ hasText: 'Pending' }).first().click();

    // Approve the loan
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[name="approvalNotes"]', 'Test approval via E2E');
    await page.click('button:has-text("Confirm Approval")');

    // Verify approval success
    await expect(page.locator('text=Loan Approved')).toBeVisible();
  });

  test('User can make a payment on approved loan', async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Navigate to payments
    await page.click('text=Make Payment');
    await expect(page).toHaveURL(/.*payment/);

    // Select loan
    await page.selectOption('select[name="loanId"]', { index: 0 });

    // Enter payment amount
    await page.fill('input[name="amount"]', '500');

    // Select payment method
    await page.click('text=Credit Card');

    // Fill credit card details
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="cardName"]', 'E2E Test');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');

    // Submit payment
    await page.click('button:has-text("Pay Now")');

    // Verify payment success
    await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 15000 });
  });
});
