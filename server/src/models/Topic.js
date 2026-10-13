import mongoose from 'mongoose';
import { FOCUS_IDS } from '../services/focus.js';
import { LEVELS } from '../services/placement.js';
import { ANGLES } from '../services/topics.js';

// Generated on demand per user. Kept so they can be favourited and so
// new batches never repeat a title.
const topicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    field: { type: String, required: true }, // "Football" or, for "Surprise me", "Football + Tech"
    emoji: { type: String, default: '💬' },
    angle: { type: String, enum: ANGLES, required: true },
    title: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    durationMinutes: Number,
    openers: [String],
    vocab: [{ _id: false, word: String, meaning: String, translation: String }],
    scenario: String,
    focusTips: [{ _id: false, skill: { type: String, enum: FOCUS_IDS }, tip: String }],
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true },
);

topicSchema.index({ userId: 1, _id: -1 });
topicSchema.index({ userId: 1, favorite: 1, _id: -1 });

export const Topic = mongoose.model('Topic', topicSchema);
