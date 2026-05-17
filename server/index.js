import './loadEnv.js';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDb } from './config/db.js';

const port = Number(process.env.PORT) || 4000;

/** @type {import('http').Server | undefined} */
let server;

async function shutdown(signal) {
  console.info(`\n${signal} received, closing…`);
  await new Promise((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

async function main() {
  await connectDb();
  console.info('MongoDB connected');

  server = app.listen(port, () => {
    console.info(`Server listening on http://localhost:${port}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  server.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
