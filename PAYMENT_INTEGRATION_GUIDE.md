# AmeriLend Payment Integration Guide

## Overview

AmeriLend now supports multiple payment methods for processing fee collection, providing flexibility for users to pay via traditional card payments or cryptocurrency. This guide covers the implementation details, configuration requirements, and testing procedures for both payment gateways.

## Supported Payment Methods

### 1. Card Payments via Authorize.net

AmeriLend integrates with Authorize.net to process credit and debit card payments securely. The implementation uses Accept.js for client-side tokenization, ensuring that sensitive card data never touches your servers.

**Supported Card Types:**
- Visa
- Mastercard
- American Express
- Discover

**Key Features:**
- PCI-compliant tokenization via Accept.js
- Real-time payment processing
- Automatic fraud detection
- Secure transaction logging with card details (last 4 digits, brand)

### 2. Cryptocurrency Payments

The platform supports cryptocurrency payments through Coinbase Commerce integration (or compatible gateway). Users can pay processing fees using popular cryptocurrencies with real-time exchange rate conversion.

**Supported Cryptocurrencies:**
- Bitcoin (BTC)
- Ethereum (ETH)
- Tether (USDT)
- USD Coin (USDC)

**Key Features:**
- Real-time USD to crypto conversion
- QR code generation for easy wallet scanning
- Payment address generation with expiration
- Blockchain transaction tracking
- Multiple confirmation requirements based on currency

## Architecture

### Database Schema

The `payments` table has been enhanced to support multiple payment methods:

```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanApplicationId INT NOT NULL,
  userId INT NOT NULL,
  amount INT NOT NULL,  -- in cents
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment provider and method
  paymentProvider ENUM('stripe', 'authorizenet', 'crypto') DEFAULT 'stripe',
  paymentMethod ENUM('card', 'crypto') DEFAULT 'card',
  
  -- Card payment details
  paymentIntentId VARCHAR(255),
  paymentMethodId VARCHAR(255),
  cardLast4 VARCHAR(4),
  cardBrand VARCHAR(20),
  
  -- Cryptocurrency payment details
  cryptoCurrency VARCHAR(10),
  cryptoAddress VARCHAR(255),
  cryptoTxHash VARCHAR(255),
  cryptoAmount VARCHAR(50),
  
  status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled'),
  failureReason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completedAt TIMESTAMP
);
```

### API Endpoints

#### Get Authorize.net Configuration
```typescript
trpc.payments.getAuthorizeNetConfig.useQuery()
```
Returns the public API credentials needed for Accept.js initialization.

#### Get Supported Cryptocurrencies
```typescript
trpc.payments.getSupportedCryptos.useQuery()
```
Returns list of supported cryptocurrencies with current exchange rates.

#### Convert USD to Crypto
```typescript
trpc.payments.convertToCrypto.useQuery({
  usdCents: 20000,  // $200.00
  currency: "BTC"
})
```
Converts USD amount to cryptocurrency equivalent.

#### Create Payment Intent
```typescript
trpc.payments.createIntent.useMutation({
  loanApplicationId: 123,
  paymentMethod: "card" | "crypto",
  paymentProvider: "authorizenet" | "crypto",
  cryptoCurrency: "BTC" | "ETH" | "USDT" | "USDC"  // Required for crypto
})
```
Initiates a payment and returns payment details (crypto address for crypto payments).

## Configuration

### Authorize.net Setup

1. **Create Authorize.net Account**
   - Sign up at https://www.authorize.net
   - Choose sandbox for testing or production for live transactions

2. **Get API Credentials**
   - API Login ID
   - Transaction Key
   - Client Key (for Accept.js)

3. **Configure Environment Variables**

Add the following to your environment configuration (Settings → Secrets in Management UI):

```env
# Authorize.net Credentials
AUTHORIZENET_API_LOGIN_ID=your_api_login_id
AUTHORIZENET_TRANSACTION_KEY=your_transaction_key
AUTHORIZENET_CLIENT_KEY=your_client_key
AUTHORIZENET_ENVIRONMENT=sandbox  # or 'production'
```

4. **Test Credentials**

Sandbox test card numbers:
- Visa: `4111111111111111`
- Mastercard: `5424000000000015`
- Amex: `370000000000002`
- Discover: `6011000000000012`

All test cards:
- CVV: Any 3-4 digits
- Expiration: Any future date

### Cryptocurrency Gateway Setup

1. **Create Coinbase Commerce Account**
   - Sign up at https://commerce.coinbase.com
   - Complete merchant verification

2. **Get API Credentials**
   - API Key
   - Webhook Secret

3. **Configure Environment Variables**

```env
# Coinbase Commerce Credentials
COINBASE_COMMERCE_API_KEY=your_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret
CRYPTO_PAYMENT_ENVIRONMENT=sandbox  # or 'production'
```

4. **Configure Webhooks**

Set up webhook endpoint at:
```
https://your-domain.com/api/webhooks/crypto-payment
```

Webhook events to subscribe to:
- `charge:created`
- `charge:confirmed`
- `charge:failed`
- `charge:delayed`

## Frontend Implementation

### Card Payment Flow

The enhanced payment page (`/payment-enhanced/:id`) provides a tabbed interface for selecting payment methods.

**Card Payment Steps:**
1. User selects "Credit/Debit Card" tab
2. Click "Pay with Card" button
3. System initiates payment with Authorize.net
4. Accept.js tokenizes card data client-side
5. Token sent to server for processing
6. Payment confirmed and loan status updated

**Key Components:**
- `EnhancedPaymentPage.tsx` - Main payment interface
- Tabs component for method selection
- Real-time payment status updates

### Cryptocurrency Payment Flow

**Crypto Payment Steps:**
1. User selects "Cryptocurrency" tab
2. Choose cryptocurrency (BTC, ETH, USDT, USDC)
3. System displays real-time conversion rate
4. Click "Generate Payment Address"
5. System generates unique wallet address
6. User sends exact crypto amount to address
7. System monitors blockchain for confirmation
8. Payment confirmed after required confirmations

**Confirmation Requirements:**
- BTC: 3 confirmations (~30 minutes)
- ETH: 3 confirmations (~3-5 minutes)
- USDT/USDC: 1 confirmation (~1-2 minutes)

**Key Features:**
- QR code for easy wallet scanning
- Copy-to-clipboard for address and amount
- Real-time exchange rate display
- Payment expiration timer (1 hour)

## Testing

### Test Card Payments

1. Navigate to `/payment-enhanced/:id` for an approved loan
2. Select "Credit/Debit Card" tab
3. Use test card: `4111111111111111`
4. Enter any future expiration date
5. Enter any 3-digit CVV
6. Click "Pay with Card"
7. Verify payment success and loan status update

### Test Crypto Payments

1. Navigate to `/payment-enhanced/:id`
2. Select "Cryptocurrency" tab
3. Choose USDT (fastest for testing)
4. Click "Generate USDT Payment Address"
5. Note the generated address and amount
6. Click "I've Sent the Payment (Demo)" to simulate confirmation
7. Verify payment success and loan status update

**Note:** In demo mode, crypto payments are simulated. In production, you would actually send crypto to the generated address and wait for blockchain confirmations.

## Security Considerations

### Card Payment Security

1. **PCI Compliance**
   - Accept.js ensures card data never touches your server
   - All card processing happens on Authorize.net's PCI-compliant servers
   - Only tokenized data is transmitted to your backend

2. **Fraud Prevention**
   - Authorize.net's built-in fraud detection
   - CVV verification
   - Address verification system (AVS)

3. **Data Storage**
   - Never store full card numbers
   - Only store last 4 digits and card brand for reference
   - All sensitive data encrypted in transit and at rest

### Cryptocurrency Security

1. **Address Generation**
   - Unique address per transaction
   - Addresses expire after 1 hour
   - No address reuse to prevent tracking

2. **Payment Verification**
   - Blockchain confirmation required
   - Webhook signature validation
   - Amount verification (exact match required)

3. **Wallet Security**
   - Hot wallet for receiving payments
   - Automated transfer to cold storage
   - Multi-signature requirements for large amounts

## Production Deployment

### Pre-Deployment Checklist

- [ ] Obtain production Authorize.net credentials
- [ ] Obtain production Coinbase Commerce credentials
- [ ] Configure production environment variables
- [ ] Set up webhook endpoints with SSL
- [ ] Test webhook signature validation
- [ ] Configure fraud detection rules
- [ ] Set up payment monitoring and alerts
- [ ] Document payment reconciliation process
- [ ] Train support staff on payment issues
- [ ] Prepare refund/chargeback procedures

### Monitoring

Monitor the following metrics:

1. **Payment Success Rate**
   - Target: >95% for card payments
   - Target: >90% for crypto payments

2. **Average Processing Time**
   - Card: <5 seconds
   - Crypto: <1 hour (including confirmations)

3. **Failed Payment Reasons**
   - Insufficient funds
   - Invalid card details
   - Expired crypto payment address
   - Network issues

### Error Handling

Common errors and resolutions:

| Error | Cause | Resolution |
|-------|-------|------------|
| "Invalid card number" | User entered incorrect card | Prompt user to re-enter |
| "Transaction declined" | Insufficient funds or fraud flag | Contact card issuer |
| "Crypto amount mismatch" | User sent wrong amount | Request exact amount |
| "Payment expired" | User didn't pay within 1 hour | Generate new payment address |
| "Webhook validation failed" | Invalid signature | Check webhook secret configuration |

## Support and Troubleshooting

### Common Issues

**Issue: Accept.js not loading**
- Verify AUTHORIZENET_CLIENT_KEY is set correctly
- Check browser console for CORS errors
- Ensure using correct environment (sandbox vs production)

**Issue: Crypto payment not confirming**
- Verify webhook endpoint is accessible
- Check webhook signature validation
- Confirm sufficient blockchain confirmations

**Issue: Payment stuck in "processing"**
- Check Authorize.net dashboard for transaction status
- Verify webhook delivery
- Manually confirm payment if needed

### Getting Help

- Authorize.net Support: https://support.authorize.net
- Coinbase Commerce Support: https://commerce.coinbase.com/support
- AmeriLend Technical Documentation: See `API_DOCUMENTATION.md`

## Future Enhancements

Planned features for future releases:

1. **Additional Payment Methods**
   - ACH/Bank transfers
   - PayPal integration
   - Apple Pay / Google Pay

2. **Enhanced Crypto Support**
   - Lightning Network for Bitcoin
   - More altcoins (Litecoin, Cardano, etc.)
   - Stablecoin-only option

3. **Payment Features**
   - Recurring payments for installment loans
   - Partial payments
   - Payment plans
   - Automatic retry for failed payments

4. **Analytics**
   - Payment method preferences
   - Conversion rates by method
   - Geographic payment trends
   - Fraud detection improvements

---

**Last Updated:** November 2, 2025  
**Version:** 2.0  
**Author:** Manus AI
