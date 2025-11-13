import dotenv from 'dotenv';
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@em2908.www.amerilendloan.com';

console.log('=== SendGrid Email Test ===');
console.log('API Key present:', !!SENDGRID_API_KEY);
console.log('API Key (first 10 chars):', SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'MISSING');
console.log('From address:', EMAIL_FROM);
console.log('');

if (!SENDGRID_API_KEY) {
  console.error('❌ ERROR: SENDGRID_API_KEY not found in .env file');
  console.log('Please add to your .env file:');
  console.log('SENDGRID_API_KEY=SG.your-api-key-here');
  console.log('EMAIL_FROM=noreply@em2908.www.amerilendloan.com');
  process.exit(1);
}

async function testEmail() {
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(SENDGRID_API_KEY);

    const msg = {
      to: 'test@example.com', // Change this to your email to receive the test
      from: {
        email: EMAIL_FROM,
        name: 'AmeriLend Test'
      },
      subject: 'SendGrid Test Email',
      text: 'This is a test email from AmeriLend',
      html: '<strong>This is a test email from AmeriLend</strong>',
    };

    console.log('Sending test email to:', msg.to);
    console.log('From:', msg.from.email);
    console.log('');

    await sgMail.default.send(msg);
    
    console.log('✅ SUCCESS! Email sent successfully');
    console.log('Check your inbox at:', msg.to);
  } catch (error) {
    console.error('❌ FAILED to send email');
    console.error('');
    console.error('Error details:');
    console.error(error);
    
    if (error.response) {
      console.error('');
      console.error('SendGrid Response:');
      console.error(error.response.body);
    }
    
    console.error('');
    console.error('Common issues:');
    console.error('1. Wrong API key');
    console.error('2. Email address not verified in SendGrid');
    console.error('3. Domain not authenticated properly');
    console.error('4. Sender email domain mismatch');
  }
}

testEmail();
