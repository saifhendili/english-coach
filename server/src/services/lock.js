import { AppError } from '../middleware/errors.js';

// One request at a time per key (double taps, two tabs). Fine for a single server process.
const inFlight = new Set();

export async function locked(id, fn) {
  if (inFlight.has(id)) throw new AppError(409, 'BUSY', 'Still working on your previous request.');
  inFlight.add(id);
  try {
    return await fn();
  } finally {
    inFlight.delete(id);
  }
}
