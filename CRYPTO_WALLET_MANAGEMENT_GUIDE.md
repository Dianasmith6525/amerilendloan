# Crypto Wallet Management Guide

## Overview

The AmeriLend platform now includes a comprehensive system for managing cryptocurrency wallet addresses through the Admin Dashboard. This feature allows administrators to securely configure and update wallet addresses for receiving cryptocurrency payments (BTC, ETH, USDT, USDC) without modifying environment variables or redeploying the application.

## Features

### 1. Database-Backed Configuration
- Wallet addresses are stored in the `systemSettings` table
- Fallback to environment variables if database values don't exist
- Real-time updates without server restart
- Audit trail of who made changes and when

### 2. Admin Interface
- User-friendly settings page in the Admin Dashboard
- Edit mode with save/cancel functionality
- Visual indicators for each cryptocurrency
- Security warnings and best practices

### 3. Supported Cryptocurrencies
- **Bitcoin (BTC)**: Native Bitcoin addresses
- **Ethereum (ETH)**: ERC-20 compatible addresses
- **Tether (USDT)**: ERC-20 USDT addresses
- **USD Coin (USDC)**: ERC-20 USDC addresses

## Database Schema

### systemSettings Table

```sql
CREATE TABLE `systemSettings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `settingKey` varchar(100) NOT NULL UNIQUE,
  `settingValue` text,
  `description` text,
  `category` varchar(50) NOT NULL,
  `updatedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Pre-configured Settings

The migration automatically creates four crypto wallet settings:
- `WALLET_ADDRESS_BTC`
- `WALLET_ADDRESS_ETH`
- `WALLET_ADDRESS_USDT`
- `WALLET_ADDRESS_USDC`

## How to Use

### Accessing Wallet Settings

1. **Login as Admin**
   - Navigate to `/admin`
   - Login with admin credentials

2. **Open Settings Tab**
   - Click on "⚙️ Settings" in the left sidebar
   - The "Cryptocurrency Wallet Addresses" section will be displayed

### Updating Wallet Addresses

1. **Click "Edit Wallets" Button**
   - The wallet address fields become editable
   - Each field is color-coded by cryptocurrency

2. **Enter Wallet Addresses**
   - **Bitcoin (BTC)**: Enter address starting with `bc1q...` (SegWit) or `1...` (Legacy)
   - **Ethereum (ETH)**: Enter address starting with `0x...`
   - **USDT (ERC-20)**: Enter Ethereum address for USDT tokens
   - **USDC (ERC-20)**: Enter Ethereum address for USDC tokens

3. **Save Changes**
   - Click "Save Changes" to update the database
   - Changes are applied immediately
   - A success toast notification will appear

4. **Cancel Edits**
   - Click "Cancel" to discard changes
   - Wallet addresses revert to saved values

### Validation & Security

**Important Security Notes:**
- Only enter wallet addresses you control
- Verify addresses carefully before saving
- Never share private keys
- Double-check addresses match your wallet provider
- Keep backup of addresses in secure location

**Validation:**
- System validates address formats
- Prevents empty addresses from being saved
- Tracks who made changes and when

## API Endpoints

### tRPC Endpoints (Admin Only)

#### Get Crypto Wallets
```typescript
trpc.settings.getCryptoWallets.useQuery()
```
Returns current wallet addresses from database with fallback to environment variables.

**Response:**
```typescript
{
  btc: string;
  eth: string;
  usdt: string;
  usdc: string;
}
```

#### Update Crypto Wallets
```typescript
trpc.settings.updateCryptoWallets.useMutation({
  btc?: string;
  eth?: string;
  usdt?: string;
  usdc?: string;
})
```
Updates one or more wallet addresses. Only provided fields are updated.

**Example:**
```typescript
// Update only Bitcoin address
updateMutation.mutate({ btc: "bc1qm3f2vgsth60fp7r72lukccq7urhd39qs7g99dt" });

// Update multiple addresses
updateMutation.mutate({
  btc: "bc1q...",
  eth: "0x...",
  usdt: "0x...",
  usdc: "0x..."
});
```

#### Get All System Settings
```typescript
trpc.settings.getAll.useQuery()
```
Returns all system settings (admin only).

#### Get Settings by Category
```typescript
trpc.settings.getByCategory.useQuery({ category: "crypto" })
```
Returns settings for specific category.

#### Upsert Setting
```typescript
trpc.settings.upsert.useMutation({
  key: string;
  value: string;
  description?: string;
  category: string;
})
```
Create or update any system setting.

## Database Functions

### getCryptoWallets()
Retrieves crypto wallet addresses with fallback logic.

```typescript
const wallets = await getCryptoWallets();
// Returns: { btc, eth, usdt, usdc }
```

**Logic:**
1. Checks database for wallet settings
2. Falls back to environment variables if not found
3. Returns empty string if neither exists

### upsertSystemSetting()
Creates or updates a system setting.

```typescript
await upsertSystemSetting(
  key: string,
  value: string,
  description: string | null,
  category: string,
  updatedBy: number
);
```

### getSystemSetting()
Gets a specific setting by key.

```typescript
const setting = await getSystemSetting("WALLET_ADDRESS_BTC");
```

### getSystemSettingsByCategory()
Gets all settings in a category.

```typescript
const cryptoSettings = await getSystemSettingsByCategory("crypto");
```

## Integration with Payment System

The crypto payment system (`server/_core/crypto-payment.ts`) automatically uses the database wallet addresses:

```typescript
// Old: Static environment variables
export function getPersonalWalletAddresses(): Record<CryptoCurrency, string> {
  return {
    BTC: process.env.WALLET_ADDRESS_BTC || "",
    // ...
  };
}

// New: Database-backed with fallback
export async function getPersonalWalletAddresses(): Promise<Record<CryptoCurrency, string>> {
  const wallets = await getCryptoWallets();
  
  return {
    BTC: wallets.btc || process.env.WALLET_ADDRESS_BTC || "",
    ETH: wallets.eth || process.env.WALLET_ADDRESS_ETH || "",
    USDT: wallets.usdt || process.env.WALLET_ADDRESS_USDT || "",
    USDC: wallets.usdc || process.env.WALLET_ADDRESS_USDC || "",
  };
}
```

## Migration Guide

### Running the Migration

1. **Apply Database Migration**
   ```bash
   # Connect to your database and run:
   mysql -u username -p database_name < drizzle/0007_add_system_settings.sql
   ```

2. **Verify Table Creation**
   ```sql
   SHOW TABLES LIKE 'systemSettings';
   SELECT * FROM systemSettings;
   ```

3. **Set Initial Wallet Addresses**
   - Login to Admin Dashboard
   - Navigate to Settings
   - Enter your wallet addresses
   - Save changes

### Environment Variables (Optional Fallback)

Keep these in your `.env` file as fallback:
```env
WALLET_ADDRESS_BTC=bc1qm3f2vgsth60fp7r72lukccq7urhd39qs7g99dt
WALLET_ADDRESS_ETH=0x51858B0C17cC8CC7B8Ce3Ed4BB9C5B4e112Cfe9E
WALLET_ADDRESS_USDT=0x51858B0C17cC8CC7B8Ce3Ed4BB9C5B4e112Cfe9E
WALLET_ADDRESS_USDC=0x51858B0C17cC8CC7B8Ce3Ed4BB9C5B4e112Cfe9E
```

## Troubleshooting

### Wallet Addresses Not Saving

**Check:**
1. Admin permissions (must be logged in as admin)
2. Database connection
3. Browser console for errors
4. Network tab for API call failures

**Solution:**
```typescript
// Check if mutation succeeded
updateMutation.mutate(wallets, {
  onSuccess: () => console.log("Success!"),
  onError: (err) => console.error("Error:", err)
});
```

### Addresses Not Displaying to Customers

**Check:**
1. Database values are set
2. Environment variables as fallback
3. `getCryptoWallets()` function returns values
4. Payment page uses updated function

**Debug:**
```typescript
// In payment page
const wallets = await getPersonalWalletAddresses();
console.log("Wallet addresses:", wallets);
```

### Permission Denied

**Error:** "UNAUTHORIZED" when trying to access settings

**Solution:**
1. Verify user has admin role in database
2. Check `adminProcedure` middleware
3. Confirm JWT token is valid

```sql
-- Check user role
SELECT id, email, role FROM users WHERE id = YOUR_USER_ID;

-- Update to admin if needed
UPDATE users SET role = 'admin' WHERE id = YOUR_USER_ID;
```

## Best Practices

### Security
1. **Never share private keys** - Only store public wallet addresses
2. **Verify addresses** - Double-check before saving
3. **Use hardware wallets** - For storing funds securely
4. **Enable 2FA** - On wallet provider accounts
5. **Regular backups** - Keep secure backup of addresses

### Operations
1. **Test with small amounts** - Before processing large payments
2. **Monitor wallets** - Check balances regularly
3. **Document changes** - Keep record of address updates
4. **Notify team** - When wallet addresses change
5. **Verify transactions** - Confirm payment receipts

### Compliance
1. **KYC/AML** - Follow cryptocurrency regulations
2. **Tax reporting** - Track all crypto transactions
3. **Record keeping** - Maintain audit trail
4. **Geographic restrictions** - Check local crypto laws

## Future Enhancements

Potential future features:
- Multi-wallet support (multiple addresses per currency)
- Wallet balance monitoring
- Auto-conversion to fiat
- Payment confirmation webhooks
- Advanced analytics
- Wallet rotation for privacy
- Multi-signature wallet support

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Contact system administrator
4. Submit issue on GitHub

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Database-backed wallet storage
- Admin interface for wallet management
- Support for BTC, ETH, USDT, USDC
- Fallback to environment variables
- Audit trail tracking
