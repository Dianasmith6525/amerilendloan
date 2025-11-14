#!/usr/bin/env node

/**
 * Deployment health check script
 * Tests if the deployed application is responding correctly
 */

async function checkDeployment() {
  const BASE_URL = 'https://www.amerilendloan.com';
  
  console.log('🔍 Checking deployment health...\n');
  
  // 1. Check if site is accessible
  console.log('1. Testing site accessibility...');
  try {
    const response = await fetch(BASE_URL);
    console.log(`   ✅ Site is accessible (Status: ${response.status})`);
  } catch (error) {
    console.log(`   ❌ Site is not accessible: ${error.message}`);
    return;
  }
  
  // 2. Check API health endpoint
  console.log('\n2. Testing API health...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ API is responding:`, data);
    } else {
      console.log(`   ⚠️  API returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ⚠️  API health check failed: ${error.message}`);
  }
  
  // 3. Check if tRPC endpoints are accessible
  console.log('\n3. Testing tRPC endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/trpc/auth.login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    console.log(`   ✅ tRPC endpoint is accessible (Status: ${response.status})`);
    const text = await response.text();
    console.log(`   Response preview: ${text.substring(0, 200)}`);
  } catch (error) {
    console.log(`   ❌ tRPC endpoint error: ${error.message}`);
  }
  
  console.log('\n✅ Deployment check complete!');
}

checkDeployment().catch(console.error);
