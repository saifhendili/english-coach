import mongoose from 'mongoose';

// One row per answer given in Review. Feeds the Progress page (reviews per day, how much is remembered).
const reviewLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['saved', 'mistake'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, min: 1, max: 4, required: true }, // 1 Again, 2 Hard, 3 Good, 4 Easy
    wasNew: { type: Boolean, default: false }, // the first time this item was ever reviewed
    scheduledDays: Number,
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

reviewLogSchema.index({ userId: 1, reviewedAt: -1 });

export const ReviewLog = mongoose.model('ReviewLog', reviewLogSchema);
