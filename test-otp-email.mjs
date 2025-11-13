import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@amerilendloan.com';

console.log('=== Testing OTP Email Send ===');
console.log('API Key present:', !!SENDGRID_API_KEY);
console.log('From address:', EMAIL_FROM);
console.log('');

if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY not configured');
  process.exit(1);
}

const testCode = '123456';
const testEmailData = JSON.stringify({
  personalizations: [
    {
      to: [{ email: 'dianasmith7482@gmail.com' }]
    }
  ],
  from: {
    email: EMAIL_FROM,
    name: 'AmeriLend',
  },
  subject: 'Your AmeriLend Sign Up Verification Code',
  content: [
    {
      type: 'text/plain',
      value: `Your verification code is: ${testCode}. This code will expire in 10 minutes.`
    },
    {
      type: 'text/html',
      value: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
        .header h1 { color: #0033A0; margin: 0; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .code { font-size: 32px; font-weight: bold; color: #0033A0; text-align: center; letter-spacing: 5px; padding: 20px; background: white; border: 2px dashed #0033A0; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AmeriLend</h1>
        </div>
        <div class="content">
          <h2>Your Verification Code</h2>
          <p>Hello,</p>
          <p>You requested a verification code to create your account.</p>
          <div class="code">${testCode}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 AmeriLend. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
      `
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
    'Content-Length': Buffer.byteLength(testEmailData)
  },
  timeout: 10000
};

console.log('Sending OTP test email...');
console.log('');

const req = https.request(requestOptions, (res) => {
  let data = '';
  
  console.log('Response Status Code:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 202) {
      console.log('✅ SUCCESS! OTP Email was accepted by SendGrid');
      console.log('Message ID:', res.headers['x-message-id']);
      console.log('');
      console.log('📧 OTP email sent to dianasmith7482@gmail.com');
      console.log('Code: 123456');
    } else if (res.statusCode === 401) {
      console.log('❌ ERROR: Unauthorized (Status 401)');
      console.log('API key is invalid or expired');
    } else {
      console.log('❌ Unexpected status:', res.statusCode);
      if (data) {
        try {
          const error = JSON.parse(data);
          console.log('Error:', JSON.stringify(error, null, 2));
        } catch (e) {
          console.log('Response:', data);
        }
      }
    }
    process.exit(res.statusCode === 202 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('❌ Request Error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request Timeout');
  req.destroy();
  process.exit(1);
});

req.write(testEmailData);
req.end();
