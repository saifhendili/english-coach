import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import { decrypt } from '../services/crypto.js';
import { AppError } from './errors.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '30d' });
}

// Loads the user onto req.user.
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Sign in required');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Session expired, sign in again');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Account no longer exists');
  req.user = user;
  next();
}

// For any route that calls Gemini: decrypts the key onto req.geminiKey,
// or answers 412 KEY_MISSING so the client can redirect to Settings.
export function requireGeminiKey(req, _res, next) {
  if (!req.user.geminiKeyEnc) {
    throw new AppError(412, 'KEY_MISSING', 'Add your Gemini API key in Settings first.');
  }
  try {
    req.geminiKey = decrypt(req.user.geminiKeyEnc);
  } catch {
    // ENCRYPTION_KEY changed or data corrupted: treat as missing.
    throw new AppError(412, 'KEY_MISSING', 'Your saved key could not be read. Please enter it again.');
  }
  next();
}
