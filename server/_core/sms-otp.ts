/**
 * SMS OTP authentication module using Twilio
 * Handles phone-based OTP generation, validation, and delivery
 */

import twilio from 'twilio';
import { getDb } from "../db";
import { otpCodes } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

/**
 * Initialize Twilio client
 */
function getTwilioClient(): twilio.Twilio | null {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[SMS OTP] Twilio credentials not configured. SMS functionality disabled.');
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return twilioClient;
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('1') && cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS using Twilio
 */
export async function sendSMSOTP(
  phone: string,
  code: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const client = getTwilioClient();
  
  if (!client) {
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    let message = '';
    switch (purpose) {
      case 'signup':
        message = `Welcome to AmeriLend! Your verification code is: ${code}. Valid for 10 minutes.`;
        break;
      case 'login':
        message = `AmeriLend Login Code: ${code}. Valid for 10 minutes.`;
        break;
      case 'loan_application':
        message = `AmeriLend Loan Application Code: ${code}. Valid for 10 minutes.`;
        break;
    }

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    return { success: true, messageId: result.sid };

  } catch (error: any) {
    console.error('[SMS OTP] Failed to send:', error);
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}

/**
 * Create and send OTP for phone authentication
 */
export async function createPhoneOTP(
  phone: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ success: boolean; code?: string; error?: string }> {
  const db = getDb();
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await db.insert(otpCodes).values({
      email: phone,
      code,
      purpose,
      expiresAt,
      verified: 0,
      attempts: 0,
    });

    const smsResult = await sendSMSOTP(phone, code, purpose);
    
    if (!smsResult.success) {
      return { success: false, error: smsResult.error };
    }

    return { success: true, code };

  } catch (error: any) {
    return { success: false, error: 'Failed to create OTP' };
  }
}

/**
 * Verify phone OTP code
 */
export async function verifyPhoneOTP(
  phone: string,
  code: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ valid: boolean; error?: string }> {
  const db = getDb();

  try {
    const [otpRecord] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, phone),
          eq(otpCodes.purpose, purpose),
          eq(otpCodes.verified, 0),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);

    if (!otpRecord) {
      return { valid: false, error: 'OTP code expired or not found' };
    }

    if (otpRecord.attempts >= 3) {
      return { valid: false, error: 'Too many failed attempts' };
    }

    if (otpRecord.code !== code) {
      await db
        .update(otpCodes)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otpCodes.id, otpRecord.id));

      return { valid: false, error: 'Invalid code' };
    }

    await db
      .update(otpCodes)
      .set({ verified: 1 })
      .where(eq(otpCodes.id, otpRecord.id));

    return { valid: true };

  } catch (error: any) {
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Resend OTP to phone
 */
export async function resendPhoneOTP(
  phone: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  
  try {
    await db
      .update(otpCodes)
      .set({ verified: 1 })
      .where(
        and(
          eq(otpCodes.email, phone),
          eq(otpCodes.purpose, purpose),
          eq(otpCodes.verified, 0)
        )
      );
  } catch (error) {
    console.error('[SMS OTP] Failed to invalidate old OTPs:', error);
  }

  return createPhoneOTP(phone, purpose);
}
