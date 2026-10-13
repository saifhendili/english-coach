import { cardMode, clozeParts, matchesAnswer, normalizeAnswer, suggestedRating } from '../review';

describe('matchesAnswer', () => {
  it('ignores quotes, case, punctuation and spacing', () => {
    expect(matchesAnswer("i'm fairly confident that", 'I’m fairly confident that…')).toBe(true);
    expect(matchesAnswer('  The first   thing that comes to mind is ', 'The first thing that comes to mind is…')).toBe(true);
    expect(matchesAnswer('to be honest,', 'To be honest, …')).toBe(true);
    expect(matchesAnswer('ate', 'ate')).toBe(true);
  });

  it('ignores an optional (that)', () => expect(matchesAnswer('chances are', 'Chances are (that)…')).toBe(true));

  it('rejects wrong or empty answers', () => {
    expect(matchesAnswer('eated', 'ate')).toBe(false);
    expect(matchesAnswer('', 'ate')).toBe(false);
    expect(matchesAnswer('   ', 'ate')).toBe(false);
    expect(matchesAnswer('i am fairly sure', 'I’m fairly confident that…')).toBe(false);
  });
});

it('normalizeAnswer strips punctuation and extra spaces', () => expect(normalizeAnswer('  Hello,   WORLD!! ')).toBe('hello world'));

describe('clozeParts', () => {
  it('cuts the phrase out of its example, keeping the original spelling around it', () => {
    expect(clozeParts('I’m fairly confident that the train leaves at nine.', 'I’m fairly confident that…')).toEqual({ before: '', match: 'I’m fairly confident that', after: ' the train leaves at nine.' });
    const mid = clozeParts('Sorry, but off the top of my head, it takes two hours.', 'Off the top of my head, …');
    expect(mid).toEqual({ before: 'Sorry, but ', match: 'off the top of my head', after: ', it takes two hours.' });
  });

  it('treats curly and straight apostrophes alike', () => expect(clozeParts("I'm pretty sure he lives in Lyon.", 'I’m pretty sure…')?.match).toBe("I'm pretty sure"));

  it('finds a whole word, never a piece of a longer one', () => {
    expect(clozeParts('He convinced me.', 'convince')).toBeNull();
    expect(clozeParts('I was convinced. Then I convince others.', 'convince')?.before).toBe('I was convinced. Then I ');
  });

  it('gives null for no example, no text, or text that is too short', () => {
    expect(clozeParts('', 'word')).toBeNull();
    expect(clozeParts(null, 'word')).toBeNull();
    expect(clozeParts('A sentence.', 'a')).toBeNull();
    expect(clozeParts('A sentence.', undefined)).toBeNull();
  });
});

describe('cardMode', () => {
  it('is mistake for mistakes, cloze when the example holds the text, else recall', () => {
    expect(cardMode({ kind: 'mistake' })).toBe('mistake');
    expect(cardMode({ kind: 'saved', text: 'relatable', example: 'That sounds very relatable!' })).toBe('cloze');
    expect(cardMode({ kind: 'saved', text: 'relatable', example: 'Nothing here.' })).toBe('recall');
    expect(cardMode({ kind: 'saved', text: 'relatable', example: '' })).toBe('recall');
  });
});

it('suggestedRating: right is Good, wrong is Again', () => {
  expect(suggestedRating(true)).toBe(3);
  expect(suggestedRating(false)).toBe(1);
});
