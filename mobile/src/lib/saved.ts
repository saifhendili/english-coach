// Same normalisation as the server (models/SavedItem.js): "To be honest," and "to be honest" are one entry.
export const savedKey = (text: string): string =>
  text
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[….,!?]+$/g, '') // after trimming, so "that… " and "that…" are the same entry
    .trim();

// Everyday prompts for practising a phrase that does not belong to a category.
export const GENERIC_SITUATIONS = [
  'Tell a friend about something that happened to you this week.',
  'Describe your ideal weekend to a new colleague.',
  'Explain to a friend why you like your favourite hobby.',
  'A friend asks for your advice about a problem at work. Respond.',
  'Describe a place you would love to visit and why.',
];
