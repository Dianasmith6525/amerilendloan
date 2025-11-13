import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Loan Application Form
 * Tests the multi-step application form UI
 */

test.describe('Loan Application Visual Tests', () => {
  test('loan application page initial state', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('apply-loan-initial.png');
  });

  test('loan application step 1 - personal info', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    
    // Capture step 1
    const form = page.locator('form').first();
    await expect(form).toHaveScreenshot('apply-loan-step1.png');
  });

  test('loan application with validation errors', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form to trigger validation
    const submitButton = page.getByRole('button', { name: /next|submit/i });
    await submitButton.click();
    
    // Wait for validation messages
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('apply-loan-validation-errors.png');
  });

  test('loan amount calculator section', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    
    // Focus on calculator if exists
    const calculator = page.locator('[class*="calculator"]').first();
    if (await calculator.isVisible()) {
      await expect(calculator).toHaveScreenshot('loan-calculator.png');
    }
  });

  test('loan application mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('apply-loan-mobile.png', {
      fullPage: true,
    });
  });
});
