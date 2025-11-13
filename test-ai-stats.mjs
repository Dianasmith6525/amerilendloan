import fetch from 'node-fetch';

console.log('Testing AI & Automation Stats API...\n');

try {
  // Note: We need to be logged in as admin to access this endpoint
  // For now, let's just check if the server responds
  const response = await fetch('http://localhost:3000/api/trpc/loans.getAIAutomationStats');
  
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers.raw());
  
  const data = await response.text();
  console.log('\nResponse data:', data);
  
  if (response.status === 200) {
    console.log('\n✅ API endpoint is accessible!');
  } else if (response.status === 401) {
    console.log('\n⚠️ API requires authentication (expected for admin endpoint)');
  } else {
    console.log('\n❌ Unexpected response status');
  }
} catch (error) {
  console.error('❌ Error testing API:', error);
}
