/**
 * Blockchain Payment Verification Service
 * Verifies cryptocurrency payments on Bitcoin and Ethereum networks
 */

import { ethers } from 'ethers';
import axios from 'axios';

export type CryptoCurrency = "BTC" | "ETH" | "USDT" | "USDC";

/**
 * Configuration for blockchain providers
 */
const BLOCKCHAIN_PROVIDERS = {
  // Ethereum mainnet RPC (free public endpoint)
  ETH_RPC: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
  
  // Bitcoin blockchain API
  BTC_API: process.env.BTC_API_URL || 'https://blockstream.info/api',
};

/**
 * Verify Bitcoin payment
 * Checks if BTC was sent to the specified address with the expected amount
 */
async function verifyBitcoinPayment(
  address: string,
  expectedAmountBTC: string,
  sinceTimestamp: number
): Promise<{
  verified: boolean;
  txHash?: string;
  amount?: string;
  confirmations?: number;
  error?: string;
}> {
  try {
    // Get address transactions from Blockstream API
    const response = await axios.get(
      `${BLOCKCHAIN_PROVIDERS.BTC_API}/address/${address}/txs`,
      { timeout: 10000 }
    );

    if (!response.data || !Array.isArray(response.data)) {
      return { verified: false, error: 'Failed to fetch Bitcoin transactions' };
    }

    const transactions = response.data;
    const expectedSatoshis = Math.floor(parseFloat(expectedAmountBTC) * 100000000);
    const toleranceSatoshis = 10000; // 0.0001 BTC tolerance

    // Check each transaction
    for (const tx of transactions) {
      // Skip transactions before payment was initiated
      const txTime = tx.status?.block_time || 0;
      if (txTime > 0 && txTime < sinceTimestamp / 1000) continue;

      // Check outputs for payment to our address
      for (const output of tx.vout || []) {
        if (output.scriptpubkey_address === address) {
          const receivedSatoshis = output.value;
          
          // Check if amount matches (with small tolerance)
          if (Math.abs(receivedSatoshis - expectedSatoshis) <= toleranceSatoshis) {
            const confirmations = tx.status?.confirmed 
              ? (tx.status.block_height ? 1 : 0)
              : 0;

            return {
              verified: true,
              txHash: tx.txid,
              amount: (receivedSatoshis / 100000000).toFixed(8),
              confirmations: confirmations,
            };
          }
        }
      }
    }

    return { verified: false, error: 'No matching payment found' };
  } catch (error) {
    console.error('Bitcoin verification error:', error);
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Bitcoin verification failed' 
    };
  }
}

/**
 * Verify Ethereum payment (ETH)
 * Checks if ETH was sent to the specified address
 */
async function verifyEthereumPayment(
  address: string,
  expectedAmountETH: string,
  sinceBlock: number
): Promise<{
  verified: boolean;
  txHash?: string;
  amount?: string;
  confirmations?: number;
  error?: string;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_PROVIDERS.ETH_RPC);
    const expectedWei = ethers.parseEther(expectedAmountETH);
    const toleranceWei = ethers.parseEther('0.001'); // 0.001 ETH tolerance

    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Search recent blocks for transactions to our address
    const blockRange = Math.min(currentBlock - sinceBlock, 1000); // Max 1000 blocks
    
    for (let i = 0; i < blockRange; i++) {
      const blockNum = currentBlock - i;
      const block = await provider.getBlock(blockNum, true);
      
      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue;

        // Check if transaction is to our address
        if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
          const receivedWei = tx.value;
          const diff = receivedWei > expectedWei
            ? receivedWei - expectedWei
            : expectedWei - receivedWei;

          // Check if amount matches (with tolerance)
          if (diff <= toleranceWei) {
            const confirmations = currentBlock - blockNum;

            return {
              verified: true,
              txHash: tx.hash,
              amount: ethers.formatEther(receivedWei),
              confirmations: confirmations,
            };
          }
        }
      }
    }

    return { verified: false, error: 'No matching ETH payment found' };
  } catch (error) {
    console.error('Ethereum verification error:', error);
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Ethereum verification failed' 
    };
  }
}

/**
 * Verify ERC-20 token payment (USDT/USDC)
 * Checks if tokens were sent to the specified address
 */
async function verifyERC20Payment(
  tokenAddress: string,
  recipientAddress: string,
  expectedAmount: string,
  sinceBlock: number
): Promise<{
  verified: boolean;
  txHash?: string;
  amount?: string;
  confirmations?: number;
  error?: string;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_PROVIDERS.ETH_RPC);
    
    // ERC-20 Transfer event signature
    const transferEventTopic = ethers.id('Transfer(address,address,uint256)');
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(sinceBlock, currentBlock - 10000); // Max 10000 blocks back

    // Query Transfer events to our address
    // Limit the block range to avoid "range is invalid" errors
    const maxBlocks = 1000; // Maximum blocks to query at once
    const toBlock = Math.min(currentBlock, fromBlock + maxBlocks);

    const filter = {
      address: tokenAddress,
      topics: [
        transferEventTopic,
        null, // from (any address)
        ethers.zeroPadValue(recipientAddress, 32) // to (our address)
      ],
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    console.log(`[ERC20] Querying blocks ${fromBlock} to ${toBlock} for ${tokenAddress}`);

    const logs = await provider.getLogs(filter);
    
    const expectedAmountWei = ethers.parseUnits(expectedAmount, 6); // USDT/USDC use 6 decimals
    const toleranceWei = ethers.parseUnits('0.01', 6); // 0.01 token tolerance

    for (const log of logs) {
      // Decode the amount from the log data
      const amount = BigInt(log.data);
      const diff = amount > expectedAmountWei 
        ? amount - expectedAmountWei 
        : expectedAmountWei - amount;

      if (diff <= toleranceWei) {
        const receipt = await provider.getTransactionReceipt(log.transactionHash);
        const confirmations = receipt ? currentBlock - receipt.blockNumber : 0;

        return {
          verified: true,
          txHash: log.transactionHash,
          amount: ethers.formatUnits(amount, 6),
          confirmations: confirmations,
        };
      }
    }

    return { verified: false, error: 'No matching token transfer found' };
  } catch (error) {
    console.error('ERC-20 verification error:', error);
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Token verification failed' 
    };
  }
}

/**
 * Verify cryptocurrency payment based on currency type
 */
export async function verifyCryptoPayment(
  currency: CryptoCurrency,
  recipientAddress: string,
  expectedAmount: string,
  paymentCreatedAt: Date
): Promise<{
  verified: boolean;
  txHash?: string;
  actualAmount?: string;
  confirmations?: number;
  error?: string;
}> {
  const timestamp = paymentCreatedAt.getTime();
  
  try {
    switch (currency) {
      case 'BTC':
        return await verifyBitcoinPayment(recipientAddress, expectedAmount, timestamp);
      
      case 'ETH':
        const ethBlock = Math.floor(timestamp / 1000 / 12); // Approx block number (12s blocks)
        return await verifyEthereumPayment(recipientAddress, expectedAmount, ethBlock);
      
      case 'USDT':
        // USDT contract address on Ethereum mainnet
        const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
        const usdtBlock = Math.floor(timestamp / 1000 / 12);
        return await verifyERC20Payment(usdtAddress, recipientAddress, expectedAmount, usdtBlock);
      
      case 'USDC':
        // USDC contract address on Ethereum mainnet
        const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const usdcBlock = Math.floor(timestamp / 1000 / 12);
        return await verifyERC20Payment(usdcAddress, recipientAddress, expectedAmount, usdcBlock);
      
      default:
        return { verified: false, error: 'Unsupported cryptocurrency' };
    }
  } catch (error) {
    console.error(`Crypto payment verification error (${currency}):`, error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Get minimum confirmations required before auto-approving payment
 */
export function getMinimumConfirmations(currency: CryptoCurrency): number {
  switch (currency) {
    case 'BTC': return 1; // Bitcoin: 1 confirmation (~10 min)
    case 'ETH': return 12; // Ethereum: 12 confirmations (~2.4 min)
    case 'USDT':
    case 'USDC': return 12; // ERC-20: 12 confirmations (~2.4 min)
    default: return 1;
  }
}
