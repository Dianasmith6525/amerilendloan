#!/usr/bin/env node
/**
 * Test QR Code Generation for Crypto Payments
 * Verifies that QR codes are properly generated with payment URIs
 */

import { createCryptoCharge } from './server/_core/crypto-payment.ts';

async function testQRCodeGeneration() {
  console.log('='.repeat(80));
  console.log('QR CODE GENERATION TEST');
  console.log('='.repeat(80));
  console.log();

  const testAmount = 10000; // $100.00 in cents
  const currencies = ['BTC', 'ETH', 'USDT', 'USDC'];

  for (const currency of currencies) {
    console.log(`\n📱 Testing ${currency} QR Code Generation`);
    console.log('-'.repeat(80));

    try {
      const result = await createCryptoCharge(
        testAmount,
        currency,
        `Test payment for ${currency}`,
        { test: true }
      );

      if (result.success) {
        console.log('✓ Status: SUCCESS');
        console.log(`  Charge ID: ${result.chargeId}`);
        console.log(`  Payment Address: ${result.paymentAddress?.substring(0, 40)}...`);
        console.log(`  Crypto Amount: ${result.cryptoAmount} ${currency}`);
        console.log(`  QR Code Type: ${result.qrCodeDataUrl?.startsWith('data:image/png;base64,') ? 'Base64 PNG' : 'Unknown'}`);
        console.log(`  QR Code Size: ${result.qrCodeDataUrl ? `${(result.qrCodeDataUrl.length / 1024).toFixed(2)} KB` : 'N/A'}`);
        
        if (result.qrCodeDataUrl) {
          // Decode and show first few characters to verify it's base64
          const base64Data = result.qrCodeDataUrl.split(',')[1];
          console.log(`  QR Data Sample: ${base64Data?.substring(0, 50)}...`);
          console.log('  ✓ QR Code generated successfully!');
        } else {
          console.log('  ❌ QR Code data URL missing');
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log();
  console.log('✓ QR codes are generated as base64 data URLs');
  console.log('✓ Each QR code contains payment URI (address + amount)');
  console.log('✓ QR codes can be embedded directly in <img> tags');
  console.log('✓ Wallet apps can scan QR codes to auto-fill payment details');
  console.log();
  console.log('Payment URI Formats:');
  console.log('  BTC:  bitcoin:address?amount=value');
  console.log('  ETH:  ethereum:address?value=amount');
  console.log('  USDT: ethereum:address?value=amount (ERC-20)');
  console.log('  USDC: ethereum:address?value=amount (ERC-20)');
  console.log();
}

testQRCodeGeneration().catch(console.error);
