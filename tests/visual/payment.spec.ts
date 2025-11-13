import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Payment Pages
 * Tests payment form and confirmation UI
 */

test.describe('Payment Page Visual Tests', () => {
  test('payment page initial state', async ({ page }) => {
    // Note: In production, you'll need to navigate with a valid loan ID
    await page.goto('/payment/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('payment-page.png');
  });

  test('payment method selection - card', async ({ page }) => {
    await page.goto('/payment/1');
    await page.waitForLoadState('networkidle');
    
    // Select card payment if available
    const cardOption = page.getByText(/credit.*card|debit.*card/i).first();
    if (await cardOption.isVisible()) {
      await cardOption.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('payment-method-card.png');
    }
  });

  test('payment method selection - crypto', async ({ page }) => {
    await page.goto('/payment/1');
    await page.waitForLoadState('networkidle');
    
    // Select crypto payment if available
    const cryptoOption = page.getByText(/crypto|bitcoin|ethereum/i).first();
    if (await cryptoOption.isVisible()) {
      await cryptoOption.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('payment-method-crypto.png');
    }
  });

  test('payment form with validation', async ({ page }) => {
    await page.goto('/payment/1');
    await page.waitForLoadState('networkidle');
    
    // Try to submit to trigger validation
    const payButton = page.getByRole('button', { name: /pay|submit/i }).first();
    if (await payButton.isVisible()) {
      await payButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('payment-validation-errors.png');
    }
  });

  test('payment page mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/payment/1');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('payment-page-mobile.png', {
      fullPage: true,
    });
  });
});

test.describe('Enhanced Payment Page Visual Tests', () => {
  test('enhanced payment page layout', async ({ page }) => {
    await page.goto('/enhanced-payment/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('enhanced-payment-page.png');
  });

  test('payment summary section', async ({ page }) => {
    await page.goto('/enhanced-payment/1');
    await page.waitForLoadState('networkidle');
    
    const summary = page.locator('[class*="summary"]').first();
    if (await summary.isVisible()) {
      await expect(summary).toHaveScreenshot('payment-summary.png');
    }
  });
});
