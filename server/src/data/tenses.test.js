import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IRREGULAR_VERBS } from './irregular-verbs.js';
import { TENSE_EXERCISES } from './tense-exercises.js';
import { TENSES, TENSE_LEVELS, TENSE_TIMES, tenseById } from './tenses.js';

const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const blanks = (s) => (s.match(/____/g) ?? []).length;

test('there are twelve tenses in three times, with unique ids', () => {
  assert.equal(TENSES.length, 12);
  assert.equal(new Set(TENSES.map((t) => t.id)).size, 12);
  for (const time of TENSE_TIMES) assert.ok(TENSES.filter((t) => t.time === time).length >= 3, time);
});

test('every lesson is complete', () => {
  for (const t of TENSES) {
    assert.ok(TENSE_TIMES.includes(t.time), `${t.id}: time`);
    assert.ok(TENSE_LEVELS.includes(t.level), `${t.id}: level`);
    assert.ok(t.name && t.summary, t.id);
    for (const k of ['affirmative', 'negative', 'question']) {
      assert.ok(t.form[k] && t.formExamples[k], `${t.id}: form ${k}`);
    }
    assert.ok(t.uses.length >= 2 && t.uses.every((u) => u.rule && u.example), `${t.id}: uses`);
    assert.ok(t.signals.length >= 3, `${t.id}: signals`);
    assert.ok(t.mistakes.length >= 2, `${t.id}: mistakes`);
    for (const m of t.mistakes) {
      assert.ok(m.wrong && m.right && m.why, `${t.id}: mistake`);
      assert.notEqual(norm(m.wrong), norm(m.right), `${t.id}: "${m.wrong}" is not corrected`);
    }
  }
});

test('each lesson compares itself with a different, existing tense', () => {
  for (const t of TENSES) {
    assert.ok(tenseById(t.contrast.with), `${t.id}: contrast with ${t.contrast.with}`);
    assert.notEqual(t.contrast.with, t.id);
    assert.ok(t.contrast.tip.length > 20, t.id);
  }
});

test('timelines only use known shapes and stay on the line', () => {
  for (const t of TENSES) {
    assert.ok(t.timeline.marks.length >= 1, t.id);
    for (const m of t.timeline.marks) {
      assert.ok(['ticks', 'bar', 'dot'].includes(m.type), `${t.id}: ${m.type}`);
      const places = m.type === 'ticks' ? m.at : m.type === 'bar' ? [m.from, m.to] : [m.at];
      assert.ok(places.every((p) => p >= 0 && p <= 100), `${t.id}: off the line`);
      if (m.type === 'bar') assert.ok(m.from < m.to, `${t.id}: bar runs backwards`);
    }
  }
});

test('the example in each "form" sentence and each use is a real sentence', () => {
  for (const t of TENSES) {
    for (const s of [...Object.values(t.formExamples), ...t.uses.map((u) => u.example)]) assert.match(s, /[.?!]$/, `${t.id}: "${s}"`);
  }
});

test('every tense has enough exercises of every kind', () => {
  for (const t of TENSES) {
    const mine = TENSE_EXERCISES.filter((e) => e.tense === t.id);
    // 12 or more, so a full session of ten still has variety and a second session is mostly new.
    assert.ok(mine.length >= 12, `${t.id}: ${mine.length} exercises`);
    for (const type of ['fill', 'choose', 'fix', 'identify']) assert.ok(mine.filter((e) => e.type === type).length >= 2, `${t.id}: fewer than two ${type}`);
  }
});

test('exercise ids are unique and every exercise has a reason', () => {
  assert.equal(new Set(TENSE_EXERCISES.map((e) => e.id)).size, TENSE_EXERCISES.length);
  assert.equal(new Set(TENSE_EXERCISES.map((e) => norm(e.prompt))).size, TENSE_EXERCISES.length, 'a prompt is repeated');
  for (const e of TENSE_EXERCISES) assert.ok(e.why && e.why.length > 10, e.id);
});

test('fill exercises have exactly one blank, a verb hint and at least one answer', () => {
  for (const e of TENSE_EXERCISES.filter((x) => x.type === 'fill')) {
    assert.equal(blanks(e.prompt), 1, e.prompt);
    assert.match(e.prompt, /\(.+\)/, `no verb hint: ${e.prompt}`);
    assert.ok(e.answers.length >= 1 && e.answers.every((a) => a.trim()), e.prompt);
  }
});

test('multiple choice has one blank, three distinct wrong options, none equal to the answer', () => {
  for (const e of TENSE_EXERCISES.filter((x) => x.type === 'choose')) {
    assert.equal(blanks(e.prompt), 1, e.prompt);
    assert.equal(e.wrong.length, 3, e.prompt);
    const all = [e.answer, ...e.wrong].map(norm);
    assert.equal(new Set(all).size, 4, `duplicate option: ${e.prompt}`);
  }
});

test('fix exercises really contain a mistake, and the fix differs from it', () => {
  for (const e of TENSE_EXERCISES.filter((x) => x.type === 'fix')) {
    assert.ok(e.answers.length >= 1);
    for (const a of e.answers) assert.notEqual(norm(a), norm(e.prompt), e.prompt);
  }
});

test('"which tense" sentences carry no blank', () => {
  for (const e of TENSE_EXERCISES.filter((x) => x.type === 'identify')) assert.equal(blanks(e.prompt), 0, e.prompt);
});

test('the "mistake" in a lesson is not the sentence of its own exercise answer', () => {
  // A lesson's wrong example must never appear as a correct answer in the bank.
  const correct = new Set(TENSE_EXERCISES.flatMap((e) => (e.type === 'fix' ? e.answers : [])).map(norm));
  for (const t of TENSES) for (const m of t.mistakes) assert.ok(!correct.has(norm(m.wrong)), m.wrong);
});

test('irregular verbs are complete and unique', () => {
  assert.ok(IRREGULAR_VERBS.length >= 90);
  assert.equal(new Set(IRREGULAR_VERBS.map((v) => v.base)).size, IRREGULAR_VERBS.length);
  assert.equal(new Set(IRREGULAR_VERBS.map((v) => v.id)).size, IRREGULAR_VERBS.length);
  for (const v of IRREGULAR_VERBS) {
    assert.ok(v.past.length >= 1 && v.participle.length >= 1 && v.meaning, v.base);
    assert.ok([...v.past, ...v.participle].every((f) => f && f === f.toLowerCase()), v.base);
  }
});

test('well-known verbs have the right forms', () => {
  const get = (b) => IRREGULAR_VERBS.find((v) => v.base === b);
  assert.deepEqual([get('go').past, get('go').participle[0]], [['went'], 'gone']);
  assert.deepEqual([get('write').past, get('write').participle], [['wrote'], ['written']]);
  assert.deepEqual(get('be').past, ['was', 'were']);
  assert.ok(get('get').participle.includes('gotten') && get('get').participle.includes('got'));
  assert.ok(get('learn').past.includes('learned') && get('learn').past.includes('learnt'));
});
