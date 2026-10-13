import { segments } from '../markup';
import { savedKey } from '../saved';

describe('savedKey (must match the server)', () => {
  it('ignores case, curly quotes, trailing punctuation and extra spaces', () => {
    expect(savedKey('To be honest,')).toBe('to be honest');
    expect(savedKey('  I’m fairly   confident that… ')).toBe("i'm fairly confident that");
    expect(savedKey('Relatable!')).toBe('relatable');
  });
  it('keeps punctuation inside', () => {
    expect(savedKey("Off the top of my head, it's two hours")).toBe("off the top of my head, it's two hours");
  });
});

describe('segments', () => {
  const join = (parts: { text: string }[]) => parts.map((p) => p.text).join('');

  it('flags the wrong words and keeps the rest of the sentence', () => {
    const parts = segments('Last week I use AI for write my essay', ['use', 'for write']);
    expect(join(parts)).toBe('Last week I use AI for write my essay');
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(['use', 'for write']);
  });
  it('falls back to ignoring case, and ignores fragments that are not there', () => {
    expect(segments('First thing came up', ['first thing']).filter((p) => p.hit).map((p) => p.text)).toEqual(['First thing']);
    expect(segments('Hello there', ['goodbye'])).toEqual([{ text: 'Hello there', hit: false }]);
  });
  it('never duplicates text when fragments overlap, and skips empty ones', () => {
    const parts = segments('I am very happy', ['am very', 'very happy']);
    expect(join(parts)).toBe('I am very happy');
    expect(parts.filter((p) => p.hit)).toHaveLength(1);
    expect(segments('Hi', ['', undefined])).toEqual([{ text: 'Hi', hit: false }]);
  });
});
