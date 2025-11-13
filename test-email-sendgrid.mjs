import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@amerilendloan.com';

console.log('=== SendGrid Email Test ===');
console.log('API Key present:', !!SENDGRID_API_KEY);
if (SENDGRID_API_KEY) {
  console.log('API Key (first 10 chars):', SENDGRID_API_KEY.substring(0, 10) + '...');
  console.log('API Key length:', SENDGRID_API_KEY.length);
}
console.log('From address:', EMAIL_FROM);
console.log('');

if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY not configured');
  process.exit(1);
}

const testEmailData = JSON.stringify({
  personalizations: [
    {
      to: [{ email: 'test@amerilendloan.com' }]
    }
  ],
  from: {
    email: EMAIL_FROM,
    name: 'AmeriLend Test',
  },
  subject: 'Test Email from AmeriLend',
  content: [
    {
      type: 'text/plain',
      value: 'This is a test email'
    },
    {
      type: 'text/html',
      value: '<h1>Test Email</h1><p>This is a test email from AmeriLend</p>'
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

console.log('Sending test email...');
console.log('Host:', requestOptions.hostname);
console.log('Path:', requestOptions.path);
console.log('');

const req = https.request(requestOptions, (res) => {
  let data = '';
  
  console.log('Response Status Code:', res.statusCode);
  console.log('Response Headers:', res.headers);
  console.log('');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    console.log('');
    
    if (res.statusCode === 202) {
      console.log('✅ SUCCESS! Email was accepted by SendGrid (Status 202)');
    } else if (res.statusCode === 400) {
      console.log('❌ ERROR: Bad Request (Status 400)');
      console.log('This usually means the request format is invalid');
      if (data) {
        try {
          const error = JSON.parse(data);
          console.log('Error details:', JSON.stringify(error, null, 2));
        } catch (e) {
          console.log('Raw error:', data);
        }
      }
    } else if (res.statusCode === 401) {
      console.log('❌ ERROR: Unauthorized (Status 401)');
      console.log('Check your API key - it may be invalid or expired');
    } else if (res.statusCode === 403) {
      console.log('❌ ERROR: Forbidden (Status 403)');
      console.log('Your API key may not have permission to send emails');
    } else {
      console.log('⚠️  Unexpected status code:', res.statusCode);
      if (data) {
        try {
          const error = JSON.parse(data);
          console.log('Error details:', JSON.stringify(error, null, 2));
        } catch (e) {
          console.log('Raw error:', data);
        }
      }
    }
    process.exit(res.statusCode === 202 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('❌ Request Error:', err.message);
  console.error('Error Code:', err.code);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request Timeout');
  req.destroy();
  process.exit(1);
});

req.write(testEmailData);
req.end();
