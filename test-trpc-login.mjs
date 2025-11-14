import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  try {
    console.log("Testing login via tRPC...");
    
    // Test the login endpoint
    const response = await fetch('https://localhost:3000/trpc/auth.login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          email: 'diana@amerilendloan.com',
          password: 'Admin123!'
        }
      }),
      // For self-signed certificates
      rejectUnauthorized: false
    });
    
    console.log(`Response status: ${response.status}`);
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const text = await response.text();
    console.log(`Response body: ${text.substring(0, 500)}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log("\n✓ Login successful!");
        console.log("Response data:", JSON.stringify(data, null, 2));
      } catch (e) {
        console.log("Could not parse JSON response");
      }
    } else {
      console.log("\n❌ Login failed!");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testLogin();
