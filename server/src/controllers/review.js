import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { Mistake } from '../models/Mistake.js';
import { ReviewLog } from '../models/ReviewLog.js';
import { SavedItem } from '../models/SavedItem.js';
import { NEW_PER_DAY, applyRating, formatInterval, interleave, previewIntervals } from '../services/srs.js';

const objectId = z.string().regex(/^[0-9a-f]{24}$/i);
const queueQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });
const answerBody = z.object({ kind: z.enum(['saved', 'mistake']), id: objectId, rating: z.number().int().min(1).max(4) });

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const savedView = (i, now) => ({
  kind: 'saved',
  id: i.id,
  type: i.kind, // 'word' or 'phrase'
  text: i.text,
  meaning: i.meaning,
  translation: i.translation,
  example: i.example,
  isNew: i.reps === 0,
  preview: previewIntervals(i, now),
});

const mistakeView = (m, now) => ({
  kind: 'mistake',
  id: m.id,
  type: 'mistake',
  wrong: m.wrong,
  right: m.right,
  errorType: m.type,
  explanation: m.explanation,
  sentence: m.sentence ?? null,
  corrected: m.corrected ?? null,
  isNew: m.reps === 0,
  preview: previewIntervals(m, now),
});

// Everything that could be reviewed right now. Cards met before come back when due, all of them. Cards never
// seen are held back to NEW_PER_DAY a day, oldest first, so a long saved list does not become one huge session.
async function pending(userId, now) {
  const [savedDue, mistakeDue, savedNew, mistakeNew, introducedToday] = await Promise.all([
    SavedItem.find({ userId, reps: { $gt: 0 }, due: { $lte: now } }),
    Mistake.find({ userId, reps: { $gt: 0 }, due: { $lte: now } }),
    SavedItem.find({ userId, reps: 0 }).sort({ _id: 1 }),
    Mistake.find({ userId, reps: 0 }).sort({ _id: 1 }),
    ReviewLog.countDocuments({ userId, wasNew: true, reviewedAt: { $gte: startOfToday() } }),
  ]);

  const reviews = [
    ...savedDue.map((i) => ({ at: i.due, view: () => savedView(i, now) })),
    ...mistakeDue.map((m) => ({ at: m.due, view: () => mistakeView(m, now) })),
  ].sort((a, b) => a.at - b.at);

  // Oldest first within each kind, then taken in turn: a long list of saved words must not hold back the corrections.
  const fresh = interleave(
    mistakeNew.map((m) => ({ view: () => mistakeView(m, now) })),
    savedNew.map((i) => ({ view: () => savedView(i, now) })),
  );

  const quota = Math.max(0, NEW_PER_DAY - introducedToday);
  return { reviews, fresh: fresh.slice(0, quota), waiting: Math.max(0, fresh.length - quota), introducedToday };
}

// For the badge on the Review tab and the Home page.
export async function summary(req, res) {
  const now = new Date();
  const p = await pending(req.user._id, now);
  const [saved, mistakes, reviewedToday] = await Promise.all([
    SavedItem.countDocuments({ userId: req.user._id }),
    Mistake.countDocuments({ userId: req.user._id }),
    ReviewLog.countDocuments({ userId: req.user._id, reviewedAt: { $gte: startOfToday() } }),
  ]);
  res.json({
    due: p.reviews.length + p.fresh.length,
    reviewsDue: p.reviews.length,
    newToday: p.fresh.length,
    newWaiting: p.waiting, // saved but held back until tomorrow
    reviewedToday,
    totalCards: saved + mistakes,
  });
}

// The cards for one session: reviews first, then new cards.
export async function queue(req, res) {
  const { limit } = queueQuery.parse(req.query);
  const now = new Date();
  const p = await pending(req.user._id, now);
  const items = [...p.reviews, ...p.fresh].slice(0, limit).map((x) => x.view());
  res.json({
    items,
    remaining: p.reviews.length + p.fresh.length - items.length,
    newWaiting: p.waiting,
  });
}

// Records the answer and schedules the card.
export async function answer(req, res) {
  const { kind, id, rating } = answerBody.parse(req.body);
  const Model = kind === 'saved' ? SavedItem : Mistake;
  const item = await Model.findOne({ _id: id, userId: req.user._id });
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Card not found');

  const now = new Date();
  // A card already answered (a double tap, or the same queue open in two tabs) is no longer due.
  if (item.due.getTime() > now.getTime() + 5 * 60_000) {
    throw new AppError(409, 'NOT_DUE', 'This card was already reviewed.');
  }

  const wasNew = item.reps === 0;
  const result = applyRating(item, rating, now);
  item.fsrs = result.fsrs;
  item.due = result.due;
  item.reps = result.reps;
  item.lapses = result.lapses;
  if (wasNew) item.firstReviewedAt = now;
  await item.save();

  await ReviewLog.create({ userId: req.user._id, kind, itemId: item._id, rating, wasNew, scheduledDays: result.fsrs.scheduled_days, reviewedAt: now });
  res.json({ due: result.due, next: formatInterval(result.due, now) });
}
