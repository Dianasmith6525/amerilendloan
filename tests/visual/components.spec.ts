import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Component Showcase
 * Tests UI components and design system
 */

test.describe('Component Showcase Visual Tests', () => {
  test('component showcase page', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('components-showcase.png', {
      fullPage: true,
    });
  });

  test('button components section', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.getByText('Buttons').first();
    if (await buttons.isVisible()) {
      await buttons.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('components-buttons.png');
    }
  });

  test('form components section', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    
    const forms = page.getByText(/form|input/i).first();
    if (await forms.isVisible()) {
      await forms.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('components-forms.png');
    }
  });

  test('card components section', async ({ page }) => {
    await page.goto('/components');
    await page.waitForLoadState('networkidle');
    
    const cards = page.getByText('Cards').first();
    if (await cards.isVisible()) {
      await cards.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('components-cards.png');
    }
  });
});
