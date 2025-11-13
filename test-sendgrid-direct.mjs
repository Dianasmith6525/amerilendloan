import 'dotenv/config';
import https from 'https';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@amerilendloan.com';

console.log('=== SendGrid API Direct Test ===\n');
console.log('API Key present:', !!SENDGRID_API_KEY);
console.log('From address:', EMAIL_FROM);
console.log('\nSending test email via raw HTTPS...\n');

const emailData = JSON.stringify({
  personalizations: [
    {
      to: [{ email: 'test@example.com' }]
    }
  ],
  from: {
    email: EMAIL_FROM,
    name: 'AmeriLend'
  },
  subject: 'Test Email from Direct HTTPS',
  content: [
    {
      type: 'text/plain',
      value: 'This is a test email sent directly via HTTPS (not using SendGrid library)'
    }
  ]
});

const options = {
  hostname: 'api.sendgrid.com',
  port: 443,
  path: '/v3/mail/send',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(emailData)
  },
  timeout: 10000 // 10 second timeout
};

const req = https.request(options, (res) => {
  console.log('✅ Response received');
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 202) {
      console.log('\n🎉 SUCCESS! Email sent via direct HTTPS');
      console.log('✅ SendGrid is working, the @sendgrid/mail library might be the issue');
    } else {
      console.log('\n❌ Error Response:', data);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Request failed:', err.message);
  console.log('Error code:', err.code);
  
  if (err.code === 'ENOTFOUND') {
    console.log('\n🔴 DNS issue - Cannot find api.sendgrid.com');
  } else if (err.code === 'ETIMEDOUT') {
    console.log('\n🔴 Timeout - Firewall or network blocking connection');
  } else if (err.code === 'ECONNRESET') {
    console.log('\n🔴 Connection reset - Antivirus or firewall interference');
  }
});

req.on('timeout', () => {
  console.log('❌ Request timeout after 10 seconds');
  console.log('🔴 Your firewall/antivirus is blocking the connection');
  req.destroy();
});

req.write(emailData);
req.end();
