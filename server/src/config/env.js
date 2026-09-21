import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url), quiet: true });

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
// Filled in to use Atlas; left empty to stay on the local MongoDB.
const atlasUri = (process.env.MONGODB_ATLAS_URI || '').trim();
const mongodbUri = atlasUri || process.env.MONGODB_URI;
if (!mongodbUri) {
  throw new Error('MONGODB_URI is required. Configure server/.env first.');
}
if (atlasUri.includes('<db_password>')) {
  throw new Error('MONGODB_ATLAS_URI still has the <db_password> placeholder. Replace it with the real password.');
}
// A short secret makes signed tokens guessable, so refuse to start without a real one.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is required and must be at least 32 characters. Configure server/.env first.');
}

export const env = {
  port,
  mongodbUri,
  // Lets the startup log say which database it connected to, without printing
  // the connection string and its password.
  mongodbTarget: atlasUri ? 'Atlas' : 'local',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  // Optional: without these the payment routes answer 503 instead of failing
  // at startup, so the rest of the app still runs.
  impApiKey: process.env.IMP_API_KEY || '',
  impApiSecret: process.env.IMP_API_SECRET || '',
};
