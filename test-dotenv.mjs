import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath, debug: true });

if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('Successfully loaded .env');
  console.log('Parsed:', result.parsed);
}

console.log('\nProcess env:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'LOADED' : 'NOT LOADED');
console.log('OAUTH_SERVER_URL:', process.env.OAUTH_SERVER_URL ? 'LOADED' : 'NOT LOADED');
console.log('NODE_ENV:', process.env.NODE_ENV);
