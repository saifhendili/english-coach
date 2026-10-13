import mongoose from 'mongoose';

// How a learner is doing with each tense (and with the irregular verbs, tense 'irregular'): one row per user and tense.
const tenseStatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tense: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    lastPracticedAt: Date,
  },
  { timestamps: false },
);
tenseStatSchema.index({ userId: 1, tense: 1 }, { unique: true });

// One row per user and exercise: the next session brings back what was missed and what was never seen.
const tenseItemStatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: String, required: true },
    tense: { type: String, required: true },
    seen: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    lastCorrect: Boolean,
    lastAt: Date,
  },
  { timestamps: false },
);
tenseItemStatSchema.index({ userId: 1, itemId: 1 }, { unique: true });
tenseItemStatSchema.index({ userId: 1, tense: 1 });

export const TenseStat = mongoose.model('TenseStat', tenseStatSchema);
export const TenseItemStat = mongoose.model('TenseItemStat', tenseItemStatSchema);
