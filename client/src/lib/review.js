// Pure helpers for the Review page.

// "I’m fairly confident that…" and "i'm fairly confident that" are the same answer.
export const normalizeAnswer = (s) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\(.*?\)/g, ' ') // "(that)" is optional
    .replace(/[….,!?;:"]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const matchesAnswer = (typed, target) => {
  const a = normalizeAnswer(typed);
  return a.length > 0 && a === normalizeAnswer(target);
};

// Blanks the saved word or phrase out of its example sentence: { before, match, after }.
// null when the example does not contain it as written (an inflected form, no example...): then the card is plain recall.
// It must be a whole word or phrase: "convince" is not found inside "convinced".
export function clozeParts(example, text) {
  if (!example || !text) return null;
  const head = text.replace(/\(.*?\)/g, '').replace(/[\s….,!?]+$/g, '').replace(/\s+/g, ' ').trim();
  if (head.length < 2) return null;

  const straight = (s) => s.replace(/[’‘]/g, "'").toLowerCase();
  const haystack = straight(example);
  const needle = straight(head);
  const inWord = (ch) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);

  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + 1)) {
    if (inWord(haystack[at - 1]) || inWord(haystack[at + needle.length])) continue;
    return { before: example.slice(0, at), match: example.slice(at, at + head.length), after: example.slice(at + head.length) };
  }
  return null;
}

// How a card is shown.
//   mistake  the learner's own sentence with the wrong part marked: type the fix
//   cloze    the example sentence with the word or phrase blanked out: type what is missing
//   recall   the word or phrase on its own: remember what it means
export function cardMode(item) {
  if (item.kind === 'mistake') return 'mistake';
  return clozeParts(item.example, item.text) ? 'cloze' : 'recall';
}

// Which answer button to suggest after a typed answer: right -> Good (3), wrong -> Again (1).
export const suggestedRating = (correct) => (correct ? 3 : 1);

export const RATINGS = [
  { value: 1, label: 'Again', tone: 'rose' },
  { value: 2, label: 'Hard', tone: 'amber' },
  { value: 3, label: 'Good', tone: 'emerald' },
  { value: 4, label: 'Easy', tone: 'sky' },
];
