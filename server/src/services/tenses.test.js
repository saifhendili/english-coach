import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TENSES, tenseById } from '../data/tenses.js';
import { TENSE_EXERCISES } from '../data/tense-exercises.js';
import { accuracy, cleanGenerated, exercisesFor, identifyOptions, pickItems, recommend, serve, shuffle, weakness } from './tenses.js';

// A repeatable "random" so the tests never flake.
const seeded = (seed = 1) => () => {
  seed = (seed + 0x6d2b79f5) | 0; // mulberry32
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

test('shuffle keeps every element and does not change the input', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const out = shuffle(input, seeded(3));
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5, 6]);
});

test('"which tense": four different names, the right one at correctIndex, the usual confusion included', () => {
  for (const t of TENSES) {
    const { options, correctIndex } = identifyOptions(t.id, seeded(7));
    assert.equal(new Set(options).size, 4, t.id);
    assert.equal(options[correctIndex], t.name);
    assert.ok(options.includes(tenseById(t.contrast.with).name), `${t.id} should offer ${t.contrast.with}`);
  }
});

test('serving a choose exercise shuffles it and tracks the right answer', () => {
  const ex = TENSE_EXERCISES.find((e) => e.type === 'choose');
  const positions = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const served = serve(ex, seeded(seed));
    assert.equal(served.options.length, 4);
    assert.equal(served.options[served.correctIndex], ex.answer);
    positions.add(served.correctIndex);
  }
  assert.ok(positions.size > 1, 'the right answer should not always sit in the same place');
});

test('serving never leaks internal fields and keeps the answers a fill needs', () => {
  const fillEx = TENSE_EXERCISES.find((e) => e.type === 'fill');
  const served = serve(fillEx);
  assert.deepEqual(Object.keys(served).sort(), ['answers', 'id', 'prompt', 'tense', 'type', 'why']);
  const choose = serve(TENSE_EXERCISES.find((e) => e.type === 'choose'));
  assert.ok(!('answer' in choose) && !('wrong' in choose));
});

test('exercisesFor: one tense, or all of them for mixed', () => {
  assert.ok(exercisesFor('past-simple').every((e) => e.tense === 'past-simple'));
  assert.equal(exercisesFor('mixed').length, TENSE_EXERCISES.length);
});

const pool = [{ id: 'a', tense: 't1' }, { id: 'b', tense: 't1' }, { id: 'c', tense: 't1' }, { id: 'd', tense: 't1' }];

test('picks what was missed first, then what is new, then what was right the longest ago', () => {
  const itemStats = new Map([
    ['a', { lastCorrect: true, lastAt: '2026-10-10' }],
    ['b', { lastCorrect: false, lastAt: '2026-10-12' }],
    ['c', { lastCorrect: true, lastAt: '2026-10-01' }],
    // d: never seen
  ]);
  const order = (n) => pickItems({ pool, itemStats, count: n, rng: seeded(5) }).map((e) => e.id);
  assert.deepEqual(order(1), ['b']);
  assert.deepEqual(new Set(order(2)), new Set(['b', 'd']));
  assert.deepEqual(new Set(order(3)), new Set(['b', 'd', 'c'])); // c was right longer ago than a
  assert.equal(order(10).length, 4, 'never more than the pool');
});

test('a fresh learner gets a full set of different items', () => {
  const picked = pickItems({ pool: TENSE_EXERCISES, count: 10, rng: seeded(11) });
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked.map((e) => e.id)).size, 10);
});

test('mixed practice leans towards the weaker tense', () => {
  const two = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, tense: 'strong' })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, tense: 'weak' })),
  ];
  const tenseStats = new Map([['strong', { attempts: 20, correct: 19 }], ['weak', { attempts: 20, correct: 6 }]]);
  let weakCount = 0;
  for (let seed = 1; seed <= 40; seed++) weakCount += pickItems({ pool: two, tenseStats, count: 6, rng: seeded(seed) }).filter((e) => e.tense === 'weak').length;
  assert.ok(weakCount / 40 > 4, `expected mostly weak items, got ${weakCount / 40} of 6`);
});

test('accuracy and weakness', () => {
  assert.equal(accuracy({ attempts: 8, correct: 6 }), 75);
  assert.equal(accuracy({ attempts: 0, correct: 0 }), null);
  assert.equal(accuracy(undefined), null);
  assert.equal(weakness({ attempts: 10, correct: 2 }), 0.8);
  assert.equal(weakness({ attempts: 2, correct: 0 }), 0.5, 'too few answers to judge');
  assert.equal(weakness(undefined), 0.5);
});

test('recommend: the weakest practised tense wins', () => {
  const stats = new Map([
    ['present-simple', { attempts: 10, correct: 9 }],
    ['past-simple', { attempts: 10, correct: 5 }],
    ['present-perfect', { attempts: 10, correct: 7 }],
  ]);
  assert.deepEqual(recommend({ level: 'B1', stats }), { tense: 'past-simple', reason: 'weakest' });
});

test('recommend: with no weak tense, the first untouched lesson of the learner’s level', () => {
  assert.deepEqual(recommend({ level: 'A1', stats: new Map() }), { tense: 'present-simple', reason: 'next' });
  const stats = new Map([['present-simple', { attempts: 10, correct: 10 }], ['present-continuous', { attempts: 10, correct: 9 }]]);
  assert.deepEqual(recommend({ level: 'A1', stats }), { tense: null, reason: 'done' }, 'an A1 learner has no more A1 tenses');
  assert.equal(recommend({ level: 'A2', stats }).tense, 'past-simple');
});

test('recommend: a few wrong answers are not enough to call a tense weak', () => {
  const stats = new Map([['present-simple', { attempts: 3, correct: 0 }]]);
  assert.equal(recommend({ level: 'A1', stats }).reason, 'next');
});

// ---- Gemini's exercises ----

const raw = (over) => ({ type: 'fill', prompt: 'My friend ____ (play) chess every Sunday.', answers: ['plays'], answer: '', wrong: [], why: 'He / she / it needs -s.', ...over });

test('keeps a good fill, choose and fix exercise', () => {
  const out = cleanGenerated(
    {
      exercises: [
        raw(),
        raw({ type: 'choose', prompt: 'She ____ chess on Sundays.', answers: [], answer: 'plays', wrong: ['play', 'played', 'playing'] }),
        raw({ type: 'fix', prompt: 'He play chess on Sundays.', answers: ['He plays chess on Sundays.'] }),
      ],
    },
    { tense: 'present-simple', count: 5 },
  );
  assert.deepEqual(out.map((e) => e.type), ['fill', 'choose', 'fix']);
  assert.ok(out.every((e) => e.ai === true && e.id.startsWith('ai:present-simple:') && e.tense === 'present-simple'));
  const choose = out[1];
  assert.equal(choose.options[choose.correctIndex], 'plays');
  assert.equal(choose.options.length, 4);
});

test('drops exercises that could mislead a learner', () => {
  const bad = [
    raw({ prompt: 'He plays chess every Sunday.' }), // no blank
    raw({ prompt: 'He ____ chess and ____ tennis.' }), // two blanks
    raw({ answers: [] }), // nothing to check against
    raw({ answers: ['  '] }),
    raw({ type: 'choose', prompt: 'She ____ chess.', answer: 'plays', wrong: ['play', 'played'], answers: [] }), // only two wrong options
    raw({ type: 'choose', prompt: 'She ____ chess.', answer: 'plays', wrong: ['plays', 'Plays', 'play'], answers: [] }), // wrong options repeat the answer
    raw({ type: 'fix', prompt: 'He plays chess.', answers: ['he plays chess.'] }), // "fix" that changes nothing
    raw({ why: '' }),
    raw({ type: 'essay' }),
  ];
  assert.deepEqual(cleanGenerated({ exercises: bad }, { tense: 'present-simple', count: 9 }), []);
});

test('drops repeats of the bank or of itself, and caps the count', () => {
  const avoid = ['My friend ____ (play) chess every Sunday.'];
  const out = cleanGenerated(
    { exercises: [raw(), raw({ prompt: 'Anna ____ (read) a book each night.', answers: ['reads'] }), raw({ prompt: 'anna ____ (read) a book each night.', answers: ['reads'] }), raw({ prompt: 'Tom ____ (swim) daily.', answers: ['swims'] })] },
    { tense: 'present-simple', avoid, count: 1 },
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].prompt, 'Anna ____ (read) a book each night.');
});

test('copes with a missing or empty reply', () => {
  assert.deepEqual(cleanGenerated(null, { tense: 'past-simple', count: 3 }), []);
  assert.deepEqual(cleanGenerated({}, { tense: 'past-simple', count: 3 }), []);
});
