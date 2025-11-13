import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking Authorize.Net Configuration...\n');

console.log('Environment Variables:');
console.log('  AUTHORIZENET_API_LOGIN_ID:', process.env.AUTHORIZENET_API_LOGIN_ID ? `✅ ${process.env.AUTHORIZENET_API_LOGIN_ID}` : '❌ Not set');
console.log('  AUTHORIZENET_TRANSACTION_KEY:', process.env.AUTHORIZENET_TRANSACTION_KEY ? `✅ ${process.env.AUTHORIZENET_TRANSACTION_KEY.slice(0, 4)}...` : '❌ Not set');
console.log('  AUTHORIZENET_CLIENT_KEY:', process.env.AUTHORIZENET_CLIENT_KEY ? `✅ ${process.env.AUTHORIZENET_CLIENT_KEY.slice(0, 10)}...` : '❌ Not set');
console.log('  AUTHORIZENET_ENVIRONMENT:', process.env.AUTHORIZENET_ENVIRONMENT || '❌ Not set (defaulting to sandbox)');
console.log();

// Test API credentials
console.log('📡 Testing Authorize.Net API Connection...\n');

const endpoint = process.env.AUTHORIZENET_ENVIRONMENT === 'production' 
  ? 'https://api.authorize.net/xml/v1/request.api'
  : 'https://apitest.authorize.net/xml/v1/request.api';

console.log('Using endpoint:', endpoint);

const testRequest = {
  getMerchantDetailsRequest: {
    merchantAuthentication: {
      name: process.env.AUTHORIZENET_API_LOGIN_ID,
      transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY
    }
  }
};

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testRequest)
  });

  const data = await response.json();
  
  console.log('\nAPI Response:');
  console.log('  Result Code:', data.messages?.resultCode);
  
  if (data.messages?.resultCode === 'Ok') {
    console.log('  ✅ Authentication successful!');
  } else {
    console.log('  ❌ Authentication failed!');
    console.log('  Error:', data.messages?.message?.[0]?.text || 'Unknown error');
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}
