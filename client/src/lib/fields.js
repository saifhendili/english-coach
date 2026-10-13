// Starting point for the interest picker. Nothing here limits the learner:
// "More fields" asks Gemini for more, and "Add your own" accepts anything.
export const FIELD_GROUPS = [
  {
    id: 'daily',
    label: 'Daily life',
    emoji: '🏠',
    fields: [
      ['Food & Cooking', '🍳'], ['Family & Friends', '👨‍👩‍👧'], ['Health & Fitness', '💪'],
      ['Shopping', '🛍️'], ['Pets', '🐶'], ['Home & Cities', '🏙️'],
    ],
  },
  {
    id: 'culture',
    label: 'Culture',
    emoji: '🎭',
    fields: [
      ['Movies & TV', '🎬'], ['Music', '🎵'], ['Books', '📚'],
      ['Art & Design', '🎨'], ['Fashion', '👗'], ['Festivals & Traditions', '🎉'],
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    fields: [
      ['Football', '⚽'], ['Basketball', '🏀'], ['Tennis', '🎾'],
      ['Running', '🏃'], ['Gym', '🏋️'], ['Martial Arts', '🥋'],
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    emoji: '✈️',
    fields: [
      ['Airports & Flights', '🛫'], ['Hotels', '🏨'], ['Street Food Abroad', '🌮'],
      ['Road Trips', '🚗'], ['Backpacking', '🎒'], ['Culture Shock', '🌍'],
    ],
  },
  {
    id: 'work',
    label: 'Work',
    emoji: '💼',
    fields: [
      ['Job Interviews', '🤝'], ['Meetings', '📅'], ['Emails & Writing', '✉️'],
      ['Startups', '🚀'], ['Customer Service', '🎧'], ['Remote Work', '💻'],
    ],
  },
  {
    id: 'tech',
    label: 'Tech',
    emoji: '💻',
    fields: [
      ['AI', '🤖'], ['Gaming', '🎮'], ['Social Media', '📱'],
      ['Smartphones', '📲'], ['Coding', '👨‍💻'], ['Cybersecurity', '🔒'],
    ],
  },
  {
    id: 'world',
    label: 'World',
    emoji: '🌍',
    fields: [
      ['News', '📰'], ['Environment', '🌱'], ['Economy', '💰'],
      ['History', '🏛️'], ['Science', '🔬'], ['Space', '🚀'],
    ],
  },
].map((g) => ({ ...g, fields: g.fields.map(([name, emoji]) => ({ name, emoji })) }));

export const SEED_NAMES = new Set(FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.name.toLowerCase())));

// Same rule as the server: collapse spaces; all-lowercase input gets Title Case.
export function tidyName(raw) {
  const clean = raw.replace(/\s+/g, ' ').trim();
  return clean === clean.toLowerCase() ? clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : clean;
}
