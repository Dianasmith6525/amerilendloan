# Visual Regression Testing with Playwright

This project uses Playwright for automated visual regression testing to catch UI bugs and design inconsistencies.

## Setup

Visual testing is already configured. The dependencies are installed:
- `@playwright/test` - Playwright testing framework with built-in visual comparison

## Running Tests

### First Time Setup
Install Playwright browsers:
```bash
npx playwright install
```

### Run All Visual Tests
```bash
npm run test:visual
```

### Run Visual Tests in UI Mode (Recommended)
```bash
npm run test:visual:ui
```

### Update Visual Baselines
When you intentionally change the UI, update the baseline screenshots:
```bash
npm run test:visual:update
```

### Run Specific Test File
```bash
npx playwright test tests/visual/homepage.spec.ts
```

### Run Tests for Specific Browser
```bash
npx playwright test --project=chromium
```

## Test Coverage

Current visual regression tests cover:

### 1. **Homepage** (`tests/visual/homepage.spec.ts`)
- Hero section
- Features section
- How It Works section
- Full page desktop view
- Mobile responsive view

### 2. **Loan Application** (`tests/visual/apply-loan.spec.ts`)
- Initial form state
- Form validation errors
- Loan calculator section
- Mobile view

### 3. **Dashboards** (`tests/visual/dashboards.spec.ts`)
- User Dashboard
  - Main layout
  - Loan cards section
  - Mobile view
- Admin Dashboard
  - Overview/Statistics tab
  - Applications tab
  - ID Verification tab
  - Fee Configuration tab
  - Tablet view

### 4. **Payment Pages** (`tests/visual/payment.spec.ts`)
- Payment page initial state
- Card payment method
- Crypto payment method
- Form validation
- Mobile view
- Enhanced payment page

### 5. **Component Showcase** (`tests/visual/components.spec.ts`)
- Full component library
- Button components
- Form components
- Card components

## How Visual Testing Works

1. **First Run**: Playwright captures screenshots of your UI (baseline images)
2. **Subsequent Runs**: New screenshots are compared against baselines
3. **Differences Detected**: If visual changes exceed threshold (20%), tests fail
4. **Review Changes**: Use Playwright UI mode to review and approve/reject changes

## Visual Diff Thresholds

Configured in `playwright.config.ts`:
- **maxDiffPixels**: 100 pixels (allows for minor rendering differences)
- **threshold**: 0.2 (20% - allows for small antialiasing differences)

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries (2 attempts)
- Single worker (consistent rendering)
- HTML report generation

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Best Practices

1. **Run Before Commits**: Check for unintended visual changes
2. **Update Baselines**: When making intentional UI changes
3. **Use UI Mode**: For interactive debugging and screenshot review
4. **Test Multiple Browsers**: Visual differences can occur across browsers
5. **Test Responsive Views**: Always test mobile/tablet layouts

## Troubleshooting

### Tests Failing After Fresh Install
Run update command to generate initial baselines:
```bash
npm run test:visual:update
```

### Screenshots Look Different Locally vs CI
Different operating systems render fonts/UI slightly differently. Consider:
- Using Docker for consistent rendering
- Increasing the threshold tolerance
- Running tests in the same environment

### Flaky Tests
If tests are inconsistent:
- Increase `waitForTimeout` values
- Use `waitForLoadState('networkidle')`
- Wait for specific elements to be visible

## Screenshot Storage

Baseline screenshots are stored in:
```
tests/visual/[test-name].spec.ts-snapshots/
```

These should be committed to version control to track visual changes.

## Adding New Tests

1. Create a new spec file in `tests/visual/`
2. Use `toHaveScreenshot()` for visual comparisons
3. Run with `--update-snapshots` to create baselines
4. Commit the baseline screenshots

Example:
```typescript
import { test, expect } from '@playwright/test';

test('my new page', async ({ page }) => {
  await page.goto('/my-page');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('my-page.png');
});
```

## Integration with TestSprite.com

While this setup uses Playwright directly, the same screenshots can be:
- Uploaded to TestSprite for team collaboration
- Integrated with GitHub/GitLab for PR reviews
- Used with other visual testing platforms

The Playwright HTML reports provide excellent local visual diff viewing.
