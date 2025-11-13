import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Dashboards
 * Tests user and admin dashboard layouts
 */

test.describe('User Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Note: You'll need to implement proper authentication
    // For now, we'll just navigate to the dashboard
    // In production, add login steps here
  });

  test('user dashboard layout', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for any loading states to complete
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('user-dashboard.png');
  });

  test('user dashboard with loan cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for loan cards section
    const loansSection = page.locator('[class*="loan"]').first();
    if (await loansSection.isVisible()) {
      await expect(loansSection).toHaveScreenshot('user-dashboard-loans.png');
    }
  });

  test('user dashboard mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('user-dashboard-mobile.png', {
      fullPage: true,
    });
  });
});

test.describe('Admin Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Note: Add admin login here in production
  });

  test('admin dashboard overview tab', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Wait for stats to load
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('admin-dashboard-overview.png');
  });

  test('admin dashboard applications tab', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click applications tab
    const appsTab = page.getByRole('tab', { name: /applications/i });
    if (await appsTab.isVisible()) {
      await appsTab.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('admin-dashboard-applications.png');
    }
  });

  test('admin dashboard id verification tab', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const idTab = page.getByRole('tab', { name: /verification/i });
    if (await idTab.isVisible()) {
      await idTab.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('admin-dashboard-verification.png');
    }
  });

  test('admin dashboard fee config tab', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const feeTab = page.getByRole('tab', { name: /fee|configuration/i });
    if (await feeTab.isVisible()) {
      await feeTab.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('admin-dashboard-fee-config.png');
    }
  });

  test('admin dashboard tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('admin-dashboard-tablet.png');
  });
});
