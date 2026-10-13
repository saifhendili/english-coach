// What the learner wants to improve. The first five match the placement-test skills
// (so the test result can suggest a focus); pronunciation and listening are extra.
// `hint` is written for the prompt, `description` is shown in the UI.
export const FOCUS_AREAS = [
  {
    id: 'speaking',
    label: 'Speaking',
    description: 'Talk out loud, fluently and with confidence (oral practice)',
    hint: 'speaking fluency: answering aloud, giving opinions, keeping a conversation going',
  },
  {
    id: 'pronunciation',
    label: 'Pronunciation',
    description: 'Sound clearer: word stress, tricky sounds, rhythm',
    hint: 'pronunciation: word stress, difficult sounds, sentence rhythm',
  },
  {
    id: 'grammar',
    label: 'Grammar',
    description: 'Use tenses and structures correctly when you speak',
    hint: 'grammar: using a specific structure or tense accurately while speaking',
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    description: 'Learn natural words, phrases and collocations',
    hint: 'vocabulary: natural collocations, phrasal verbs and idioms',
  },
  {
    id: 'listening',
    label: 'Listening',
    description: 'Understand fast, natural English',
    hint: 'listening: understanding natural speech, connected speech, different accents',
  },
  {
    id: 'reading',
    label: 'Reading',
    description: 'Read articles and texts with ease',
    hint: 'reading: understanding and discussing texts',
  },
  {
    id: 'writing',
    label: 'Writing',
    description: 'Write clear messages, emails and short texts',
    hint: 'writing: clear, well-organised written English',
  },
];

export const FOCUS_IDS = FOCUS_AREAS.map((f) => f.id);

// Placement skills where the learner scored lowest, as a starting point for the focus picker.
// `breakdown` is { skill: { count, score } } from a finished placement attempt.
export function suggestFocus(breakdown, max = 2) {
  return Object.entries(breakdown ?? {})
    .filter(([id, s]) => FOCUS_IDS.includes(id) && s.count > 0)
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, max)
    .map(([id]) => id);
}
