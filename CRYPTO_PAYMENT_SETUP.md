# Cryptocurrency Payment Setup Guide

## Overview
AmeriLend now supports cryptocurrency payments alongside credit/debit card payments for processing fees. Payments are sent directly to your personal wallet addresses.

## Supported Cryptocurrencies
- **Bitcoin (BTC)** - Native Bitcoin
- **Ethereum (ETH)** - Native Ethereum
- **USDT** - Tether (ERC-20 on Ethereum network)
- **USDC** - USD Coin (ERC-20 on Ethereum network)

## Configuration Steps

### 1. Set Up Your Wallet Addresses

Add your personal wallet addresses to your `.env` file:

```bash
# Bitcoin Wallet
WALLET_ADDRESS_BTC=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

# Ethereum Wallet (also used for ERC-20 tokens)
WALLET_ADDRESS_ETH=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# USDT (ERC-20) - Can use same address as ETH
WALLET_ADDRESS_USDT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# USDC (ERC-20) - Can use same address as ETH  
WALLET_ADDRESS_USDC=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### 2. Wallet Security Best Practices

- **Use Hardware Wallets**: Ledger or Trezor for maximum security
- **Never Share Private Keys**: Only use public wallet addresses
- **Enable 2FA**: On exchange accounts if using exchange wallets
- **Keep Backups**: Securely store seed phrases offline
- **Separate Business Wallet**: Consider using dedicated wallets for business

### 3. Recommended Wallet Options

#### For Bitcoin (BTC):
- **Ledger** - Hardware wallet (recommended)
- **Trezor** - Hardware wallet (recommended)
- **Electrum** - Desktop software wallet
- **BlueWallet** - Mobile wallet

#### For Ethereum/ERC-20 (ETH, USDT, USDC):
- **Ledger** - Hardware wallet (recommended)
- **Trezor** - Hardware wallet (recommended)
- **MetaMask** - Browser extension wallet
- **Trust Wallet** - Mobile wallet
- **Coinbase Wallet** - Mobile/browser wallet

## How It Works

### Customer Payment Flow:
1. Customer selects cryptocurrency payment option
2. Customer chooses currency (BTC, ETH, USDT, or USDC)
3. System generates payment details with:
   - Your wallet address
   - Exact amount to send (calculated in real-time)
   - QR code for easy scanning
4. Customer sends payment from their wallet
5. Payment appears in your wallet
6. Admin manually verifies payment
7. Loan is approved for disbursement

### Exchange Rates:
- Fetched in real-time from CoinGecko API
- Calculated at time of payment address generation
- Locked for 1 hour to avoid price fluctuations

## Payment Verification

### Manual Verification Process:
1. Check your wallet for incoming transactions
2. Verify the amount matches the payment record
3. Confirm sufficient blockchain confirmations:
   - Bitcoin: 1-3 confirmations recommended
   - Ethereum: 12-35 confirmations recommended
4. Use Admin Dashboard to mark payment as confirmed

### Blockchain Explorers for Verification:
- **Bitcoin**: https://blockchain.com or https://blockchair.com
- **Ethereum**: https://etherscan.io
- **USDT/USDC**: Use Etherscan (same as ETH)

## Admin Dashboard Payment Confirmation

Navigate to Admin Dashboard → Payments section:
1. Find the pending crypto payment
2. Verify the transaction in your wallet
3. Click "Verify Payment" button
4. Customer receives confirmation email
5. Loan proceeds to disbursement

## Testing

### For Development/Testing:
1. Use **testnet wallets** (never use real wallets in development)
2. Bitcoin Testnet: https://testnet.blockchain.com
3. Ethereum Goerli/Sepolia: https://goerli.etherscan.io
4. Set up testnet wallet addresses in `.env`:

```bash
# Testnet addresses
WALLET_ADDRESS_BTC=tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
WALLET_ADDRESS_ETH=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Transaction Fees

### Network Fees (paid by customer):
- **Bitcoin**: Variable, typically $1-$10 depending on network congestion
- **Ethereum**: Variable (gas fees), can be $5-$50+
- **USDT/USDC**: Same as Ethereum (ERC-20 tokens)

### Fee Recommendations for Customers:
- Suggest **USDT or USDC** for lower volatility and stable pricing
- Bitcoin for customers preferring native BTC
- ETH for Ethereum enthusiasts

## Security Considerations

### Protect Your Wallet:
- Never share private keys or seed phrases
- Use only the public wallet address in configuration
- Monitor wallet regularly for incoming payments
- Set up wallet notifications if available

### Fraud Prevention:
- Verify each transaction on blockchain before confirming
- Check transaction hash and amount
- Wait for sufficient confirmations
- Keep records of all transaction IDs

## Support & Troubleshooting

### Common Issues:

**Issue: Payment not received**
- Check if customer sent to correct address
- Verify transaction on blockchain explorer
- Check if sufficient confirmations
- Contact customer for transaction ID/hash

**Issue: Wrong amount sent**
- Partial payments: Contact customer for remainder
- Overpayment: Arrange refund or credit to account
- Underpayment: Request additional payment

**Issue: Network congestion**
- Bitcoin/Ethereum networks can be slow during high traffic
- Advise customers about current network conditions
- Consider accepting payments with 0 confirmations for small amounts

## Compliance & Legal

### Record Keeping:
- Keep all transaction records
- Document wallet addresses used
- Save transaction hashes
- Maintain payment verification logs

### Tax Reporting:
- Crypto payments are taxable events
- Consult with tax professional
- Use tools like CoinTracker or Koinly for tracking
- Report as business income in fiat equivalent

## Future Enhancements

### Automatic Verification (Optional):
- Integrate blockchain APIs (Blockchain.com, Etherscan)
- Webhook monitoring services
- Automatic confirmation after X blocks
- Real-time payment status updates

### Additional Cryptocurrencies:
- Bitcoin Lightning Network (faster, cheaper)
- Polygon/MATIC (lower fees than Ethereum)
- Binance Smart Chain (BSC) tokens
- Stablecoins on other chains

## Contact & Support

For questions about cryptocurrency payment setup:
- Email: support@amerilendloan.com
- Phone: (945) 212-1609

For technical blockchain questions:
- Bitcoin: https://bitcoin.org
- Ethereum: https://ethereum.org
- General crypto: https://coinbase.com/learn
