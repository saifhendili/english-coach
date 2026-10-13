import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { SavedItem, savedKey } from '../models/SavedItem.js';

const objectId = z.string().regex(/^[0-9a-f]{24}$/i);
const clip = (max) => z.string().trim().max(max).default('');

const saveBody = z.object({
  kind: z.enum(['word', 'phrase']),
  text: z.string().trim().min(1).max(200),
  meaning: clip(500),
  translation: clip(200),
  example: clip(400),
  category: clip(60),
  source: z.enum(['chat', 'dictionary', 'phrasebank', 'practice', 'manual']).default('manual'),
  sessionId: objectId.optional(),
});
const listQuery = z.object({
  kind: z.enum(['word', 'phrase']).optional(),
  q: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(300),
});

const view = (i) => ({
  id: i.id,
  kind: i.kind,
  text: i.text,
  meaning: i.meaning,
  translation: i.translation,
  example: i.example,
  category: i.category,
  source: i.source,
  createdAt: i.createdAt,
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Saving something twice is not an error: the existing entry comes back.
export async function save(req, res) {
  const body = saveBody.parse(req.body);
  const key = savedKey(body.text);
  if (!key) throw new AppError(400, 'VALIDATION', 'Nothing to save.');

  const find = () => SavedItem.findOne({ userId: req.user._id, kind: body.kind, key });
  const existing = await find();
  if (existing) return res.json({ item: view(existing), created: false });

  try {
    const item = await SavedItem.create({ ...body, userId: req.user._id, key });
    res.status(201).json({ item: view(item), created: true });
  } catch (err) {
    if (err.code !== 11000) throw err; // two taps at once: the other one won
    res.json({ item: view(await find()), created: false });
  }
}

export async function list(req, res) {
  const { kind, q, limit } = listQuery.parse(req.query);
  const filter = { userId: req.user._id };
  if (kind) filter.kind = kind;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ text: rx }, { meaning: rx }, { translation: rx }];
  }
  const items = await SavedItem.find(filter).sort({ _id: -1 }).limit(limit);
  res.json({ items: items.map(view) });
}

export async function remove(req, res) {
  const id = objectId.safeParse(req.params.id);
  const result = id.success && (await SavedItem.deleteOne({ _id: id.data, userId: req.user._id }));
  if (!result?.deletedCount) throw new AppError(404, 'NOT_FOUND', 'Saved item not found');
  res.json({ ok: true });
}
