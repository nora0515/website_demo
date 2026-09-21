import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url), quiet: true });

// Configuration problems are collected rather than thrown. Throwing here kills
// the process before it can say anything a reader will see: on a container host
// that just looks like a restart loop. Instead the server starts, logs what is
// wrong, and reports it from /api/health, while the routes that need the
// missing setting keep refusing to work.
const problems = [];

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  problems.push('PORT must be an integer between 1 and 65535');
}

// Filled in to use Atlas; left empty to stay on the local MongoDB.
const atlasUri = (process.env.MONGODB_ATLAS_URI || '').trim();
const mongodbUri = atlasUri || process.env.MONGODB_URI || '';
if (!mongodbUri) {
  problems.push('MONGODB_ATLAS_URI or MONGODB_URI is required');
}
if (atlasUri.includes('<db_password>')) {
  problems.push('MONGODB_ATLAS_URI still contains the <db_password> placeholder');
}

// A short secret makes signed tokens guessable.
if (!process.env.JWT_SECRET) {
  problems.push('JWT_SECRET is required');
} else if (process.env.JWT_SECRET.length < 32) {
  problems.push('JWT_SECRET must be at least 32 characters');
}

export const env = {
  port: Number.isInteger(port) ? port : 5000,
  mongodbUri,
  // Lets the startup log say which database it connected to, without printing
  // the connection string and its password.
  mongodbTarget: atlasUri ? 'Atlas' : 'local',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  // Optional: without these the payment routes answer 503.
  impApiKey: process.env.IMP_API_KEY || '',
  impApiSecret: process.env.IMP_API_SECRET || '',
  // Names of what is wrong, never values.
  problems,
};
