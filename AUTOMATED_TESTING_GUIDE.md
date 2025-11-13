# 🧪 Automated Testing Guide

Complete testing suite for AmeriLend application including unit tests, E2E tests, visual regression tests, and CI/CD automation.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Helpers](#test-helpers)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

---

## 🎯 Overview

### Test Types

| Test Type | Purpose | Framework | Location |
|-----------|---------|-----------|----------|
| **Unit Tests** | Test individual functions and modules | Vitest | `server/__tests__/` |
| **E2E Tests** | Test complete user workflows | Playwright | `tests/e2e/` |
| **Visual Tests** | Detect UI/visual regressions | Playwright | `tests/visual/` |
| **Integration Tests** | Test API endpoints and database | Vitest | `server/__tests__/` |

### Coverage Areas

✅ **Authentication** - Registration, login, sessions  
✅ **Loan Processing** - Application, approval, rejection, disbursement  
✅ **Payments** - Creation, processing, status updates  
✅ **Admin Features** - Dashboard, user management, settings  
✅ **Email** - SendGrid integration, test emails  
✅ **Database** - CRUD operations, data integrity  

---

## 📁 Test Structure

```
amerilend/
├── server/
│   └── __tests__/           # Backend unit tests
│       ├── auth.test.ts     # Authentication tests
│       ├── loans.test.ts    # Loan processing tests
│       └── payments.test.ts # Payment tests
│
├── tests/
│   ├── e2e/                 # End-to-end tests
│   │   ├── loan-application-flow.spec.ts
│   │   └── admin-dashboard.spec.ts
│   │
│   ├── visual/              # Visual regression tests
│   │   ├── homepage.spec.ts
│   │   ├── dashboards.spec.ts
│   │   └── components.spec.ts
│   │
│   └── helpers/             # Test utilities
│       └── test-db.ts       # Database helpers
│
├── vitest.config.ts         # Unit test config
├── playwright.config.ts     # E2E/visual test config
└── .github/
    └── workflows/
        └── test.yml         # CI/CD automation
```

---

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers (for E2E/visual tests)
pnpm exec playwright install
```

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run in watch mode (development)
pnpm test --watch

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test auth.test.ts
```

### E2E Tests

```bash
# Make sure server is running first
pnpm dev

# In another terminal, run E2E tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e --ui

# Run specific test file
pnpm test:e2e loan-application-flow
```

### Visual Regression Tests

```bash
# Run visual tests
pnpm test:visual

# Update snapshots (after intentional UI changes)
pnpm test:visual:update

# View test report
pnpm test:visual:report

# Run in UI mode
pnpm test:visual:ui
```

### Run All Tests

```bash
# Run everything (unit + E2E + visual)
pnpm test && pnpm test:e2e && pnpm test:visual
```

---

## ✍️ Writing Tests

### Unit Tests (Vitest)

**Example: Testing authentication**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, cleanupTestUser } from "../../tests/helpers/test-db";

describe("Authentication", () => {
  const testEmail = "test@example.com";
  
  afterAll(async () => {
    await cleanupTestUser(testEmail);
  });

  it("should create a new user", async () => {
    const user = await createTestUser({
      email: testEmail,
      password: "Test123!",
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
  });
});
```

**Key Features:**
- Use `describe` for test suites
- Use `it` or `test` for individual tests
- Use `beforeAll`/`afterAll` for setup/cleanup
- Import test helpers from `tests/helpers/`

### E2E Tests (Playwright)

**Example: Testing user flow**

```typescript
import { test, expect } from '@playwright/test';

test('User can apply for loan', async ({ page }) => {
  // Navigate
  await page.goto('/apply');
  
  // Fill form
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Assert
  await expect(page.locator('text=Application Submitted')).toBeVisible();
});
```

**Key Features:**
- Use Playwright `test` and `expect`
- Use `page` object for browser interactions
- Chain assertions with `toBeVisible()`, `toHaveText()`, etc.
- Set timeouts for async operations

### Visual Tests (Playwright)

**Example: Screenshot comparison**

```typescript
import { test, expect } from '@playwright/test';

test('Homepage matches snapshot', async ({ page }) => {
  await page.goto('/');
  
  // Take screenshot and compare
  await expect(page).toHaveScreenshot('homepage.png');
});
```

---

## 🛠️ Test Helpers

### Database Utilities (`tests/helpers/test-db.ts`)

**Create Test Data:**

```typescript
import { 
  createTestUser, 
  createTestLoan, 
  createTestPayment 
} from '../tests/helpers/test-db';

// Create user
const user = await createTestUser({
  email: "test@test.com",
  password: "Test123!",
  isAdmin: false,
});

// Create loan
const loan = await createTestLoan({
  userId: user.id,
  requestedAmount: 10000,
  purpose: "debt_consolidation",
});

// Create payment
const payment = await createTestPayment({
  loanId: loan.id,
  userId: user.id,
  amount: 500,
  status: "completed",
});
```

**Cleanup Test Data:**

```typescript
import { cleanupTestUser, cleanupTestData } from '../tests/helpers/test-db';

// Clean specific user and related data
await cleanupTestUser("test@test.com");

// Clean all test data
await cleanupTestData();
```

**Query Test Data:**

```typescript
import { getTestUser, getTestLoan } from '../tests/helpers/test-db';

const user = await getTestUser("test@test.com");
const loan = await getTestLoan(userId);
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Automated tests run on:
- ✅ Push to `main` or `develop` branches
- ✅ Pull requests to `main` or `develop`

**Workflow Jobs:**

1. **Unit Tests** - Run Vitest unit tests
2. **E2E Tests** - Run Playwright E2E tests
3. **Visual Tests** - Run visual regression tests
4. **Security Scan** - Run npm audit and Snyk
5. **Lint Check** - Run TypeScript and format checks

### Required GitHub Secrets

Configure these in your repository settings:

```
TEST_DATABASE_URL - Test database connection
SNYK_TOKEN - Snyk security scanning (optional)
SLACK_WEBHOOK - Slack notifications (optional)
```

### Manual Trigger

```bash
# Trigger workflow manually via GitHub Actions tab
# Or push to main/develop branch
git push origin main
```

---

## ✅ Best Practices

### 1. Test Isolation

```typescript
// ✅ Good - Clean up after each test
afterEach(async () => {
  await cleanupTestUser(testEmail);
});

// ❌ Bad - Tests depend on each other
test('create user', () => { /* ... */ });
test('use created user', () => { /* ... */ }); // Will fail if run alone
```

### 2. Use Descriptive Names

```typescript
// ✅ Good
it("should reject loan application with insufficient income", async () => {});

// ❌ Bad
it("test1", async () => {});
```

### 3. Assert Meaningfully

```typescript
// ✅ Good
expect(user.email).toBe("test@test.com");
expect(loan.status).toBe("approved");

// ❌ Bad
expect(user).toBeTruthy();
```

### 4. Mock External Services

```typescript
// For email testing
import { vi } from 'vitest';

vi.mock('../_core/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));
```

### 5. Handle Async Properly

```typescript
// ✅ Good
await page.click('button');
await expect(page.locator('text=Success')).toBeVisible();

// ❌ Bad
page.click('button'); // Missing await
expect(page.locator('text=Success')).toBeVisible(); // Missing await
```

### 6. Use Test Data Factories

```typescript
// ✅ Good - Reusable factory
const createTestLoanData = (overrides = {}) => ({
  requestedAmount: 10000,
  purpose: "debt_consolidation",
  ...overrides,
});

const loan1 = await createTestLoan(createTestLoanData());
const loan2 = await createTestLoan(createTestLoanData({ requestedAmount: 5000 }));
```

### 7. Test Edge Cases

```typescript
it("should handle zero amount", async () => {});
it("should handle negative amount", async () => {});
it("should handle very large amounts", async () => {});
it("should handle missing required fields", async () => {});
```

---

## 📊 Test Coverage Goals

| Area | Target | Current |
|------|--------|---------|
| Backend | 80% | TBD |
| Frontend | 70% | TBD |
| E2E Flows | 100% critical paths | TBD |
| Visual | Key pages/components | ✅ |

---

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run with verbose output
pnpm test --reporter=verbose

# Debug specific test
pnpm test --reporter=verbose auth.test.ts
```

### E2E Tests

```bash
# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run with debugger
pnpm test:e2e --debug

# Slow down execution
pnpm test:e2e --slow-mo=1000
```

### Visual Tests

```bash
# View visual differences
pnpm test:visual:report

# Update snapshots after fixing issues
pnpm test:visual:update
```

---

## 📝 Adding New Tests

### 1. Create Test File

```bash
# Unit test
touch server/__tests__/new-feature.test.ts

# E2E test
touch tests/e2e/new-flow.spec.ts

# Visual test
touch tests/visual/new-page.spec.ts
```

### 2. Follow Naming Convention

- Unit tests: `*.test.ts`
- E2E/Visual tests: `*.spec.ts`

### 3. Import Required Helpers

```typescript
// Unit tests
import { describe, it, expect } from "vitest";
import { createTestUser } from "../../tests/helpers/test-db";

// E2E tests
import { test, expect } from '@playwright/test';
```

### 4. Run New Tests

```bash
pnpm test new-feature.test.ts
```

---

## 🎓 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## 🤝 Contributing

When adding new features:

1. ✅ Write unit tests for backend logic
2. ✅ Write E2E tests for user flows
3. ✅ Update visual snapshots if UI changes
4. ✅ Run all tests before committing
5. ✅ Ensure CI/CD passes

---

## 📞 Support

For questions or issues with tests:

- Check test output for error messages
- Review test helpers in `tests/helpers/`
- Consult this documentation
- Ask team members for help

---

**Happy Testing! 🚀**
