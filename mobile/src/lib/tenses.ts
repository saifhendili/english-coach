import type { Exercise, Response, Verdict } from '@/types';

// Checking a typed answer. A learner who writes "doesn't" instead of "does not", "She's working" instead of
// "She is working", or forgets the final full stop must still be marked right, so both sides are reduced to the same
// plain form before they are compared.

const WHOLE: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/n't\b/g, ' not'],
  [/'m\b/g, ' am'],
  [/'re\b/g, ' are'],
  [/'ve\b/g, ' have'],
  [/'ll\b/g, ' will'],
];

const MAX_VARIANTS = 16;

// "she's gone" can mean "she is" or "she has"; "I'd go" can mean "I would" or "I had". Every reading is returned.
function readings(text: string): string[] {
  let out = [
    WHOLE.reduce((t, [pattern, full]) => t.replace(pattern, full), text.toLowerCase().replace(/[’‘`]/g, "'")),
  ];
  for (const [mark, options] of [["'s", [' is', ' has']], ["'d", [' would', ' had']]] as const) {
    const re = new RegExp(`${mark}\\b`);
    let guard = 0;
    while (out.some((t) => re.test(t)) && guard++ < 4) {
      out = out.flatMap((t) => (re.test(t) ? options.map((o) => t.replace(re, o)) : [t])).slice(0, MAX_VARIANTS);
    }
  }
  return out;
}

const plain = (s: string) =>
  s
    .replace(/["“”.,;:!?()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeText = (s: string): string => plain(readings(s)[0]);

/** Does `typed` say the same thing as one of the accepted answers? */
export function matchesAny(typed: string, answers: string[]): boolean {
  if (!typed.trim()) return false;
  const mine = new Set(readings(typed).map(plain));
  return answers.some((a) => readings(a).map(plain).some((r) => mine.has(r)));
}

/** "She ____ (work) in a bank." + "works" -> "She works in a bank." (the verb hint goes, a leading blank is capitalised). */
export function fillBlank(prompt: string, answer: string): string {
  const atStart = /^\s*____/.test(prompt);
  const text = answer.trim();
  const word = atStart ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  return prompt.replace(/____(\s*\([^)]*\))?/, word).replace(/\s+([,.?!])/g, '$1');
}

/** The complete, correct sentence for an exercise (what to show and read aloud after answering). */
export function completedSentence(ex: Exercise): string | null {
  switch (ex.type) {
    case 'fill':
      return fillBlank(ex.prompt, ex.answers[0]);
    case 'fix':
      return ex.answers[0];
    case 'choose':
      return fillBlank(ex.prompt, ex.options[ex.correctIndex]);
    case 'identify':
      return ex.prompt;
    default:
      return null;
  }
}

export function checkAnswer(ex: Exercise, response: Response): Verdict {
  switch (ex.type) {
    case 'fill':
    case 'fix':
      return { correct: typeof response === 'string' && matchesAny(response, ex.answers), expected: ex.answers[0] };
    case 'choose':
    case 'identify':
      return { correct: response === ex.correctIndex, expected: ex.options[ex.correctIndex] };
    case 'irregular': {
      const given = typeof response === 'object' ? response : { past: '', participle: '' };
      const form = (list: string[], typed: string) => list.some((f) => f === typed.trim().toLowerCase());
      return {
        correct: form(ex.past, given.past) && form(ex.participle, given.participle),
        expected: `${ex.base} – ${ex.past.join(' / ')} – ${ex.participle.join(' / ')}`,
      };
    }
  }
}

/** A short label for a tense's accuracy: "New", or "73%". */
export const masteryLabel = (accuracy: number | null, attempts: number): string => (attempts === 0 || accuracy === null ? 'New' : `${accuracy}%`);
