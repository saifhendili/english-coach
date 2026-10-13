import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { signToken } from '../middleware/auth.js';
import { User } from '../models/User.js';

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export async function register(req, res) {
  const { email, password } = credentials.parse(req.body);
  if (await User.exists({ email: email.toLowerCase() })) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }
  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
}

export async function login(req, res) {
  const { email, password } = credentials.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  // Same error for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'BAD_CREDENTIALS', 'Wrong email or password');
  }
  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
}
