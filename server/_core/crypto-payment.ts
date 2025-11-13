/**
 * Cryptocurrency payment integration
 * Supports BTC, ETH, USDT, USDC payments via personal wallet addresses
 */

import { getCryptoWallets } from '../db';
import QRCode from 'qrcode';

/**
 * Supported cryptocurrencies
 */
export type CryptoCurrency = "BTC" | "ETH" | "USDT" | "USDC";

/**
 * Personal wallet addresses for receiving crypto payments
 * First checks database settings, then falls back to environment variables
 */
export async function getPersonalWalletAddresses(): Promise<Record<CryptoCurrency, string>> {
  const wallets = await getCryptoWallets();
  
  return {
    BTC: wallets.btc || process.env.WALLET_ADDRESS_BTC || "",
    ETH: wallets.eth || process.env.WALLET_ADDRESS_ETH || "",
    USDT: wallets.usdt || process.env.WALLET_ADDRESS_USDT || "", // USDT ERC-20 (uses ETH address)
    USDC: wallets.usdc || process.env.WALLET_ADDRESS_USDC || "", // USDC ERC-20 (uses ETH address)
  };
}

/**
 * Cryptocurrency exchange rates (fetch from real-time API)
 * In production, fetch from CoinGecko or CoinMarketCap
 */
const FALLBACK_EXCHANGE_RATES: Record<CryptoCurrency, number> = {
  BTC: 65000, // 1 BTC = $65,000
  ETH: 3200,  // 1 ETH = $3,200
  USDT: 1,    // 1 USDT = $1
  USDC: 1,    // 1 USDC = $1
};

/**
 * Get current exchange rate for a cryptocurrency from CoinGecko API
 */
export async function getCryptoExchangeRate(currency: CryptoCurrency): Promise<number> {
  try {
    // Map to CoinGecko IDs
    const coinGeckoIds: Record<CryptoCurrency, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      USDT: "tether",
      USDC: "usd-coin",
    };

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds[currency]}&vs_currencies=usd`,
      { headers: { "Accept": "application/json" } }
    );
    
    if (!response.ok) {
      console.warn("Failed to fetch crypto rates, using fallback");
      return FALLBACK_EXCHANGE_RATES[currency];
    }

    const data = await response.json();
    return data[coinGeckoIds[currency]]?.usd || FALLBACK_EXCHANGE_RATES[currency];
  } catch (error) {
    console.error("Error fetching crypto rate:", error);
    return FALLBACK_EXCHANGE_RATES[currency];
  }
}

/**
 * Convert USD cents to cryptocurrency amount
 */
export async function convertUSDToCrypto(
  usdCents: number,
  currency: CryptoCurrency
): Promise<string> {
  const usdAmount = usdCents / 100;
  const rate = await getCryptoExchangeRate(currency);
  const cryptoAmount = usdAmount / rate;

  // Format with appropriate decimals
  const decimals = currency === "BTC" ? 8 : currency === "ETH" ? 6 : 2;
  return cryptoAmount.toFixed(decimals);
}

/**
 * Generate QR code for cryptocurrency payment
 * Returns base64 data URL that can be displayed directly in img tags
 */
async function generatePaymentQRCode(
  currency: CryptoCurrency,
  address: string,
  amount: string
): Promise<string> {
  try {
    // Create payment URI based on cryptocurrency standard
    let paymentURI: string;
    
    if (currency === "BTC") {
      // Bitcoin BIP21 URI format: bitcoin:address?amount=value
      paymentURI = `bitcoin:${address}?amount=${amount}`;
    } else if (currency === "ETH") {
      // Ethereum URI format: ethereum:address@chainId/transfer?value=amount
      // For simplicity, just use the address with amount as query param
      paymentURI = `ethereum:${address}?value=${amount}`;
    } else if (currency === "USDT" || currency === "USDC") {
      // ERC-20 tokens use Ethereum addresses
      paymentURI = `ethereum:${address}?value=${amount}`;
    } else {
      // Fallback: just the address
      paymentURI = address;
    }

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(paymentURI, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return a simple QR code with just the address if URI format fails
    return QRCode.toDataURL(address, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2
    });
  }
}

/**
 * Create a cryptocurrency payment charge using personal wallet
 */
export async function createCryptoCharge(
  amount: number, // in USD cents
  currency: CryptoCurrency,
  description: string,
  metadata: Record<string, any>
): Promise<{
  success: boolean;
  chargeId?: string;
  cryptoAmount?: string;
  paymentAddress?: string;
  qrCodeDataUrl?: string;
  expiresAt?: Date;
  error?: string;
}> {
  const wallets = await getPersonalWalletAddresses();
  const paymentAddress = wallets[currency];

  if (!paymentAddress) {
    return {
      success: false,
      error: `${currency} wallet address not configured. Please set WALLET_ADDRESS_${currency} in environment variables.`,
    };
  }

  try {
    // Convert USD to crypto
    const cryptoAmount = await convertUSDToCrypto(amount, currency);

    // Generate unique charge ID
    const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await generatePaymentQRCode(currency, paymentAddress, cryptoAmount);

    return {
      success: true,
      chargeId,
      cryptoAmount,
      paymentAddress,
      qrCodeDataUrl,
      expiresAt,
    };
  } catch (error) {
    console.error("Crypto payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Check payment status (manual verification for personal wallets)
 * In production, integrate with blockchain explorers or use webhooks
 */
export async function checkCryptoPaymentStatus(
  chargeId: string
): Promise<{
  status: "pending" | "confirmed" | "failed" | "expired";
  txHash?: string;
  confirmations?: number;
}> {
  // For personal wallet payments, this would require:
  // 1. Integration with blockchain explorer APIs (blockchain.com, etherscan.io, etc.)
  // 2. Manual verification by admin
  // 3. Webhook notifications from payment monitoring service

  // Return pending status - admin will manually confirm
  return {
    status: "pending",
  };
}

/**
 * Get list of supported cryptocurrencies with their exchange rates
 */
export async function getSupportedCryptos(): Promise<
  Array<{
    currency: CryptoCurrency;
    name: string;
    rate: number;
    symbol: string;
    walletAddress: string;
  }>
> {
  const wallets = await getPersonalWalletAddresses();
  
  return [
    {
      currency: "BTC",
      name: "Bitcoin",
      rate: await getCryptoExchangeRate("BTC"),
      symbol: "₿",
      walletAddress: wallets.BTC,
    },
    {
      currency: "ETH",
      name: "Ethereum",
      rate: await getCryptoExchangeRate("ETH"),
      symbol: "Ξ",
      walletAddress: wallets.ETH,
    },
    {
      currency: "USDT",
      name: "Tether (ERC-20)",
      rate: await getCryptoExchangeRate("USDT"),
      symbol: "₮",
      walletAddress: wallets.USDT,
    },
    {
      currency: "USDC",
      name: "USD Coin (ERC-20)",
      rate: await getCryptoExchangeRate("USDC"),
      symbol: "$",
      walletAddress: wallets.USDC,
    },
  ];
}
