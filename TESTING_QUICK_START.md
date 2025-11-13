# 🚀 Quick Start: Automated Testing

Get started with automated testing in under 5 minutes!

---

## ✅ Prerequisites

Ensure you have:
- Node.js 18+ installed
- pnpm installed
- Dependencies installed: `pnpm install`

---

## 🧪 Run Your First Test

### 1. Unit Tests (Fastest)

```bash
# Run all unit tests
pnpm test

# Expected output:
# ✓ server/__tests__/auth.test.ts (3 tests)
# ✓ server/__tests__/loans.test.ts (5 tests)
# ✓ server/__tests__/payments.test.ts (7 tests)
```

**What gets tested:**
- ✅ User registration and authentication
- ✅ Loan application creation and approval
- ✅ Payment processing

**Time:** ~10-30 seconds

---

### 2. E2E Tests (Complete Flows)

```bash
# Make sure server is running first
pnpm dev

# In another terminal, run E2E tests
pnpm test:e2e
```

**What gets tested:**
- ✅ Complete loan application flow
- ✅ Admin dashboard operations
- ✅ User authentication and payments

**Time:** ~1-3 minutes

---

### 3. Visual Tests (UI Snapshots)

```bash
# Server must be running
pnpm dev

# Run visual regression tests
pnpm test:visual
```

**What gets tested:**
- ✅ Homepage appearance
- ✅ Dashboard layouts
- ✅ Component rendering

**Time:** ~30-60 seconds

---

## 📊 Test Summary

| Test Type | Command | When to Run |
|-----------|---------|-------------|
| **Unit** | `pnpm test` | Every commit |
| **E2E** | `pnpm test:e2e` | Before PR/merge |
| **Visual** | `pnpm test:visual` | After UI changes |
| **All** | Run all three | Before release |

---

## 🔍 Verify Installation

Run this quick test to ensure everything works:

```bash
# 1. Run unit tests
pnpm test auth.test.ts

# Expected: ✓ All tests pass
```

If you see green checkmarks ✓, you're ready to go!

---

## 📝 What's Included

Your testing suite includes:

### ✅ Unit Tests
- `server/__tests__/auth.test.ts` - Authentication
- `server/__tests__/loans.test.ts` - Loan processing
- `server/__tests__/payments.test.ts` - Payments

### ✅ E2E Tests
- `tests/e2e/loan-application-flow.spec.ts` - User flows
- `tests/e2e/admin-dashboard.spec.ts` - Admin features

### ✅ Visual Tests
- `tests/visual/homepage.spec.ts` - Homepage
- `tests/visual/dashboards.spec.ts` - Dashboards
- `tests/visual/components.spec.ts` - Components

### ✅ Test Helpers
- `tests/helpers/test-db.ts` - Database utilities

---

## 🎯 Common Scenarios

### Scenario 1: Testing New Feature

```bash
# 1. Write your feature code
# 2. Write unit test
touch server/__tests__/my-feature.test.ts

# 3. Run test
pnpm test my-feature.test.ts

# 4. If passes, commit!
```

### Scenario 2: UI Changes

```bash
# 1. Make UI changes
# 2. Update visual snapshots
pnpm test:visual:update

# 3. Review changes
pnpm test:visual:report

# 4. Commit updated snapshots
```

### Scenario 3: Before Deployment

```bash
# 1. Run all tests
pnpm test                    # Unit tests
pnpm test:e2e               # E2E tests (server must be running)
pnpm test:visual            # Visual tests (server must be running)

# 2. Check results
# All green? ✅ Ready to deploy!
```

---

## 🐛 Troubleshooting

### Tests Fail Immediately

```bash
# Clean node modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### E2E Tests Can't Connect

```bash
# Ensure server is running
pnpm dev

# Check if port 3000 is available
netstat -ano | Select-String ":3000"
```

### Visual Tests Show Differences

```bash
# Review differences
pnpm test:visual:report

# If changes are intentional, update snapshots
pnpm test:visual:update
```

### Database Connection Issues

```bash
# Check .env file has DATABASE_URL
# Verify database is accessible
node test-connection.mjs
```

---

## 📚 Next Steps

1. ✅ Read full guide: `AUTOMATED_TESTING_GUIDE.md`
2. ✅ Set up CI/CD: `.github/workflows/test.yml`
3. ✅ Write custom tests for your features
4. ✅ Configure test database (separate from production)

---

## 🎉 You're Ready!

Your automated testing suite is configured and ready to use. Happy testing! 🚀

**Key Commands to Remember:**
```bash
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm test:visual    # Visual tests
```

For detailed documentation, see `AUTOMATED_TESTING_GUIDE.md`.
