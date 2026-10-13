import { tokenize } from '../words';

describe('tokenize', () => {
  it('separates words from the spaces between them and strips punctuation for lookup', () => {
    expect(tokenize('Hello, world!')).toEqual([
      { text: 'Hello,', word: 'Hello', index: 0 },
      { text: ' ', word: null, index: -1 },
      { text: 'world!', word: 'world', index: 1 },
    ]);
  });

  it('keeps apostrophes inside a word and drops quotes around it', () => {
    expect(tokenize('“Don’t” go').map((t) => t.word)).toEqual(['Don’t', null, 'go']);
  });

  it('counts a punctuation-only piece in the index so it matches the speech engine', () => {
    const tokens = tokenize('Wait — what?').filter((t) => t.index >= 0);
    expect(tokens.map((t) => [t.text, t.word, t.index])).toEqual([['Wait', 'Wait', 0], ['—', null, 1], ['what?', 'what', 2]]);
  });

  it('handles runs of whitespace, newlines and empty text', () => {
    expect(tokenize('a  \n b').map((t) => t.index)).toEqual([0, -1, 1]);
    expect(tokenize('')).toEqual([]);
  });

  it('loses nothing: the pieces join back to the original text', () => {
    const text = 'Going to the park sounds like a lovely way to spend the day!  What did you guys do there?';
    expect(tokenize(text).map((t) => t.text).join('')).toBe(text);
  });
});
