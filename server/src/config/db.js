import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected (${env.mongodbTarget}: ${mongoose.connection.name})`);
}
