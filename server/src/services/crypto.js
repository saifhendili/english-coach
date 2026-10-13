import crypto from 'node:crypto';
import { config } from '../config.js';

// AES-256-GCM. Stored as "iv.tag.ciphertext" (base64 parts).
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', config.encryptionKey, iv);
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload) {
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', config.encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// "AIzaSyD...x9Fq" — enough to recognise the key, never enough to use it.
export function maskKey(key) {
  if (key.length <= 10) return '••••';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
