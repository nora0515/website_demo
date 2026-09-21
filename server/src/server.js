import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

// Listen before connecting to the database. A platform that waits for the port
// to open would otherwise kill the container while it is still dialling, and a
// database that is briefly unreachable would take the whole service down
// instead of showing up in /api/health.
if (env.problems.length > 0) {
  console.error('Configuration problems:');
  for (const problem of env.problems) console.error(`  - ${problem}`);
  console.error('The server will start, but requests needing these will fail.');
}

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

server.on('error', (error) => {
  console.error('HTTP server failed:', error.code || error.name);
  process.exitCode = 1;
});

connectDB().catch((error) => {
  console.error('Database unavailable:', error.name, '-', error.message);
  console.error('The API is up but every request needing data will fail.');
  console.error('Check MONGODB_ATLAS_URI (or MONGODB_URI) and the database\'s IP access list.');
});

let stopping = false;
const shutdown = () => {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    await mongoose.disconnect();
    clearTimeout(timeout);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
