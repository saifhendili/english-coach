// The shapes the English Coach server returns. Kept in one place so every screen agrees with the API.

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type FreeModel = { id: string; label: string; note: string };

export type SettingsData = {
  email: string;
  level: Level | null;
  nativeLang: string;
  settings: { correctionMode: 'every' | 'end'; strictness: 'gentle' | 'normal' | 'strict' };
  modelPrefs: { fast: string; strong: string };
  defaultModels: { fast: string; strong: string };
  freeModels: FreeModel[];
  hasKey: boolean;
  keyHint: string | null;
};

export type SettingsPatch = {
  nativeLang?: string;
  settings?: Partial<SettingsData['settings']>;
  modelPrefs?: Partial<SettingsData['modelPrefs']>;
  /** A string saves this key, null removes it. */
  geminiKey?: string | null;
};

export type PlacementStatus = {
  inProgress: { attemptId: string; answered: number } | null;
  last: { attemptId: string; level: Level; finishedAt: string } | null;
};

export type FocusOption = { id: string; label: string; description: string };
export type InterestField = { name: string; emoji: string };

export type InterestsData = {
  saved: boolean;
  fields: InterestField[];
  focus: string[];
  suggestedFocus: string[];
  focusOptions: FocusOption[];
};

export type ReviewSummary = {
  due: number;
  reviewsDue: number;
  newToday: number;
  newWaiting: number;
  reviewedToday: number;
  totalCards: number;
};

// ---- Topics ----

export type TopicVocab = { word: string; meaning: string; translation: string | null };

export type Topic = {
  id: string;
  field: string;
  emoji: string;
  angle: 'debate' | 'storytelling' | 'role-play' | 'opinion' | 'problem-solving';
  title: string;
  level: Level;
  durationMinutes: number;
  openers: string[];
  vocab: TopicVocab[];
  scenario: string;
  focusTips: { skill: string; tip: string }[];
  favorite: boolean;
  createdAt: string;
};

// ---- Chat ----

export type MistakeType = 'tense' | 'article' | 'preposition' | 'agreement' | 'word-order' | 'vocabulary' | 'spelling' | 'other';

export type CorrectionItem = { wrong: string; right: string; type: MistakeType; explanation: string };
export type Correction = { hasMistakes: boolean; corrected: string; items: CorrectionItem[] };
export type PhraseUpgrade = { said: string | null; better: string; why: string };
export type NewWord = { word: string; meaning: string; translation: string | null };

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  correction: Correction | null;
  phrases: PhraseUpgrade[];
  newWords: NewWord[];
  createdAt: string;
};

export type SessionReport = {
  score: number;
  summary: string;
  strengths: string[];
  topMistakes: { pattern: string; example: string; tip: string }[];
  nextTopic: { title: string; why: string };
};

export type ChatMode = 'talk' | 'roleplay' | 'free';

export type ChatSession = {
  id: string;
  mode: ChatMode;
  title: string;
  emoji: string;
  scenario: string | null;
  level: Level;
  status: 'active' | 'ended';
  turns: number;
  score: number | null;
  report: SessionReport | null;
  stats: { turns: number; mistakes: number; minutes: number } | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type SessionListItem = Omit<ChatSession, 'messages'>;

// ---- Saved words and phrases ----

export type SavedItemData = {
  id: string;
  kind: 'word' | 'phrase';
  text: string;
  meaning: string;
  translation: string;
  example: string;
  category: string;
  source: string;
  createdAt: string;
};

export type SaveInput = {
  kind: 'word' | 'phrase';
  text: string;
  meaning?: string;
  translation?: string;
  example?: string;
  category?: string;
  source?: 'chat' | 'dictionary' | 'phrasebank' | 'practice' | 'manual';
  sessionId?: string;
};

export type DictionaryEntry = {
  word: string;
  phonetic: string;
  audio: string;
  definitions: { partOfSpeech: string; text: string; example: string }[];
};

export type WordExplanation = { meaning: string; translation: string | null; example: string };

// ---- Phrasebank ----

export type Phrase = {
  text: string;
  usage: string;
  example: string;
  translation?: string | null;
  level: Level;
  register: 'neutral' | 'formal' | 'informal';
};

export type PhraseCategory = { id: string; label: string; emoji: string; blurb: string; situations: string[]; phrases: Phrase[] };

export type PracticeResult = {
  usedPhrase: boolean;
  natural: boolean;
  score: number;
  feedback: string;
  corrected: string;
  modelAnswer: string;
};

// ---- Review (spaced repetition) ----

export type ReviewRating = 1 | 2 | 3 | 4;

// A card from /review/queue: a saved word or phrase (kind 'saved') or one of the learner's own mistakes.
export type ReviewCardData = {
  kind: 'saved' | 'mistake';
  id: string;
  type: 'word' | 'phrase' | 'mistake';
  isNew: boolean;
  /** How long until the card comes back, for each rating: "10m", "3d"... */
  preview: Record<ReviewRating, string>;
  // saved word / phrase
  text?: string;
  meaning?: string;
  translation?: string;
  example?: string;
  // mistake
  wrong?: string;
  right?: string;
  errorType?: string;
  explanation?: string;
  sentence?: string | null;
  corrected?: string | null;
  /** Set by the session: a card answered Again comes back once more, for practice only. */
  retry?: boolean;
};

// ---- Progress ----

export type ProgressData = {
  streak: { current: number; best: number };
  activity: { date: string; messages: number; reviews: number }[];
  totals: { messages: number; messagesBefore: number; reviews: number; reviewsBefore: number; corrections: number; remembered: number | null; words: number; phrases: number };
  sessions: { at: string; title: string; score: number }[];
  mistakeTypes: { type: string; count: number }[];
  levels: { level: Level; at: string }[];
  skills: { skill: string; score: number; count: number }[];
};

// ---- Placement test ----

export type PlacementQuestion = {
  index: number;
  type: 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking';
  level: Level;
  prompt: string;
  passage?: string | null;
  /** Present for multiple choice; writing and speaking questions have none. */
  options?: string[] | null;
};

// What the server says after starting, resuming, or answering.
export type PlacementView = {
  attemptId: string;
  answered: number;
  maxQuestions: number;
  canFinishEarly: boolean;
  question?: PlacementQuestion | null;
  readyToFinish?: boolean;
};

export type PlacementAnswer = { choiceIndex: number } | { text: string } | { skip: true };

export type PlacementReviewItem = {
  index: number;
  type: PlacementQuestion['type'];
  level: Level;
  prompt: string;
  passage?: string | null;
  options?: string[] | null;
  correctIndex?: number;
  yourChoice?: number | null;
  skipped?: boolean;
  explanation?: string;
  yourText?: string;
  grade?: { cefrLevel: string; grammar: number; vocabulary: number; fluency: number; feedback: string };
  score: number;
};

export type PlacementResult = {
  level: Level;
  answered: number;
  breakdown: Record<string, { score: number; count: number }>;
  feedback: { summary: string; strengths: string[]; weaknesses: string[]; nextSteps: string[] } | null;
  review: PlacementReviewItem[];
};

// ---- Grammar: verb tenses ----

export type TenseTime = 'present' | 'past' | 'future';

// A picture of when the action happens, on a line from past (0) through now (50) to future (100).
export type TimelineMark =
  | { type: 'ticks'; at: number[] }
  | { type: 'bar'; from: number; to: number; open?: 'right' }
  | { type: 'dot'; at: number; link?: boolean; ref?: boolean; label?: string };

export type TenseLesson = {
  id: string;
  name: string;
  time: TenseTime;
  level: Level;
  summary: string;
  form: { affirmative: string; negative: string; question: string };
  formExamples: { affirmative: string; negative: string; question: string };
  uses: { rule: string; example: string }[];
  signals: string[];
  mistakes: { wrong: string; right: string; why: string }[];
  contrast: { with: string; tip: string };
  timeline: { marks: TimelineMark[] };
};

export type TenseStat = { attempts: number; correct: number; accuracy: number | null };

export type IrregularVerb = { base: string; past: string[]; participle: string[]; meaning: string };

export type TensesData = {
  lessons: TenseLesson[];
  /** Per tense id, and `irregular` for the irregular-verb drill. */
  stats: Record<string, TenseStat>;
  recommended: { tense: string | null; reason: 'weakest' | 'next' | 'done' };
  /** How many tense mistakes the coach has corrected in the learner's chats. */
  chatTenseMistakes: number;
  irregular: { count: number; verbs: IrregularVerb[] };
};

type ExerciseBase = { id: string; tense: string; why?: string; ai?: boolean; retry?: boolean };
export type FillExercise = ExerciseBase & { type: 'fill'; prompt: string; answers: string[] };
export type FixExercise = ExerciseBase & { type: 'fix'; prompt: string; answers: string[] };
export type ChoiceExercise = ExerciseBase & { type: 'choose' | 'identify'; prompt: string; options: string[]; correctIndex: number };
export type IrregularExercise = ExerciseBase & { type: 'irregular'; base: string; meaning: string; past: string[]; participle: string[] };
export type Exercise = FillExercise | FixExercise | ChoiceExercise | IrregularExercise;

/** What the learner answered: text for fill / fix, an option number for choices, two forms for an irregular verb. */
export type Response = string | number | { past: string; participle: string };
export type Verdict = { correct: boolean; expected: string };

export type TenseAnswer = { id: string; tense: string; correct: boolean };
