import { useState } from 'react';
import type { Tts } from '@/hooks/useTts';
import { GENERIC_SITUATIONS } from '@/lib/saved';
import type { PhraseCategory } from '@/types';
import { PracticeSheet, type PracticeTarget } from './PracticeSheet';

// The practice drill for any phrase: `open(phrase)` shows the sheet, `sheet` goes at the end of the screen.
// A phrase with a category practises with that category's situations, any other with everyday ones.
export function usePracticeSheet(book: PhraseCategory[] | undefined, tts: Tts) {
  const [practicing, setPracticing] = useState<{ phrase: PracticeTarget; categoryId: string } | null>(null);

  const open = (phrase: PracticeTarget & { category?: string }, fallbackCategory?: string) =>
    setPracticing({ phrase: { text: phrase.text, usage: phrase.usage }, categoryId: phrase.category || fallbackCategory || '' });

  const sheet = practicing ? (
    <PracticeSheet
      key={practicing.phrase.text}
      phrase={practicing.phrase}
      categoryId={practicing.categoryId}
      situations={book?.find((c) => c.id === practicing.categoryId)?.situations ?? GENERIC_SITUATIONS}
      tts={tts}
      onClose={() => setPracticing(null)}
    />
  ) : null;

  return { open, sheet };
}
