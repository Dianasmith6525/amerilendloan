# Crypto Wallet Payment Fix - Summary

## Issue
Users couldn't see cryptocurrency payment options when paying processing fees.

## Root Cause
1. **Database Schema Mismatch**: The Drizzle schema defined columns as `settingKey`, `settingValue`, `category` but the actual database table used `key`, `value`, `type`, `isPublic`
2. This caused the `getCryptoWallets()` function to fail silently when querying the database
3. The function fell back to environment variables (which ARE configured), but the schema mismatch prevented proper database queries

## Changes Made

### 1. Fixed Database Schema (`drizzle/schema.ts`)
**Before:**
```typescript
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  category: varchar("category", { length: 50 }).notNull(),
  // ...
});
```

**After:**
```typescript
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  isPublic: int("isPublic").default(0).notNull(),
  // ...
});
```

### 2. Updated Database Functions (`server/db.ts`)

**Fixed `getSystemSetting()`:**
- Changed from `systemSettings.settingKey` to `systemSettings.key`

**Replaced `getSystemSettingsByCategory()` with `getSystemSettingsByPattern()`:**
- Old approach tried to filter by non-existent `category` column
- New approach uses LIKE pattern matching (e.g., `'WALLET_ADDRESS_%'`)

**Fixed `upsertSystemSetting()` signature:**
```typescript
// Before
upsertSystemSetting(key, value, description, category, updatedBy)

// After
upsertSystemSetting(key, value, description, type, updatedBy)
```

**Fixed `getCryptoWallets()`:**
- Changed from `setting.settingKey` to `setting.key`
- Changed from `setting.settingValue` to `setting.value`
- Uses new `getSystemSettingsByPattern('WALLET_ADDRESS_%')` function

### 3. Updated Server Router (`server/routers.ts`)

**Settings Router:**
- Removed `getByCategory` endpoint
- Added `getByPattern` endpoint
- Updated `upsert` mutation to use `type` instead of `category`

**Crypto Wallets Router:**
- Updated all `updateCryptoWallets` calls to use `'string'` type instead of `'crypto'` category

## Current Status

### ✓ Working
- Crypto wallet addresses configured in `.env` file:
  - BTC: `bc1qm3f2vgsth60fp7r7...`
  - ETH: `0x51858B0C17cC8CC7B8...`
  - USDT: `0x51858B0C17cC8CC7B8...`
  - USDC: `0x51858B0C17cC8CC7B8...`

- `getCryptoWallets()` function now properly:
  1. Queries database using correct column names
  2. Falls back to environment variables
  3. Returns wallet addresses for all supported cryptocurrencies

- `getSupportedCryptos()` API endpoint returns:
  ```json
  [
    {
      "currency": "BTC",
      "name": "Bitcoin",
      "rate": 65000,
      "symbol": "₿",
      "walletAddress": "bc1qm3f2vgsth60fp7r7..."
    },
    // ... ETH, USDT, USDC
  ]
  ```

### User Experience
Users can now:
1. Navigate to processing fee payment page
2. See "Cryptocurrency" payment option
3. Select from BTC, ETH, USDT, or USDC
4. Click "Generate {CRYPTO} Payment Address"
5. Receive wallet address and exact amount to send
6. Complete payment via their crypto wallet

## Testing
To verify the fix is working:

1. **Check wallet configuration:**
   ```bash
   node check-crypto-wallets.mjs
   ```

2. **Test payment flow:**
   - Log in as a user with an approved loan
   - Navigate to `/processing-fee/{loanId}`
   - Select "Cryptocurrency" payment method
   - Verify wallet options (BTC, ETH, USDT, USDC) are visible
   - Click "Generate Payment Address"
   - Verify wallet address and crypto amount are displayed

## Future Improvements
1. Consider adding database migration to sync schema with actual table structure
2. Add admin UI to manage wallet addresses via Settings tab
3. Implement blockchain explorer integration for automatic payment verification
4. Add QR codes for easier mobile wallet scanning

## Files Modified
- `drizzle/schema.ts` - Fixed systemSettings schema
- `server/db.ts` - Updated all database functions
- `server/routers.ts` - Updated settings and crypto wallet endpoints
- `check-crypto-wallets.mjs` - Created diagnostic script

## Environment Variables Required
```env
WALLET_ADDRESS_BTC=your_btc_address
WALLET_ADDRESS_ETH=your_eth_address  
WALLET_ADDRESS_USDT=your_usdt_address
WALLET_ADDRESS_USDC=your_usdc_address
```

These are properly configured in your current `.env` file.
