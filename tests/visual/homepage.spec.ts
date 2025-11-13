import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Homepage
 * Captures screenshots of the landing page in different states
 */

test.describe('Homepage Visual Tests', () => {
  test('homepage hero section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Capture hero section
    const hero = page.locator('section').first();
    await expect(hero).toHaveScreenshot('homepage-hero.png');
  });

  test('homepage features section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to features section
    const features = page.getByText('Why Choose AmeriLend').first();
    await features.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for scroll animation
    
    await expect(page).toHaveScreenshot('homepage-features.png');
  });

  test('homepage how it works section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to how it works
    const howItWorks = page.getByText('How It Works').first();
    await howItWorks.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('homepage-how-it-works.png');
  });

  test('full homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Capture full page
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
    });
  });

  test('homepage mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });
});
