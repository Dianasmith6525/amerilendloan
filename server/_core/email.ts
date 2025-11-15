import { ENV } from './env';

/**
 * Email service for sending notifications to users
 * Configured with SendGrid for production email delivery
 */

const APP_URL = process.env.APP_URL || 'https://www.amerilendloan.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'amerilendloan.com';

// Default sender addresses - all using your authenticated domain
const EMAIL_NOREPLY = process.env.EMAIL_NOREPLY || `noreply@${EMAIL_DOMAIN}`;
const EMAIL_SUPPORT = process.env.EMAIL_SUPPORT || `support@${EMAIL_DOMAIN}`;
const EMAIL_VERIFY = process.env.EMAIL_VERIFY || `verify@${EMAIL_DOMAIN}`;
const EMAIL_NOTIFICATION = process.env.EMAIL_NOTIFICATION || `notifications@${EMAIL_DOMAIN}`;

const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_NOREPLY;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AmeriLend';

// SMTP Configuration (Gmail or other SMTP)
const SMTP_HOST = process.env.SMTP_HOST; // e.g., smtp.gmail.com
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER; // Your Gmail address
const SMTP_PASS = process.env.SMTP_PASS; // App password from Gmail

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string; // Optional: override default sender
  fromName?: string; // Optional: override default sender name
}

/**
 * Send an email using SendGrid or SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Use custom sender or default
  const senderEmail = options.from || EMAIL_FROM;
  const senderName = options.fromName || EMAIL_FROM_NAME;
  
  try {
    console.log('[Email] Attempting to send email...');
    console.log('[Email] To:', options.to);
    console.log('[Email] From:', senderEmail);
    console.log('[Email] SendGrid API Key present:', !!SENDGRID_API_KEY);
    
    if (SENDGRID_API_KEY) {
      // SendGrid email integration using native HTTPS (more reliable than @sendgrid/mail library)
      console.log('[Email] Using SendGrid via HTTPS...');
      
      const https = await import('https');
      
      const emailData = JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }]
          }
        ],
        from: {
          email: senderEmail,
          name: senderName,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/plain',
            value: options.text || options.subject
          },
          {
            type: 'text/html',
            value: options.html
          }
        ]
      });
      
      const requestOptions = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(emailData)
        },
        timeout: 10000
      };
      
      await new Promise<void>((resolve, reject) => {
        const req = https.request(requestOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 202) {
              console.log('[Email] ✓ Sent via SendGrid successfully to:', options.to);
              resolve();
            } else {
              console.error('[Email] SendGrid error:', res.statusCode, data);
              reject(new Error(`SendGrid returned status ${res.statusCode}: ${data}`));
            }
          });
        });
        
        req.on('error', (err) => {
          console.error('[Email] SendGrid request error:', err);
          reject(err);
        });
        
        req.on('timeout', () => {
          console.error('[Email] SendGrid request timeout');
          req.destroy();
          reject(new Error('SendGrid request timeout'));
        });
        
        req.write(emailData);
        req.end();
      });
      
      return true;
    } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      // SMTP email integration (Gmail, etc.)
      console.log('[Email] Using SMTP...');
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      
      await transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });
      
      console.log('[Email] ✓ Sent via SMTP to:', options.to);
      return true;
    } else {
      // Development mode - log to console
      console.log('=== EMAIL (No Email Service Configured) ===');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('--- HTML Preview ---');
      console.log(options.html.substring(0, 500) + '...');
      console.log('========================');
      console.warn('[Email] ⚠️  Configure SENDGRID_API_KEY or SMTP settings to send real emails');
      return true;
    }
  } catch (error) {
    console.error('[Email] ❌ FAILED to send email');
    console.error('[Email] Error details:', error);
    if (error && typeof error === 'object') {
      console.error('[Email] Error response:', (error as any).response?.body || (error as any).message);
    }
    return false;
  }
}

/**
 * Send loan application submitted notification
 */
export async function sendLoanApplicationSubmittedEmail(
  email: string,
  fullName: string,
  applicationId: number,
  referenceNumber: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #0033A0; color: white; text-decoration: none; border-radius: 4px; }
        .ref-box { background: #fff; border: 2px dashed #0033A0; padding: 15px; margin: 20px 0; text-align: center; }
        .ref-number { font-size: 24px; font-weight: bold; color: #0033A0; letter-spacing: 2px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="content">
          <h2>Loan Application Received</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for submitting your loan application. We have received your application and it is now under review.</p>
          
          <div class="ref-box">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Your Reference Number:</p>
            <p class="ref-number">${referenceNumber}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Save this number to track your application</p>
          </div>
          
          <p><strong>Application ID:</strong> #${applicationId}</p>
          <p>Our team will review your application and get back to you within 24-48 hours.</p>
          <p>You can track your application status anytime using your reference number at:</p>
          <p style="margin-top: 10px; margin-bottom: 30px;">
            <a href="${APP_URL}/track" style="color: #0033A0;">${APP_URL}/track</a>
          </p>
          <p style="margin-top: 30px;">
            <a href="${APP_URL}/dashboard" class="button">View Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>If you have any questions, please contact us at support@amerilendloan.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Loan Application Received - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nThank you for submitting your loan application (#${applicationId}). We have received your application and it is now under review.\n\nOur team will review your application and get back to you within 24-48 hours.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send loan approval notification
 */
export async function sendLoanApprovalEmail(
  email: string,
  fullName: string,
  applicationId: number,
  approvedAmount: number,
  processingFee: number
): Promise<boolean> {
  const approvedAmountFormatted = (approvedAmount / 100).toFixed(2);
  const processingFeeFormatted = (processingFee / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .congrats { background: #16a34a; color: white; padding: 15px; text-align: center; margin: 0; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 4px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="congrats">
          <h1 style="margin: 0;">🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <h2>Your Loan Has Been Approved</h2>
          <p>Dear ${fullName},</p>
          <p>Great news! Your loan application has been approved.</p>
          <div class="highlight">
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Approved Amount:</strong> $${approvedAmountFormatted}</p>
            <p><strong>Processing Fee:</strong> $${processingFeeFormatted}</p>
          </div>
          <h3>Next Steps:</h3>
          <ol>
            <li>Pay the processing fee of $${processingFeeFormatted}</li>
            <li>Once payment is confirmed, we will disburse the loan to your account</li>
            <li>Funds typically arrive within 1-2 business days</li>
          </ol>
          <p style="margin-top: 30px;">
            <a href="${APP_URL}/payment/${applicationId}" class="button">Pay Processing Fee</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>If you have any questions, please contact us at support@amerilendloan.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Loan Approved - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nGreat news! Your loan application (#${applicationId}) has been approved for $${approvedAmountFormatted}.\n\nProcessing Fee: $${processingFeeFormatted}\n\nPlease pay the processing fee to complete the process. Once payment is confirmed, we will disburse the loan to your account.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send loan rejection notification
 */
export async function sendLoanRejectionEmail(
  email: string,
  fullName: string,
  applicationId: number,
  rejectionReason: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="content">
          <h2>Loan Application Update</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for your interest in AmeriLend. Unfortunately, we are unable to approve your loan application at this time.</p>
          <p><strong>Application ID:</strong> #${applicationId}</p>
          <p><strong>Reason:</strong> ${rejectionReason}</p>
          <p>We encourage you to reapply in the future. If you have any questions about this decision, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>Questions? Contact us at support@amerilendloan.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Loan Application Update - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nThank you for your interest in AmeriLend. Unfortunately, we are unable to approve your loan application (#${applicationId}) at this time.\n\nReason: ${rejectionReason}\n\nWe encourage you to reapply in the future.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send payment confirmation notification
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  fullName: string,
  applicationId: number,
  amount: number,
  paymentMethod: string
): Promise<boolean> {
  const amountFormatted = (amount / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .success { background: #16a34a; color: white; padding: 15px; text-align: center; margin: 0; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .receipt { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="success">
          <h1 style="margin: 0;">✅ Payment Confirmed</h1>
        </div>
        </div>
        <div class="content">
          <h2>Payment Received</h2>
          <p>Dear ${fullName},</p>
          <p>We have successfully received your payment. Your loan is now being prepared for disbursement.</p>
          <div class="receipt">
            <h3>Payment Details</h3>
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Amount Paid:</strong> $${amountFormatted}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <h3>Next Steps:</h3>
          <p>Your loan will be disbursed to your account within 1-2 business days. You will receive a notification once the funds have been sent.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>Questions? Contact us at support@amerilendloan.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Payment Confirmed - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nWe have successfully received your payment of $${amountFormatted} for loan application #${applicationId}.\n\nYour loan will be disbursed to your account within 1-2 business days.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send loan disbursement notification
 */
export async function sendLoanDisbursementEmail(
  email: string,
  fullName: string,
  applicationId: number,
  amount: number,
  accountLast4: string
): Promise<boolean> {
  const amountFormatted = (amount / 100).toFixed(2);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .success { background: #16a34a; color: white; padding: 15px; text-align: center; margin: 0; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .highlight { background: #d1fae5; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="success">
          <h1>🎉 Funds Disbursed!</h1>
        </div>
        <div class="content">
          <h2>Your Loan Has Been Disbursed</h2>
          <p>Dear ${fullName},</p>
          <p>Great news! Your loan has been successfully disbursed.</p>
          <div class="highlight">
            <p><strong>Application ID:</strong> #${applicationId}</p>
            <p><strong>Amount Disbursed:</strong> $${amountFormatted}</p>
            <p><strong>Account Ending in:</strong> ****${accountLast4}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>The funds should appear in your account within 1-2 business days, depending on your bank's processing time.</p>
          <p><strong>Important:</strong> Please remember that this is a loan that must be repaid according to the terms in your loan agreement.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>Questions? Contact us at support@amerilendloan.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Loan Disbursed - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nYour loan has been successfully disbursed!\n\nAmount: $${amountFormatted}\nAccount ending in: ****${accountLast4}\n\nThe funds should appear in your account within 1-2 business days.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send ID verification rejection notification with request for more documents
 */
export async function sendIDVerificationRejectionEmail(
  email: string,
  fullName: string,
  applicationId: number,
  referenceNumber: string,
  rejectionReason: string,
  uploadUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .warning { background: #f59e0b; color: white; padding: 15px; text-align: center; margin: 0; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #d97706; }
        .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="warning">
          <h1 style="margin: 0;">⚠️ Additional Documents Required</h1>
        </div>
        <div class="content">
          <h2>ID Verification Update</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for submitting your ID documents for verification. We need additional information to proceed with your loan application.</p>
          
          <div class="info-box">
            <p><strong>Application Reference:</strong> ${referenceNumber}</p>
            <p><strong>Application ID:</strong> #${applicationId}</p>
          </div>

          <div class="reason-box">
            <h3 style="margin-top: 0; color: #92400e;">📋 What We Need:</h3>
            <p style="margin-bottom: 0;">${rejectionReason}</p>
          </div>

          <h3>Next Steps:</h3>
          <ol>
            <li>Review the requirements above carefully</li>
            <li>Prepare clear, high-quality images of your documents</li>
            <li>Click the button below to upload new documents</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${uploadUrl}" class="button">📤 Upload Documents Now</a>
          </div>

          <h3>Tips for Better Photos:</h3>
          <ul>
            <li>✓ Use good lighting and avoid shadows</li>
            <li>✓ Make sure all text is clearly readable</li>
            <li>✓ Avoid glare or reflections</li>
            <li>✓ Capture the entire document in the frame</li>
            <li>✓ Hold your ID steady when taking selfie</li>
          </ul>

          <p><strong>Need Help?</strong> If you have any questions, please contact our support team at support@amerilendloan.com or reply to this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '⚠️ Additional Documents Required - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nWe need additional documents for your loan application (${referenceNumber}).\n\nReason: ${rejectionReason}\n\nPlease upload new documents at: ${uploadUrl}\n\nTips:\n- Use good lighting\n- Ensure all text is readable\n- Avoid glare or shadows\n- Capture the entire document\n\nIf you have questions, contact us at support@amerilendloan.com\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send ID verification approval notification
 */
export async function sendIDVerificationApprovalEmail(
  email: string,
  fullName: string,
  applicationId: number,
  referenceNumber: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .success { background: #16a34a; color: white; padding: 15px; text-align: center; margin: 0; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .success-box { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
        .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="success">
          <h1 style="margin: 0;">✅ ID Verified Successfully</h1>
        </div>
        </div>
        <div class="content">
          <h2>Identity Verification Complete</h2>
          <p>Dear ${fullName},</p>
          
          <div class="success-box">
            <h3 style="margin-top: 0; color: #166534;">🎉 Great News!</h3>
            <p style="margin-bottom: 0;">Your identity has been successfully verified. Your loan application is now being processed.</p>
          </div>

          <div class="info-box">
            <p><strong>Application Reference:</strong> ${referenceNumber}</p>
            <p><strong>Application ID:</strong> #${applicationId}</p>
          </div>

          <h3>What Happens Next?</h3>
          <ol>
            <li>Our team will review your loan application</li>
            <li>You'll receive an email once a decision has been made</li>
            <li>If approved, you'll need to pay the processing fee</li>
            <li>Funds will be disbursed to your account after payment</li>
          </ol>

          <p><strong>Questions?</strong> Contact us at support@amerilendloan.com</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>Track your application status at any time by logging into your dashboard.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ ID Verified - AmeriLend',
    html,
    text: `Dear ${fullName},\n\nGreat news! Your identity has been successfully verified for application ${referenceNumber}.\n\nWhat's next:\n1. Our team will review your loan application\n2. You'll receive an email once a decision has been made\n3. If approved, you'll need to pay the processing fee\n4. Funds will be disbursed after payment\n\nQuestions? Contact us at support@amerilendloan.com\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * Send profile update confirmation email
 */
export async function sendProfileUpdateEmail(
  email: string,
  fullName: string,
  changedFields: Record<string, { old: any; new: any }>
): Promise<boolean> {
  // Build the changes list HTML
  let changesHtml = '<ul style="list-style: none; padding: 0;">';
  for (const [field, values] of Object.entries(changedFields)) {
    const fieldLabel = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    changesHtml += `
      <li style="padding: 8px; background: #f3f4f6; margin: 8px 0; border-radius: 4px; border-left: 3px solid #0033A0;">
        <strong>${fieldLabel}:</strong><br/>
        <span style="color: #666; text-decoration: line-through;">Old: ${escapeHtml(String(values.old))}</span><br/>
        <span style="color: #16a34a;">✓ New: ${escapeHtml(String(values.new))}</span>
      </li>
    `;
  }
  changesHtml += '</ul>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header img { max-width: 200px; height: auto; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .info-box { background: #dbeafe; border-left: 4px solid #0033A0; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${APP_URL}/new-logo-final.png" alt="AmeriLend Logo" />
        </div>
        <div class="content">
          <h2>Profile Information Updated</h2>
          <p>Dear ${escapeHtml(fullName)},</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e40af;">📝 Account Update Confirmation</h3>
            <p style="margin-bottom: 0;">Your account information has been successfully updated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
          </div>

          <h3>Changes Made:</h3>
          ${changesHtml}

          <div class="security-note">
            <strong>🔒 Security Notice:</strong> If you did not make these changes or do not recognize this activity, please contact our support team immediately at support@amerilendloan.com.
          </div>

          <h3>Next Steps</h3>
          <p>No action is required from you. Your updated information has been saved and will be used for your future interactions with AmeriLend.</p>

          <p style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
            <strong>Need Help?</strong><br/>
            If you have any questions or need to make additional changes, please contact our support team at support@amerilendloan.com or log into your dashboard to manage your account.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textChanges = Object.entries(changedFields)
    .map(([field, values]) => `${field}: ${values.old} → ${values.new}`)
    .join('\n');

  return sendEmail({
    to: email,
    subject: '✅ Profile Updated - AmeriLend Account',
    html,
    text: `Dear ${fullName},\n\nYour profile has been successfully updated on ${new Date().toLocaleDateString()}.\n\nChanges Made:\n${textChanges}\n\nIf you did not make these changes, please contact support@amerilendloan.com immediately.\n\nBest regards,\nAmeriLend Team`,
  });
}

/**
 * HTML escape helper for email content
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

