import { AudioLines, BookA, BookOpen, Headphones, Mic, PenLine, SpellCheck } from 'lucide-react';

export const SKILLS = {
  grammar: { label: 'Grammar', icon: SpellCheck, bar: 'from-violet-500 to-indigo-500' },
  vocabulary: { label: 'Vocabulary', icon: BookA, bar: 'from-sky-500 to-cyan-500' },
  reading: { label: 'Reading', icon: BookOpen, bar: 'from-emerald-500 to-teal-500' },
  writing: { label: 'Writing', icon: PenLine, bar: 'from-amber-500 to-orange-500' },
  speaking: { label: 'Speaking', icon: Mic, bar: 'from-fuchsia-500 to-rose-500' },
};

// Things a learner can choose to improve: the five test skills plus two more.
export const FOCUS_UI = {
  ...SKILLS,
  pronunciation: { label: 'Pronunciation', icon: AudioLines, bar: 'from-rose-500 to-orange-500' },
  listening: { label: 'Listening', icon: Headphones, bar: 'from-cyan-500 to-blue-500' },
};

export const LEVELS = {
  A1: { name: 'Beginner', gradient: 'from-slate-400 to-sky-500' },
  A2: { name: 'Elementary', gradient: 'from-sky-400 to-cyan-500' },
  B1: { name: 'Intermediate', gradient: 'from-emerald-400 to-teal-500' },
  B2: { name: 'Upper-intermediate', gradient: 'from-indigo-500 to-violet-500' },
  C1: { name: 'Advanced', gradient: 'from-violet-500 to-fuchsia-500' },
  C2: { name: 'Proficient', gradient: 'from-fuchsia-500 to-rose-500' },
};
