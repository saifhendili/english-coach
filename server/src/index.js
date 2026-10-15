import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';

// The usual first-deploy problem is a database the server cannot reach: say so plainly instead of a stack trace.
try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15000 });
} catch (err) {
  console.error(`Could not connect to MongoDB: ${err.message}`);
  console.error('Check MONGODB_URI (user, password, database name) and, on MongoDB Atlas, Network Access (allow 0.0.0.0/0).');
  process.exit(1);
}
console.log('MongoDB connected');

const server = createApp().listen(config.port, () => {
  console.log(`API listening on port ${config.port} (http://localhost:${config.port}/api)`);
});

// Hosts stop a server with SIGTERM when they deploy a new version: finish the requests in progress, then leave.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
