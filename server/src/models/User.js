import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // AES-256-GCM payload; the plaintext key never touches the DB or the client.
    geminiKeyEnc: { type: String, default: null },
    geminiKeyHint: { type: String, default: null },

    modelPrefs: {
      fast: { type: String, default: null },
      strong: { type: String, default: null },
    },

    level: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], default: null },
    nativeLang: { type: String, default: 'fr' },
    settings: {
      correctionMode: { type: String, enum: ['every', 'end'], default: 'every' },
      strictness: { type: String, enum: ['gentle', 'normal', 'strict'], default: 'normal' },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
