import mongoose from 'mongoose';
import { env } from './env.js';

// A container can reach the network before DNS and TLS are ready, so a first
// attempt may fail on a host that is perfectly reachable a moment later.
const ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms).unref(); });

export async function connectDB() {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 15000 });
      console.log(`MongoDB connected (${env.mongodbTarget}: ${mongoose.connection.name})`);
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${ATTEMPTS} failed: ${error.name} — ${error.message}`);
      if (attempt === ATTEMPTS) throw error;
      await wait(RETRY_DELAY_MS);
    }
  }
}
