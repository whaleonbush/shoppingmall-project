import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(configDir, '..', '.env') });

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/shopping-mall';

/**
 * Connects to MongoDB using MONGODB_URI from .env / process.env, or a local default if unset.
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDb() {
  const fromEnv = process.env.MONGODB_URI?.trim();
  const uri = fromEnv || DEFAULT_MONGODB_URI;

  if (!fromEnv) {
    console.info(
      `[db] MONGODB_URI not set; using local default (${DEFAULT_MONGODB_URI}). Set MONGODB_URI in .env to override.`
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose;
}
