import mongoose from 'mongoose';
import { MISTAKE_TYPES } from './ChatSession.js';

// Every correction the coach made. Kept so they can be reviewed with spaced repetition later.
const mistakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    wrong: { type: String, required: true },
    right: { type: String, required: true },
    sentence: String, // the learner's whole message, so the card can show the mistake in context
    corrected: String, // and the whole message corrected
    type: { type: String, enum: MISTAKE_TYPES, default: 'other' },
    explanation: String,
    due: { type: Date, default: Date.now },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    fsrs: mongoose.Schema.Types.Mixed,
    firstReviewedAt: Date,
  },
  { timestamps: true },
);

mistakeSchema.index({ userId: 1, due: 1 });

export const Mistake = mongoose.model('Mistake', mistakeSchema);
