import https from 'https';
import http from 'http';

console.log('=== Network Connectivity Test ===\n');

// Test 1: Basic HTTPS request to Google (control test)
console.log('1. Testing HTTPS to Google...');
https.get('https://www.google.com', (res) => {
  console.log('   ✅ Google reachable (Status:', res.statusCode, ')');
  testSendGrid();
}).on('error', (err) => {
  console.log('   ❌ Cannot reach Google:', err.message);
  console.log('   🔴 No internet connection or severe network restrictions');
  testSendGrid();
});

// Test 2: HTTPS request to SendGrid
function testSendGrid() {
  console.log('\n2. Testing HTTPS to SendGrid API...');
  
  const options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: '/v3/mail/send',
    method: 'GET',
    timeout: 5000
  };

  const req = https.request(options, (res) => {
    console.log('   ✅ SendGrid reachable (Status:', res.statusCode, ')');
    console.log('   ℹ️  Your network can reach SendGrid!');
    testDNS();
  });

  req.on('error', (err) => {
    console.log('   ❌ Cannot reach SendGrid:', err.message);
    console.log('   📋 Error code:', err.code);
    
    if (err.code === 'ENOTFOUND') {
      console.log('   🔴 DNS resolution failed');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.log('   🔴 Connection blocked by firewall/antivirus');
      console.log('\n   Possible solutions:');
      console.log('   - Temporarily disable antivirus/firewall');
      console.log('   - Check if you\'re on a corporate network');
      console.log('   - Try from a different network (mobile hotspot)');
    }
    testDNS();
  });

  req.on('timeout', () => {
    console.log('   ❌ Connection timeout');
    console.log('   🔴 Network is blocking the connection');
    req.destroy();
    testDNS();
  });

  req.end();
}

// Test 3: DNS resolution
function testDNS() {
  console.log('\n3. Testing DNS resolution...');
  import('dns').then(dns => {
    dns.promises.lookup('api.sendgrid.com').then(result => {
      console.log('   ✅ DNS works! IP:', result.address);
      checkProxy();
    }).catch(err => {
      console.log('   ❌ DNS failed:', err.message);
      checkProxy();
    });
  });
}

// Test 4: Check for proxy settings
function checkProxy() {
  console.log('\n4. Checking proxy settings...');
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  if (httpProxy || httpsProxy) {
    console.log('   ⚠️  Proxy detected:');
    if (httpProxy) console.log('      HTTP_PROXY:', httpProxy);
    if (httpsProxy) console.log('      HTTPS_PROXY:', httpsProxy);
    console.log('   💡 Try: unset HTTP_PROXY and HTTPS_PROXY');
  } else {
    console.log('   ✅ No proxy configured');
  }
  
  printSummary();
}

function printSummary() {
  console.log('\n=== Summary ===');
  console.log('If SendGrid is unreachable but Google works:');
  console.log('  → Your antivirus/firewall is blocking SendGrid');
  console.log('  → Try adding Node.js to firewall exceptions');
  console.log('  → Or use a different network (mobile hotspot)');
  console.log('\nIf both are unreachable:');
  console.log('  → Check your internet connection');
  console.log('  → Try restarting your router');
}
