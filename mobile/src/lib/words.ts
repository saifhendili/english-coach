export type Token = {
  /** The text as written, including punctuation or the whitespace between words. */
  text: string;
  /** The word to look up (punctuation stripped), or null for whitespace and punctuation-only pieces. */
  word: string | null;
  /** Position among the whitespace-separated pieces, which is what the speech engine counts; -1 for whitespace. */
  index: number;
};

// Splits a message into tappable words. `index` counts every non-space piece (even a lone "—"), so it lines up with the
// character offsets text-to-speech reports while it reads.
export function tokenize(text: string): Token[] {
  let index = -1;
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((piece): Token => {
      if (/^\s+$/.test(piece)) return { text: piece, word: null, index: -1 };
      index += 1;
      const word = piece.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');
      return { text: piece, word: word || null, index };
    });
}
