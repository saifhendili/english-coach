import { ChatSession } from '../models/ChatSession.js';
import { Mistake } from '../models/Mistake.js';
import { PlacementAttempt } from '../models/PlacementAttempt.js';
import { ReviewLog } from '../models/ReviewLog.js';
import { SavedItem } from '../models/SavedItem.js';
import { buildActivity, dayKey, lastDays, percent, streaks, sum } from '../services/progress.js';

const YEAR = 365;
const startOf = (daysAgo) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
};

// Everything the Progress page draws.
export async function progress(req, res) {
  const userId = req.user._id;
  const since = startOf(YEAR);

  const [sessions, logs, scored, mistakeTypes, saved, mistakeCount, placements] = await Promise.all([
    ChatSession.find({ userId, updatedAt: { $gte: since } }).select('messages.role messages.createdAt'),
    ReviewLog.find({ userId, reviewedAt: { $gte: since } }).select('reviewedAt rating'),
    ChatSession.find({ userId, status: 'ended', score: { $ne: null } }).sort({ endedAt: -1 }).limit(20).select('title score endedAt'),
    Mistake.aggregate([{ $match: { userId } }, { $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    SavedItem.aggregate([{ $match: { userId } }, { $group: { _id: '$kind', count: { $sum: 1 } } }]),
    Mistake.countDocuments({ userId }),
    PlacementAttempt.find({ userId, status: 'finished' }).sort({ finishedAt: 1 }).select('resultLevel finishedAt breakdown'),
  ]);

  const messageDates = sessions.flatMap((s) => s.messages.filter((m) => m.role === 'user').map((m) => m.createdAt));
  const reviewDates = logs.map((l) => l.reviewedAt);

  // Two windows of 30 days, so each number can say how it compares with the 30 days before.
  const sixty = buildActivity(lastDays(60), messageDates, reviewDates);
  const previous = sixty.slice(0, 30);
  const activity = sixty.slice(30);

  const since30 = startOf(29);
  const recentLogs = logs.filter((l) => l.reviewedAt >= since30);

  const savedBy = Object.fromEntries(saved.map((s) => [s._id, s.count]));
  const last = placements.at(-1);

  res.json({
    streak: streaks([...messageDates, ...reviewDates].map(dayKey)),
    activity,
    totals: {
      messages: sum(activity, 'messages'),
      messagesBefore: sum(previous, 'messages'),
      reviews: sum(activity, 'reviews'),
      reviewsBefore: sum(previous, 'reviews'),
      remembered: percent(recentLogs.filter((l) => l.rating >= 3).length, recentLogs.length), // Good or Easy
      corrections: mistakeCount,
      words: savedBy.word ?? 0,
      phrases: savedBy.phrase ?? 0,
    },
    sessions: scored
      .map((s) => ({ id: s.id, title: s.title, score: s.score, at: s.endedAt }))
      .reverse(), // oldest first, for a line chart
    mistakeTypes: mistakeTypes.map((m) => ({ type: m._id, count: m.count })),
    levels: placements.map((p) => ({ level: p.resultLevel, at: p.finishedAt })),
    skills: Object.entries(last?.breakdown ?? {}).map(([skill, v]) => ({ skill, score: v.score, count: v.count })),
  });
}
