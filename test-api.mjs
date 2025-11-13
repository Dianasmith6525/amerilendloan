import fetch from 'node-fetch';

const url = 'https://localhost:3000/api/trpc/auth.me?input=%7B%7D';

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    agent: new (await import('https')).Agent({
      rejectUnauthorized: false
    })
  });

  const text = await response.text();
  console.log('Response status:', response.status);
  console.log('Response body:', text.substring(0, 200));

} catch (error) {
  console.error('Error:', error.message);
}
