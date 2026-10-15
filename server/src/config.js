import { parseTrustProxy } from './services/trust-proxy.js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} (see server/.env.example)`);
  return value;
}

const encryptionKey = required('ENCRYPTION_KEY');
if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
  throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes): openssl rand -hex 32');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  // Reverse proxies in front of the server: 1 on Render, 0 (the default) when it is reached directly.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  encryptionKey: Buffer.from(encryptionKey, 'hex'),
  // Browser origins allowed to call the API directly (comma separated). The web app goes through its own
  // dev proxy and the phone app is not a browser, so this only matters for a web build served elsewhere.
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5180').split(',').map((o) => o.trim()).filter(Boolean),
};
