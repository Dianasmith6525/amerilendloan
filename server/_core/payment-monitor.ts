/**
 * Crypto Payment Monitoring Service
 * Automatically checks pending crypto payments and confirms them when verified on blockchain
 */

import { verifyCryptoPayment, getMinimumConfirmations, type CryptoCurrency } from './blockchain-verification';
import { getDb } from '../db';
import { payments, loanApplications } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { sendPaymentConfirmationEmail } from './email';

/**
 * Check a single pending crypto payment
 */
async function checkPendingPayment(payment: any): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[PaymentMonitor] Database not available');
    return;
  }

  try {
    console.log(`[PaymentMonitor] Checking payment #${payment.id} - ${payment.cryptoCurrency}`);

    // Verify payment on blockchain
    const verification = await verifyCryptoPayment(
      payment.cryptoCurrency as CryptoCurrency,
      payment.cryptoAddress!,
      payment.cryptoAmount!,
      new Date(payment.createdAt)
    );

    if (!verification.verified) {
      console.log(`[PaymentMonitor] Payment #${payment.id} not yet verified: ${verification.error || 'No transaction found'}`);
      return;
    }

    // Check if payment has enough confirmations
    const minConfirmations = getMinimumConfirmations(payment.cryptoCurrency as CryptoCurrency);
    const confirmations = verification.confirmations || 0;

    console.log(`[PaymentMonitor] Payment #${payment.id} found! TX: ${verification.txHash}, Confirmations: ${confirmations}/${minConfirmations}`);

    if (confirmations < minConfirmations) {
      console.log(`[PaymentMonitor] Payment #${payment.id} waiting for more confirmations`);
      return;
    }

    // Payment verified with sufficient confirmations - auto-confirm!
    console.log(`[PaymentMonitor] ✅ Auto-confirming payment #${payment.id}`);

    // Update payment status
    await db.update(payments)
      .set({
        status: 'succeeded',
        transactionId: verification.txHash,
        completedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update loan application status
    await db.update(loanApplications)
      .set({ 
        status: 'fee_paid',
        updatedAt: new Date()
      })
      .where(eq(loanApplications.id, payment.loanApplicationId));

    // Get loan application details for email
    const [application] = await db.select()
      .from(loanApplications)
      .where(eq(loanApplications.id, payment.loanApplicationId));

    if (application) {
      // Send confirmation email
      const paymentMethodText = `Cryptocurrency (${payment.cryptoCurrency})`;
      
      await sendPaymentConfirmationEmail(
        application.email,
        application.fullName,
        payment.loanApplicationId,
        payment.amount,
        paymentMethodText
      );

      console.log(`[PaymentMonitor] ✅ Email sent to ${application.email} for payment #${payment.id}`);
    }

    console.log(`[PaymentMonitor] ✅ Payment #${payment.id} successfully confirmed!`);

  } catch (error) {
    console.error(`[PaymentMonitor] Error checking payment #${payment.id}:`, error);
  }
}

/**
 * Check all pending crypto payments
 */
async function checkAllPendingPayments(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[PaymentMonitor] Database not available');
    return;
  }

  try {
    // Get all pending crypto payments
    const pendingPayments = await db.select()
      .from(payments)
      .where(
        and(
          eq(payments.status, 'pending'),
          eq(payments.paymentMethod, 'crypto')
        )
      );

    if (pendingPayments.length === 0) {
      console.log('[PaymentMonitor] No pending crypto payments');
      return;
    }

    console.log(`[PaymentMonitor] Found ${pendingPayments.length} pending crypto payment(s)`);

    // Check each payment
    for (const payment of pendingPayments) {
      await checkPendingPayment(payment);
    }

  } catch (error) {
    console.error('[PaymentMonitor] Error checking pending payments:', error);
  }
}

/**
 * Start payment monitoring service
 * Checks pending payments every 2 minutes
 */
export function startPaymentMonitoring(): NodeJS.Timeout {
  console.log('[PaymentMonitor] 🚀 Starting crypto payment monitoring service...');
  console.log('[PaymentMonitor] Checking pending payments every 2 minutes');

  // Check immediately on startup
  checkAllPendingPayments();

  // Then check every 2 minutes
  const interval = setInterval(() => {
    checkAllPendingPayments();
  }, 2 * 60 * 1000); // 2 minutes

  return interval;
}

/**
 * Stop payment monitoring service
 */
export function stopPaymentMonitoring(interval: NodeJS.Timeout): void {
  console.log('[PaymentMonitor] 🛑 Stopping crypto payment monitoring service...');
  clearInterval(interval);
}

/**
 * Manually check a specific payment (for testing or admin trigger)
 */
export async function checkPaymentById(paymentId: number): Promise<{
  success: boolean;
  message: string;
  verified?: boolean;
  txHash?: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const [payment] = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.status !== 'pending') {
      return { 
        success: false, 
        message: `Payment already ${payment.status}` 
      };
    }

    if (payment.paymentMethod !== 'crypto') {
      return { 
        success: false, 
        message: 'Payment is not a crypto payment' 
      };
    }

    await checkPendingPayment(payment);

    // Re-fetch payment to check if it was confirmed
    const [updatedPayment] = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId));

    if (updatedPayment.status === 'succeeded') {
      return {
        success: true,
        message: 'Payment verified and confirmed',
        verified: true,
        txHash: updatedPayment.transactionId || undefined
      };
    } else {
      return {
        success: true,
        message: 'Payment checked but not yet verified on blockchain',
        verified: false
      };
    }

  } catch (error) {
    console.error('[PaymentMonitor] Error in manual check:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Check failed'
    };
  }
}
