import mongoose from 'mongoose';

// Words and phrases the learner chose to keep. The scheduling fields are here already so the
// spaced-repetition review can start from day one (a new item is due immediately).
const savedItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['word', 'phrase'], required: true },
    text: { type: String, required: true },
    key: { type: String, required: true }, // normalised text: one entry per word/phrase per user
    meaning: { type: String, default: '' },
    translation: { type: String, default: '' },
    example: { type: String, default: '' },
    category: { type: String, default: '' },
    source: { type: String, enum: ['chat', 'dictionary', 'phrasebank', 'practice', 'manual'], default: 'manual' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', default: null },

    // Spaced repetition (see services/srs.js). A new item is due at once; reps 0 means never reviewed.
    due: { type: Date, default: Date.now },
    reps: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    fsrs: mongoose.Schema.Types.Mixed,
    firstReviewedAt: Date,
  },
  { timestamps: true },
);

savedItemSchema.index({ userId: 1, kind: 1, key: 1 }, { unique: true });
savedItemSchema.index({ userId: 1, _id: -1 });

// "To be honest," and "to be honest" are the same entry.
export const savedKey = (text) =>
  text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[….,!?]+$/g, '') // after trimming, so "that… " and "that…" are the same entry
    .trim();

export const SavedItem = mongoose.model('SavedItem', savedItemSchema);
