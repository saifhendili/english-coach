import mongoose from 'mongoose';
import { LEVELS } from '../services/placement.js';

export const MISTAKE_TYPES = ['tense', 'article', 'preposition', 'agreement', 'word-order', 'vocabulary', 'spelling', 'other'];

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    // On learner messages: what the coach found.
    correction: {
      hasMistakes: Boolean,
      corrected: String,
      items: [{ _id: false, wrong: String, right: String, type: { type: String, enum: MISTAKE_TYPES }, explanation: String }],
    },
    // "Sound more natural" upgrades for what the learner tried to say.
    phrases: [{ _id: false, said: String, better: String, why: String }],
    // On coach messages: useful words in the reply that may be new to the learner.
    newWords: [{ _id: false, word: String, meaning: String, translation: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    mode: { type: String, enum: ['talk', 'roleplay', 'free'], required: true },
    title: { type: String, required: true },
    emoji: { type: String, default: '💬' },
    scenario: String, // role-play only
    level: { type: String, enum: LEVELS, required: true },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },

    messages: [messageSchema],
    // Long chats keep the last messages in full and everything older as a short running summary.
    summaryText: { type: String, default: '' },
    compactedUpTo: { type: Number, default: 0 },

    // Filled when the session ends.
    score: Number,
    report: mongoose.Schema.Types.Mixed,
    endedAt: Date,
  },
  { timestamps: true },
);

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
