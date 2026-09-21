import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url), quiet: true });

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Configure server/.env first.');
}

export const env = {
  port,
  mongodbUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
