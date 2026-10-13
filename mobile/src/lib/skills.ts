import type { IconName } from '@/components/ui/Icon';

export type SkillId = 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking';
export type FocusId = SkillId | 'pronunciation' | 'listening';

type Look = { label: string; icon: IconName; colors: readonly [string, string] };

export const SKILLS: Record<SkillId, Look> = {
  grammar: { label: 'Grammar', icon: 'text', colors: ['#8b5cf6', '#6366f1'] },
  vocabulary: { label: 'Vocabulary', icon: 'library', colors: ['#0ea5e9', '#06b6d4'] },
  reading: { label: 'Reading', icon: 'book', colors: ['#10b981', '#14b8a6'] },
  writing: { label: 'Writing', icon: 'create', colors: ['#f59e0b', '#f97316'] },
  speaking: { label: 'Speaking', icon: 'mic', colors: ['#d946ef', '#f43f5e'] },
};

// Things a learner can choose to improve: the five test skills plus two more.
export const FOCUS_UI: Record<FocusId, Look> = {
  ...SKILLS,
  pronunciation: { label: 'Pronunciation', icon: 'pulse', colors: ['#f43f5e', '#f97316'] },
  listening: { label: 'Listening', icon: 'headset', colors: ['#06b6d4', '#3b82f6'] },
};

// A skill name from the server that this version of the app may not know: fall back to a plain look.
export function focusLook(id: string): Look {
  return FOCUS_UI[id as FocusId] ?? { label: id.charAt(0).toUpperCase() + id.slice(1), icon: 'sparkles', colors: ['#8b5cf6', '#6366f1'] };
}
