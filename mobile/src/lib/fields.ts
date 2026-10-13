import type { InterestField } from '@/types';

type Group = { id: string; label: string; emoji: string; fields: InterestField[] };

const group = (id: string, label: string, emoji: string, fields: [string, string][]): Group => ({
  id,
  label,
  emoji,
  fields: fields.map(([name, e]) => ({ name, emoji: e })),
});

// Starting point for the interest picker. Nothing here limits the learner:
// "More fields" asks Gemini for more, and "Add your own" accepts anything.
export const FIELD_GROUPS: Group[] = [
  group('daily', 'Daily life', '🏠', [['Food & Cooking', '🍳'], ['Family & Friends', '👨‍👩‍👧'], ['Health & Fitness', '💪'], ['Shopping', '🛍️'], ['Pets', '🐶'], ['Home & Cities', '🏙️']]),
  group('culture', 'Culture', '🎭', [['Movies & TV', '🎬'], ['Music', '🎵'], ['Books', '📚'], ['Art & Design', '🎨'], ['Fashion', '👗'], ['Festivals & Traditions', '🎉']]),
  group('sports', 'Sports', '⚽', [['Football', '⚽'], ['Basketball', '🏀'], ['Tennis', '🎾'], ['Running', '🏃'], ['Gym', '🏋️'], ['Martial Arts', '🥋']]),
  group('travel', 'Travel', '✈️', [['Airports & Flights', '🛫'], ['Hotels', '🏨'], ['Street Food Abroad', '🌮'], ['Road Trips', '🚗'], ['Backpacking', '🎒'], ['Culture Shock', '🌍']]),
  group('work', 'Work', '💼', [['Job Interviews', '🤝'], ['Meetings', '📅'], ['Emails & Writing', '✉️'], ['Startups', '🚀'], ['Customer Service', '🎧'], ['Remote Work', '💻']]),
  group('tech', 'Tech', '💻', [['AI', '🤖'], ['Gaming', '🎮'], ['Social Media', '📱'], ['Smartphones', '📲'], ['Coding', '👨‍💻'], ['Cybersecurity', '🔒']]),
  group('world', 'World', '🌍', [['News', '📰'], ['Environment', '🌱'], ['Economy', '💰'], ['History', '🏛️'], ['Science', '🔬'], ['Space', '🚀']]),
];

export const SEED_NAMES = new Set(FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.name.toLowerCase())));

// Same rule as the server: collapse spaces; all-lowercase input gets Title Case.
export function tidyName(raw: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean === clean.toLowerCase() ? clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : clean;
}
