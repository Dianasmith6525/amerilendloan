/**
 * Webhook handlers for payment providers
 * Handles callbacks from Stripe, Authorize.net, and crypto payment services
 */

import { Request, Response } from 'express';
import * as db from '../db';
import { logger, auditLogger } from './logging';
import { sendPaymentConfirmationEmail } from './email';

/**
 * Stripe webhook handler
 * https://stripe.com/docs/webhooks
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Stripe webhook secret not configured');
      res.status(500).json({ error: 'Webhook not configured' });
      return;
    }

    // In production, verify Stripe signature
    // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    
    // For now, parse the event directly (development mode)
    const event = req.body;

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailure(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleStripeRefund(event.data.object);
        break;

      default:
        logger.info('Unhandled Stripe webhook event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', error as Error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}

async function handleStripePaymentSuccess(paymentIntent: unknown): Promise<void> {
  const intent = paymentIntent as {
    id: string;
    metadata?: { loanApplicationId?: string; userId?: string };
    amount: number;
  };

  if (!intent.metadata?.loanApplicationId) {
    logger.warn('Payment intent missing loan application ID', { paymentIntentId: intent.id });
    return;
  }

  const loanApplicationId = parseInt(intent.metadata.loanApplicationId);
  const userId = intent.metadata.userId ? parseInt(intent.metadata.userId) : undefined;

  // Find payment record
  const payments = await db.getPaymentsByLoanApplicationId(loanApplicationId);
  const payment = payments.find(p => p.paymentIntentId === intent.id);

  if (!payment) {
    logger.warn('Payment record not found for Stripe payment intent', { 
      paymentIntentId: intent.id,
      loanApplicationId 
    });
    return;
  }

  // Update payment status
  await db.updatePaymentStatus(payment.id, 'succeeded', {
    completedAt: new Date(),
  });

  // Update loan application status
  await db.updateLoanApplicationStatus(loanApplicationId, 'fee_paid');

  // Get application details
  const application = await db.getLoanApplicationById(loanApplicationId);
  if (application) {
    // Send confirmation email
    await sendPaymentConfirmationEmail(
      application.email,
      application.fullName,
      loanApplicationId,
      payment.amount,
      `Card ending in ${payment.cardLast4}`
    );

    // Log notification
    await db.createNotification({
      userId: payment.userId,
      loanApplicationId,
      type: 'payment_confirmed',
      channel: 'email',
      recipient: application.email,
      subject: '✅ Payment Confirmed - AmeriLend',
      message: `Your payment of $${(payment.amount / 100).toFixed(2)} has been confirmed.`,
      status: 'sent',
      sentAt: new Date(),
    });
  }

  // Audit log
  if (userId) {
    auditLogger.log({
      userId,
      action: 'payment_completed',
      resourceType: 'payment',
      resourceId: payment.id,
      success: true,
    });
  }

  logger.info('Stripe payment processed successfully', { 
    paymentId: payment.id,
    loanApplicationId 
  });
}

async function handleStripePaymentFailure(paymentIntent: unknown): Promise<void> {
  const intent = paymentIntent as {
    id: string;
    metadata?: { loanApplicationId?: string };
    last_payment_error?: { message: string };
  };

  if (!intent.metadata?.loanApplicationId) {
    return;
  }

  const loanApplicationId = parseInt(intent.metadata.loanApplicationId);
  const payments = await db.getPaymentsByLoanApplicationId(loanApplicationId);
  const payment = payments.find(p => p.paymentIntentId === intent.id);

  if (payment) {
    await db.updatePaymentStatus(payment.id, 'failed');

    logger.warn('Stripe payment failed', { 
      paymentId: payment.id,
      reason: intent.last_payment_error?.message 
    });
  }
}

async function handleStripeRefund(charge: unknown): Promise<void> {
  logger.info('Stripe refund received', { charge });
  // Handle refund logic here
}

/**
 * Authorize.net webhook handler
 * https://developer.authorize.net/api/reference/features/webhooks.html
 */
export async function handleAuthorizeNetWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event = req.body;
    
    logger.info('Authorize.net webhook received', { eventType: event.eventType });

    switch (event.eventType) {
      case 'net.authorize.payment.authorization.created':
        await handleAuthorizeNetPaymentSuccess(event.payload);
        break;
      
      case 'net.authorize.payment.authcapture.created':
        await handleAuthorizeNetCaptureSuccess(event.payload);
        break;
      
      case 'net.authorize.payment.void.created':
        await handleAuthorizeNetVoid(event.payload);
        break;

      default:
        logger.info('Unhandled Authorize.net webhook event', { eventType: event.eventType });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Authorize.net webhook error', error as Error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}

async function handleAuthorizeNetPaymentSuccess(payload: unknown): Promise<void> {
  const data = payload as {
    id: string;
    responseCode: string;
    userFields?: Array<{ name: string; value: string }>;
  };

  // Extract loan application ID from user fields
  const loanAppField = data.userFields?.find(f => f.name === 'loanApplicationId');
  if (!loanAppField) {
    logger.warn('Authorize.net payment missing loan application ID');
    return;
  }

  const loanApplicationId = parseInt(loanAppField.value);
  
  // Similar processing as Stripe
  logger.info('Authorize.net payment processed', { loanApplicationId, transactionId: data.id });
}

async function handleAuthorizeNetCaptureSuccess(payload: unknown): Promise<void> {
  logger.info('Authorize.net capture successful', { payload });
}

async function handleAuthorizeNetVoid(payload: unknown): Promise<void> {
  logger.info('Authorize.net void processed', { payload });
}

/**
 * Coinbase Commerce (Crypto) webhook handler
 * https://commerce.coinbase.com/docs/api/#webhooks
 */
export async function handleCryptoWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-cc-webhook-signature'] as string;
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Crypto webhook secret not configured');
      res.status(500).json({ error: 'Webhook not configured' });
      return;
    }

    // In production, verify webhook signature
    // const isValid = verifyCoinbaseSignature(req.body, signature, webhookSecret);
    // if (!isValid) {
    //   res.status(401).json({ error: 'Invalid signature' });
    //   return;
    // }

    const event = req.body;
    
    logger.info('Crypto webhook received', { type: event.type, id: event.id });

    switch (event.type) {
      case 'charge:confirmed':
        await handleCryptoPaymentConfirmed(event.data);
        break;
      
      case 'charge:failed':
        await handleCryptoPaymentFailed(event.data);
        break;
      
      case 'charge:pending':
        await handleCryptoPaymentPending(event.data);
        break;

      default:
        logger.info('Unhandled crypto webhook event', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Crypto webhook error', error as Error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
}

async function handleCryptoPaymentConfirmed(chargeData: unknown): Promise<void> {
  const charge = chargeData as {
    id: string;
    metadata?: { loanApplicationId?: string; userId?: string };
    payments?: Array<{ transaction_id: string }>;
  };

  if (!charge.metadata?.loanApplicationId) {
    logger.warn('Crypto charge missing loan application ID');
    return;
  }

  const loanApplicationId = parseInt(charge.metadata.loanApplicationId);
  const userId = charge.metadata.userId ? parseInt(charge.metadata.userId) : undefined;

  // Find payment record
  const payments = await db.getPaymentsByLoanApplicationId(loanApplicationId);
  const payment = payments.find(p => p.paymentIntentId === charge.id);

  if (!payment) {
    logger.warn('Payment record not found for crypto charge', { 
      chargeId: charge.id,
      loanApplicationId 
    });
    return;
  }

  // Update payment with transaction hash
  const txHash = charge.payments?.[0]?.transaction_id;
  await db.updatePaymentStatus(payment.id, 'succeeded', {
    completedAt: new Date(),
    cryptoTxHash: txHash,
  });

  // Update loan application status
  await db.updateLoanApplicationStatus(loanApplicationId, 'fee_paid');

  // Get application and send email
  const application = await db.getLoanApplicationById(loanApplicationId);
  if (application) {
    await sendPaymentConfirmationEmail(
      application.email,
      application.fullName,
      loanApplicationId,
      payment.amount,
      `Cryptocurrency (${payment.cryptoCurrency})`
    );

    await db.createNotification({
      userId: payment.userId,
      loanApplicationId,
      type: 'payment_confirmed',
      channel: 'email',
      recipient: application.email,
      subject: '✅ Payment Confirmed - AmeriLend',
      message: `Your cryptocurrency payment has been confirmed.`,
      status: 'sent',
      sentAt: new Date(),
    });
  }

  if (userId) {
    auditLogger.log({
      userId,
      action: 'crypto_payment_completed',
      resourceType: 'payment',
      resourceId: payment.id,
      success: true,
    });
  }

  logger.info('Crypto payment confirmed', { paymentId: payment.id, txHash });
}

async function handleCryptoPaymentFailed(chargeData: unknown): Promise<void> {
  logger.warn('Crypto payment failed', { chargeData });
  // Handle failure logic
}

async function handleCryptoPaymentPending(chargeData: unknown): Promise<void> {
  logger.info('Crypto payment pending', { chargeData });
  // Update payment status to processing
}

/**
 * Verify webhook signatures
 */
export function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  // Use Stripe library in production
  // return stripe.webhooks.constructEvent(payload, signature, secret);
  return true; // Placeholder
}

export function verifyCoinbaseSignature(payload: string, signature: string, secret: string): boolean {
  // Implement Coinbase Commerce signature verification
  // https://commerce.coinbase.com/docs/api/#webhooks
  return true; // Placeholder
}
