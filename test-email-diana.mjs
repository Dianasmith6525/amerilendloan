import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@amerilendloan.com';

console.log('=== Sending Email to dianasmith7482@gmail.com ===');
console.log('API Key present:', !!SENDGRID_API_KEY);
console.log('From address:', EMAIL_FROM);
console.log('');

if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY not configured');
  process.exit(1);
}

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
  subject: 'Test Email from AmeriLend - Please Confirm Receipt',
  content: [
    {
      type: 'text/plain',
      value: 'This is a test email from AmeriLend. If you received this, email is working correctly.'
    },
    {
      type: 'text/html',
      value: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h1 style="color: #333;">AmeriLend Test Email</h1>
            <p>Hello Diana,</p>
            <p>This is a test email from AmeriLend sent at ${new Date().toISOString()}.</p>
            <p>If you received this, email notifications are working correctly!</p>
            <p><strong>Message ID:</strong> ${Math.random().toString(36).substring(7)}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">This is an automated test email.</p>
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

console.log('Sending email to dianasmith7482@gmail.com...');
console.log('');

const req = https.request(requestOptions, (res) => {
  let data = '';
  
  console.log('Response Status Code:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 202) {
      console.log('✅ SUCCESS! Email was accepted by SendGrid');
      console.log('Message ID:', res.headers['x-message-id']);
      console.log('');
      console.log('📧 Email should arrive in dianasmith7482@gmail.com shortly.');
      console.log('Check:');
      console.log('  1. Inbox');
      console.log('  2. Spam/Junk folder');
      console.log('  3. Promotions tab (if using Gmail)');
      console.log('');
      console.log('If email does not arrive:');
      console.log('  - The sender domain (amerilendloan.com) may not be verified with SendGrid');
      console.log('  - Check SendGrid dashboard > Sender Authentication');
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
