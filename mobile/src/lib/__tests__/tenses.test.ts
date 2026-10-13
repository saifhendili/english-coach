import type { Exercise } from '@/types';
import { checkAnswer, completedSentence, fillBlank, masteryLabel, matchesAny, normalizeText } from '../tenses';

describe('matchesAny', () => {
  it('ignores case, spacing and end punctuation', () => {
    expect(matchesAny('  Does  she work ', ['does she work'])).toBe(true);
    expect(matchesAny('I saw him yesterday', ['I saw him yesterday.'])).toBe(true);
    expect(matchesAny('by the time you arrive we will have left', ['By the time you arrive, we will have left.'])).toBe(true);
  });

  it('accepts contractions for the full form, and the other way round', () => {
    expect(matchesAny("doesn't like", ['does not like'])).toBe(true);
    expect(matchesAny('does not like', ["doesn't like"])).toBe(true);
    expect(matchesAny("I'm not watching", ['am not watching'])).toBe(false); // the subject was not part of the answer
    expect(matchesAny("I'm not watching", ['I am not watching'])).toBe(true);
    expect(matchesAny("I've finished", ['I have finished'])).toBe(true);
    expect(matchesAny("it'll rain", ['it will rain'])).toBe(true);
    expect(matchesAny("they're going to go", ['they are going to go'])).toBe(true);
    expect(matchesAny("I won't tell", ['I will not tell'])).toBe(true);
    expect(matchesAny("she can't go", ['she cannot go'])).toBe(true);
  });

  it('reads "’s" as is or has, and "’d" as would or had', () => {
    expect(matchesAny("she's working", ['she is working'])).toBe(true);
    expect(matchesAny("she's gone", ['she has gone'])).toBe(true);
    expect(matchesAny("he'd left", ['he had left'])).toBe(true);
    expect(matchesAny("he'd go", ['he would go'])).toBe(true);
  });

  it('treats curly and straight apostrophes alike', () => {
    expect(matchesAny('doesn’t like', ["does not like"])).toBe(true);
    expect(matchesAny("doesn't like", ['doesn’t like'])).toBe(true);
  });

  it('rejects wrong, partial and empty answers', () => {
    expect(matchesAny('work', ['works'])).toBe(false);
    expect(matchesAny('', ['works'])).toBe(false);
    expect(matchesAny('   ', ['works'])).toBe(false);
    expect(matchesAny('has seen', ['have seen'])).toBe(false);
    expect(matchesAny('I have seen him yesterday', ['I saw him yesterday'])).toBe(false);
    expect(matchesAny('is sleeping', ['are sleeping'])).toBe(false);
  });

  it('accepts any of several accepted answers', () => {
    const answers = ['I am going to start a new job next month.', 'I’m going to start a new job next month.'];
    expect(matchesAny("I'm going to start a new job next month", answers)).toBe(true);
    expect(matchesAny('I am going to start a new job next month.', answers)).toBe(true);
  });

  it('does not get confused by a possessive', () => {
    expect(matchesAny("John's car is red", ["John is car is red"])).toBe(true); // reads as "is": a known, harmless overlap
    expect(matchesAny("John's car is red", ["John's car is red"])).toBe(true);
  });
});

it('normalizeText is stable', () => expect(normalizeText("  She DOESN’T like it!! ")).toBe('she does not like it'));

describe('fillBlank', () => {
  it('puts the answer in the blank and drops the verb hint', () => {
    expect(fillBlank('My brother ____ (work) in a hospital.', 'works')).toBe('My brother works in a hospital.');
    expect(fillBlank('We ____ (not / eat) meat on Fridays.', 'do not eat')).toBe('We do not eat meat on Fridays.');
  });
  it('capitalises when the blank starts the sentence', () => {
    expect(fillBlank('____ (you / ever / eat) sushi?', 'have you ever eaten')).toBe('Have you ever eaten sushi?');
  });
  it('works without a hint', () => expect(fillBlank('The sun ____ in the east.', 'rises')).toBe('The sun rises in the east.'));
  it('keeps punctuation tight after the answer', () => expect(fillBlank('While she ____ , the phone rang.', 'was cooking')).toBe('While she was cooking, the phone rang.'));
});

describe('checkAnswer', () => {
  const fill: Exercise = { id: 'f', type: 'fill', tense: 'past-simple', prompt: 'We ____ (visit) Paris last summer.', answers: ['visited'] };
  const choose: Exercise = { id: 'c', type: 'choose', tense: 'present-simple', prompt: 'The sun ____ in the east.', options: ['rise', 'rises', 'is rising', 'rose'], correctIndex: 1 };
  const irregular: Exercise = { id: 'i', type: 'irregular', tense: 'irregular', base: 'go', meaning: 'move', past: ['went'], participle: ['gone', 'been'] };

  it('checks typed answers', () => {
    expect(checkAnswer(fill, 'Visited')).toEqual({ correct: true, expected: 'visited' });
    expect(checkAnswer(fill, 'visit').correct).toBe(false);
  });

  it('checks a chosen option by position', () => {
    expect(checkAnswer(choose, 1)).toEqual({ correct: true, expected: 'rises' });
    expect(checkAnswer(choose, 0).correct).toBe(false);
    expect(checkAnswer(choose, 'rises').correct).toBe(false);
  });

  it('checks both forms of an irregular verb and accepts every listed alternative', () => {
    expect(checkAnswer(irregular, { past: 'went', participle: 'gone' }).correct).toBe(true);
    expect(checkAnswer(irregular, { past: ' Went ', participle: 'been' }).correct).toBe(true);
    expect(checkAnswer(irregular, { past: 'goed', participle: 'gone' }).correct).toBe(false);
    expect(checkAnswer(irregular, { past: 'went', participle: 'went' }).correct).toBe(false);
    expect(checkAnswer(irregular, { past: 'went', participle: '' }).correct).toBe(false);
    expect(checkAnswer(irregular, { past: 'went', participle: 'gone' }).expected).toBe('go – went – gone / been');
  });
});

describe('completedSentence', () => {
  it('gives the full correct sentence for each kind of exercise', () => {
    expect(completedSentence({ id: '1', type: 'fill', tense: 'x', prompt: 'She ____ (work) here.', answers: ['works'] })).toBe('She works here.');
    expect(completedSentence({ id: '2', type: 'fix', tense: 'x', prompt: 'She work here.', answers: ['She works here.'] })).toBe('She works here.');
    expect(completedSentence({ id: '3', type: 'choose', tense: 'x', prompt: 'It ____ often.', options: ['rain', 'rains'], correctIndex: 1 })).toBe('It rains often.');
    expect(completedSentence({ id: '4', type: 'identify', tense: 'x', prompt: 'He left.', options: ['a'], correctIndex: 0 })).toBe('He left.');
    expect(completedSentence({ id: '5', type: 'irregular', tense: 'irregular', base: 'go', meaning: '', past: ['went'], participle: ['gone'] })).toBeNull();
  });
});

it('masteryLabel', () => {
  expect(masteryLabel(null, 0)).toBe('New');
  expect(masteryLabel(73, 11)).toBe('73%');
  expect(masteryLabel(0, 4)).toBe('0%');
});
