// Pure helpers for topic generation (no I/O) so they can be unit-tested.

export const ANGLES = ['debate', 'storytelling', 'role-play', 'opinion', 'problem-solving'];

const shuffle = (list, rand = Math.random) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Decides, before calling Gemini, which interest field and which angle each topic gets.
 * That guarantees variety (every field gets a turn, angles rotate) instead of hoping the
 * model varies things by itself.
 *
 * fields: [{ name, emoji }]. With `mix`, each topic blends two different fields.
 */
export function buildSlots(fields, count, { mix = false, rand = Math.random } = {}) {
  if (!fields.length) return [];
  const order = shuffle(fields, rand);

  let angles = [];
  while (angles.length < count) angles = angles.concat(shuffle(ANGLES, rand));

  return Array.from({ length: count }, (_, i) => {
    const first = order[i % order.length];
    if (mix && order.length > 1) {
      const second = order[(i + 1 + Math.floor(rand() * (order.length - 1))) % order.length];
      return { field: `${first.name} + ${second.name}`, emoji: first.emoji, angle: angles[i] };
    }
    return { field: first.name, emoji: first.emoji, angle: angles[i] };
  });
}

// "Football: Who's the GOAT?" and "football whos the goat" count as the same title.
export const normalizeTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Drops titles already seen (or repeated within the batch). Returns items in the original order.
export function dropRepeats(items, seenTitles) {
  const seen = new Set(seenTitles.map(normalizeTitle));
  return items.filter((item) => {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Collapses whitespace.
export function cleanFieldName(name) {
  return name.replace(/\s+/g, ' ').trim();
}

// "street food" -> "Street Food". Names that already have their own casing ("AI", "iPhone") are kept.
export function displayName(name) {
  const clean = cleanFieldName(name);
  // Not /\b\w/: \b does not see accented letters as word characters ("café" would become "CafÉ").
  return clean === clean.toLowerCase()
    ? clean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : clean;
}
