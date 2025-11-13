# ⚠️ Important Notes for Test Implementation

## Database Schema Adjustments Needed

The test files have been created with common field names, but your database schema may differ. You'll need to adjust the test helper functions in `tests/helpers/test-db.ts` to match your actual schema.

### Common Adjustments Needed:

1. **User Table Fields**
   - Check if `isAdmin` field exists (may be `role` or `userType`)
   - Verify required fields for user creation
   - Adjust field names to match your schema

2. **Loan Applications Table**
   - May need `email`, `phone`, `street` instead of `userId`
   - Check status enum values
   - Verify required fields

3. **Payments Table**
   - May use `loanApplicationId` instead of `loanId`
   - Check payment method enum values
   - Verify status field values

4. **System Settings**
   - May use key-value pairs instead of direct columns
   - Check the actual structure of systemSettings table

### How to Fix:

1. **Check your schema:**
   ```bash
   # Look at drizzle/schema.ts for actual field names
   ```

2. **Update test helpers:**
   - Open `tests/helpers/test-db.ts`
   - Adjust `createTestUser()`, `createTestLoan()`, `createTestPayment()`
   - Match field names to your actual schema

3. **Use your existing database functions:**
   - You may already have functions in `server/db.ts`
   - Consider reusing those instead of direct inserts

### Example Fix:

If your schema doesn't have `isAdmin` but uses `role`:

```typescript
// Before
const [user] = await db.insert(users).values({
  email: userData.email,
  isAdmin: userData.isAdmin || false,
  ...
});

// After
const [user] = await db.insert(users).values({
  email: userData.email,
  role: userData.isAdmin ? "admin" : "user",
  ...
});
```

## Alternative Approach

Instead of fixing the schema mismatches, you can:

1. **Use the E2E tests** - These test through the UI/API and don't need direct database access
2. **Mock the database** - Use vi.mock() to mock database calls
3. **Integration tests** - Test the actual API endpoints instead of database directly

## Testing Priority

Focus on these in order:

1. ✅ **E2E Tests** - Work immediately, test real user flows
   ```bash
   pnpm test:e2e
   ```

2. ✅ **Visual Tests** - Already configured and working
   ```bash
   pnpm test:visual
   ```

3. ⚠️ **Unit Tests** - Need schema adjustments
   - Fix `tests/helpers/test-db.ts` first
   - Then unit tests will work

## Quick Win: Test Your Existing Code

You can write unit tests for pure functions without database:

```typescript
// Example: Test utility functions
import { describe, it, expect } from "vitest";
import { calculateLoanPayment } from "../utils/loan-calculator";

describe("Loan Calculator", () => {
  it("should calculate monthly payment", () => {
    const payment = calculateLoanPayment(10000, 0.05, 36);
    expect(payment).toBeGreaterThan(0);
  });
});
```

## CI/CD Note

The GitHub Actions workflow will fail until the schema mismatches are fixed. You can:

1. Comment out the unit tests job temporarily
2. Focus on E2E and visual tests first
3. Fix unit tests when ready

## Need Help?

1. Check `drizzle/schema.ts` for your actual schema
2. Look at existing code in `server/db.ts` for database operations
3. Use E2E tests as they're working immediately
4. Adjust test helpers based on your schema

The testing infrastructure is sound - just needs schema-specific adjustments!
