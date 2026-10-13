import mongoose from 'mongoose';
import { LEVELS, START_ABILITY } from '../services/placement.js';

const gradeSchema = new mongoose.Schema(
  {
    cefrLevel: { type: String, enum: LEVELS },
    grammar: Number,
    vocabulary: Number,
    fluency: Number,
    feedback: String,
  },
  { _id: false },
);

// Generated on demand and kept only as history for the review page, never reused as a bank.
const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'], required: true },
    level: { type: String, enum: LEVELS, required: true },
    theme: String,
    prompt: { type: String, required: true },
    passage: String,
    // Multiple choice only. Never sent to the client before the question is answered.
    options: [String],
    answerIndex: Number,
    explanation: String,

    answer: {
      choiceIndex: Number,
      text: String,
      skipped: Boolean,
    },
    score: Number, // 0-1, null until answered
    grade: gradeSchema, // writing/speaking only
    abilityAfter: Number,
    answeredAt: Date,
  },
  { _id: false },
);

const placementAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['in_progress', 'finished'], default: 'in_progress' },
    ability: { type: Number, default: START_ABILITY },
    questions: [questionSchema],

    resultLevel: { type: String, enum: LEVELS },
    finalAbility: Number,
    breakdown: mongoose.Schema.Types.Mixed,
    feedback: mongoose.Schema.Types.Mixed,
    finishedAt: Date,
  },
  { timestamps: true },
);

export const PlacementAttempt = mongoose.model('PlacementAttempt', placementAttemptSchema);
