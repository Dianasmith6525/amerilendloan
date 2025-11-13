# QR Code Payment Implementation Guide

## Overview
Crypto payment QR codes have been implemented to allow users to easily scan and pay processing fees using their mobile crypto wallets. QR codes are generated server-side as base64 PNG data URLs and embedded directly in the payment pages.

## Implementation Details

### 1. Server-Side QR Code Generation

**File:** `server/_core/crypto-payment.ts`

#### QR Code Library
- **Package:** `qrcode` (installed via npm)
- **Format:** Base64 PNG data URL
- **Size:** ~3.5 KB per QR code
- **Error Correction:** Medium level ('M')
- **Dimensions:** 300x300 pixels

#### Payment URI Formats
QR codes encode payment URIs following cryptocurrency standards:

- **Bitcoin (BTC):** `bitcoin:address?amount=value`
  - Example: `bitcoin:bc1qm3f2vg...?amount=0.00153846`
  - Standard: BIP21
  
- **Ethereum (ETH):** `ethereum:address?value=amount`
  - Example: `ethereum:0x51858B0C...?value=0.03125`
  
- **USDT (ERC-20):** `ethereum:address?value=amount`
  - Uses Ethereum address format
  - Example: `ethereum:0x51858B0C...?value=100.00`
  
- **USDC (ERC-20):** `ethereum:address?value=amount`
  - Uses Ethereum address format
  - Example: `ethereum:0x51858B0C...?value=100.00`

#### Function: `generatePaymentQRCode()`
```typescript
async function generatePaymentQRCode(
  currency: CryptoCurrency,
  address: string,
  amount: string
): Promise<string>
```

**Purpose:** Generate QR code from payment URI

**Returns:** Base64 data URL (e.g., `data:image/png;base64,iVBORw0KGgo...`)

**Features:**
- Automatic payment URI formatting based on cryptocurrency
- Error handling with fallback to address-only QR code
- High-quality PNG output with proper margins

### 2. API Endpoints

#### `payments.createIntent`
**File:** `server/routers.ts` (Line ~1623)

**Input:**
```typescript
{
  loanApplicationId: number,
  paymentMethod: "crypto",
  cryptoCurrency: "BTC" | "ETH" | "USDT" | "USDC"
}
```

**Output:**
```typescript
{
  success: true,
  amount: number,
  cryptoAddress: string,
  cryptoAmount: string,
  cryptoCurrency: string,
  qrCodeDataUrl: string,  // ← NEW: Base64 QR code
  paymentIntentId: string
}
```

#### `payments.processCryptoPayment`
**File:** `server/routers.ts` (Line ~1868)

**Input:**
```typescript
{
  loanApplicationId: number,
  cryptoCurrency: "BTC" | "ETH" | "USDT" | "USDC"
}
```

**Output:**
```typescript
{
  success: true,
  chargeId: string,
  paymentAddress: string,
  cryptoAmount: string,
  cryptoCurrency: string,
  qrCodeDataUrl: string  // ← NEW: Base64 QR code
}
```

### 3. Client-Side Display

#### PaymentPage Component
**File:** `client/src/pages/PaymentPage.tsx`

**Updated State:**
```typescript
const [cryptoPaymentData, setCryptoPaymentData] = useState<{
  address: string;
  amount: string;
  currency: string;
  qrCodeDataUrl: string;  // ← Changed from qrCodeUrl
} | null>(null);
```

**QR Code Display:**
```tsx
<div className="flex justify-center pt-4 border-t">
  <div className="text-center">
    <Label className="text-xs text-muted-foreground block mb-2">
      Scan QR Code
    </Label>
    <img 
      src={cryptoPaymentData.qrCodeDataUrl} 
      alt="Payment QR Code" 
      className="w-48 h-48 border rounded"
    />
    <p className="text-xs text-muted-foreground mt-2">
      Scan with your crypto wallet app
    </p>
  </div>
</div>
```

#### ProcessingFeePayment Component
**File:** `client/src/pages/ProcessingFeePayment.tsx`

**QR Code Display:**
```tsx
{cryptoPaymentDetails.qrCodeDataUrl && (
  <div className="flex justify-center py-4 border-t border-blue-200">
    <div className="text-center">
      <p className="text-sm font-medium mb-2">Scan with Wallet App</p>
      <img 
        src={cryptoPaymentDetails.qrCodeDataUrl} 
        alt="Payment QR Code" 
        className="w-48 h-48 mx-auto border-2 border-blue-300 rounded"
      />
      <p className="text-xs text-gray-600 mt-2">
        Scan this QR code with your {cryptoPaymentDetails.cryptoCurrency} wallet
      </p>
    </div>
  </div>
)}
```

## User Flow

### 1. Payment Initiation
1. User navigates to payment page (`/payment/:id` or `/processing-fee/:id`)
2. Selects "Cryptocurrency" payment method
3. Chooses cryptocurrency (BTC, ETH, USDT, or USDC)
4. Clicks "Generate Payment Address"

### 2. QR Code Generation
1. Client sends request to server with loan ID and crypto currency
2. Server fetches wallet address from database/environment
3. Server converts USD amount to crypto amount using real-time rates
4. Server generates payment URI (e.g., `bitcoin:address?amount=value`)
5. Server creates QR code as base64 PNG from payment URI
6. Server returns payment details including QR code

### 3. Payment Execution
1. User sees:
   - Payment address (with copy button)
   - Crypto amount (with copy button)
   - **QR code** (scannable with wallet app)
   - Instructions
2. User has two options:
   - **Option A:** Scan QR code with mobile wallet app
     - App auto-fills address and amount
     - User confirms and sends
   - **Option B:** Manual entry
     - Copy address and amount
     - Paste into wallet app
     - Send payment

### 4. Confirmation
1. User sends crypto from their wallet
2. Transaction broadcasts to blockchain
3. Admin verifies payment in admin dashboard
4. Admin clicks "Confirm Payment"
5. Loan status updates to "fee_paid"
6. User receives confirmation email

## Benefits

### For Users
✓ **Faster Payments:** Scan QR code instead of copying/pasting  
✓ **Fewer Errors:** No typos in address or amount  
✓ **Mobile-Friendly:** Works seamlessly with mobile wallet apps  
✓ **Universal Support:** Works with all major crypto wallets  

### For Business
✓ **Reduced Support:** Fewer payment errors to troubleshoot  
✓ **Professional Experience:** Modern, user-friendly interface  
✓ **Increased Conversions:** Easier payment = more completed transactions  

## Wallet Compatibility

QR codes work with popular crypto wallets including:

### Bitcoin Wallets
- Coinbase Wallet
- Trust Wallet
- Blockchain.com
- Electrum
- BRD
- Any BIP21-compatible wallet

### Ethereum/ERC-20 Wallets
- MetaMask
- Trust Wallet
- Coinbase Wallet
- Rainbow
- Argent
- Any Ethereum-compatible wallet

## Testing

### Manual Testing
1. Start dev server: `npm run dev`
2. Login as user with approved loan
3. Navigate to `/processing-fee/{loanId}`
4. Select cryptocurrency payment
5. Generate payment address
6. Verify QR code displays correctly
7. Test scanning with real wallet app (testnet/mainnet depending on environment)

### Library Testing
```bash
node test-qr-library.mjs
```

**Expected Output:**
- ✓ QR codes generated for BTC, ETH, USDT, USDC
- ✓ Base64 PNG format (~3.5 KB each)
- ✓ Valid payment URIs embedded

## Technical Specifications

### QR Code Properties
- **Format:** PNG
- **Encoding:** Base64 data URL
- **Size:** 300x300 pixels
- **File Size:** ~3.5 KB
- **Error Correction:** Medium (M)
- **Margin:** 2 modules
- **Color:** Black on white (#000000 on #FFFFFF)

### Browser Compatibility
- ✓ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)
- ✓ No external API dependencies
- ✓ Works offline once loaded

### Security Considerations
- ✓ QR codes generated server-side (trusted source)
- ✓ Payment URIs include amount (prevents user error)
- ✓ No external QR code APIs used (privacy + reliability)
- ✓ Base64 embedded directly (no CORS issues)

## Migration from Google Charts API

**Before:**
```typescript
const qrCodeUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${currency}:${address}?amount=${amount}`;
```

**Issues:**
- External API dependency
- Rate limiting concerns
- Privacy concerns (Google tracks requests)
- Requires internet connection
- CORS restrictions

**After:**
```typescript
const qrCodeDataUrl = await QRCode.toDataURL(paymentURI, {
  errorCorrectionLevel: 'M',
  width: 300,
  margin: 2
});
```

**Benefits:**
- ✓ No external dependencies
- ✓ No rate limits
- ✓ Better privacy
- ✓ Works offline
- ✓ Faster generation
- ✓ Full control over quality

## Future Enhancements

### Potential Improvements
1. **Animated QR Codes:** Add loading animation while generating
2. **Download QR Code:** Allow users to save QR code as image
3. **Print Support:** Optimize QR codes for printing
4. **Multi-Size QR Codes:** Generate different sizes for different devices
5. **Color Customization:** Brand-colored QR codes
6. **Dynamic QR Codes:** Update amount if exchange rate changes significantly
7. **QR Code Expiry:** Visual indicator for expired payment addresses

### Advanced Features
1. **NFC Support:** Tap-to-pay with NFC-enabled devices
2. **Deep Links:** Direct wallet app opening
3. **Multi-Signature:** QR codes for multi-sig wallets
4. **Lightning Network:** QR codes for Bitcoin Lightning payments

## Files Modified

### Server-Side
- ✓ `server/_core/crypto-payment.ts` - Added QR code generation
- ✓ `server/routers.ts` - Updated payment endpoints
- ✓ `package.json` - Added qrcode dependency

### Client-Side
- ✓ `client/src/pages/PaymentPage.tsx` - Updated QR display
- ✓ `client/src/pages/ProcessingFeePayment.tsx` - Updated QR display

### Testing
- ✓ `test-qr-library.mjs` - QR code library test

## Support

If QR codes fail to generate:

1. **Check Dependencies:**
   ```bash
   npm list qrcode
   ```

2. **Verify Installation:**
   ```bash
   npm install qrcode @types/qrcode --legacy-peer-deps
   ```

3. **Test Library:**
   ```bash
   node test-qr-library.mjs
   ```

4. **Check Logs:**
   - Look for "Error generating QR code" in server logs
   - Verify wallet addresses are configured

5. **Fallback:**
   - Users can still copy address and amount manually
   - QR code is enhancement, not requirement

## Conclusion

✓ QR code payment implementation complete  
✓ All crypto payments now include scannable QR codes  
✓ Tested with BTC, ETH, USDT, and USDC  
✓ Production-ready with proper error handling  
✓ Enhanced user experience with mobile wallet support  

**Status:** ✅ COMPLETE AND OPERATIONAL
