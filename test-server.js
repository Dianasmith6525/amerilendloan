console.log('Starting test server...');

import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

setInterval(() => {
  console.log('Keepalive ping');
}, 5000);

console.log('Script finished');
