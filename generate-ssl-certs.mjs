import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const { pki } = forge;

// Create certs directory if it doesn't exist
const certsDir = path.join(process.cwd(), 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Generate a key pair
console.log('Generating SSL key pair...');
const keys = pki.rsa.generateKeyPair(2048);

// Create a certificate
console.log('Creating self-signed certificate...');
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
  name: 'commonName',
  value: 'localhost'
}, {
  name: 'countryName',
  value: 'US'
}, {
  shortName: 'ST',
  value: 'State'
}, {
  name: 'localityName',
  value: 'City'
}, {
  name: 'organizationName',
  value: 'Development'
}, {
  shortName: 'OU',
  value: 'Dev'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'extKeyUsage',
  serverAuth: true,
  clientAuth: true,
  codeSigning: true,
  emailProtection: true,
  timeStamping: true
}, {
  name: 'nsCertType',
  client: true,
  server: true,
  email: true,
  objsign: true,
  sslCA: true,
  emailCA: true,
  objCA: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 2, // DNS
    value: 'localhost'
  }, {
    type: 7, // IP
    ip: '127.0.0.1'
  }]
}]);

// Self-sign certificate
cert.sign(keys.privateKey);

// Convert to PEM format
const pemCert = pki.certificateToPem(cert);
const pemKey = pki.privateKeyToPem(keys.privateKey);

// Write files
const certPath = path.join(certsDir, 'cert.pem');
const keyPath = path.join(certsDir, 'key.pem');

fs.writeFileSync(certPath, pemCert);
fs.writeFileSync(keyPath, pemKey);

console.log('✅ SSL certificates generated successfully!');
console.log(`Certificate: ${certPath}`);
console.log(`Private Key: ${keyPath}`);
console.log('\n⚠️  Note: These are self-signed certificates for development only.');
console.log('Your browser will show a security warning - this is expected and safe to proceed.');
