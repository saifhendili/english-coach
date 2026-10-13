import mongoose from 'mongoose';
import { FOCUS_IDS } from '../services/focus.js';

// One document per user: what they like talking about, and what they want to improve.
const interestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fields: [{ _id: false, name: { type: String, required: true }, emoji: { type: String, default: '💬' } }],
    focus: [{ type: String, enum: FOCUS_IDS }],
  },
  { timestamps: true },
);

export const Interest = mongoose.model('Interest', interestSchema);
