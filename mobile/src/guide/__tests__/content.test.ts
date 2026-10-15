import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY, LANGS, LEVELS_INFO, LEVEL_IDS, PLANS, SECTIONS, sectionById, type Block, type Lang, type T } from '../content';
import { HOME_CARD, LOGIN_LINK, UI } from '../strings';

const LANG_IDS = LANGS.map((l) => l.id) as Lang[];
const ARABIC = /[؀-ۿ]/;

// Every text in the guide, with where it is, so a failure says what to fix.
function allTexts(): { where: string; text: T }[] {
  const out: { where: string; text: T }[] = [];
  const add = (where: string, text: T | undefined) => text && out.push({ where, text });
  const block = (where: string, b: Block) => {
    if (b.type === 'p' || b.type === 'tip' || b.type === 'warn') add(`${where} ${b.type}`, b.text);
    if (b.type === 'steps' || b.type === 'bullets') {
      add(`${where} ${b.type} title`, b.title);
      b.items.forEach((item, i) => add(`${where} ${b.type} #${i + 1}`, item));
    }
    if (b.type === 'link') add(`${where} link`, b.label);
    if (b.type === 'faq') b.items.forEach((item, i) => (add(`${where} faq #${i + 1} question`, item.q), add(`${where} faq #${i + 1} answer`, item.a)));
  };
  for (const s of SECTIONS) {
    add(`${s.id} title`, s.title);
    add(`${s.id} summary`, s.summary);
    add(`${s.id} go`, s.go?.label);
    s.blocks.forEach((b) => block(s.id, b));
  }
  for (const id of LEVEL_IDS) {
    add(`level ${id} name`, LEVELS_INFO[id].name);
    add(`level ${id} canDo`, LEVELS_INFO[id].canDo);
    add(`plan ${id} focus`, PLANS[id].focus);
    add(`plan ${id} goal`, PLANS[id].goal);
    PLANS[id].daily.forEach((d, i) => add(`plan ${id} day #${i + 1}`, d.text));
  }
  Object.entries(UI).forEach(([k, v]) => add(`UI.${k}`, v));
  Object.entries(HOME_CARD).forEach(([k, v]) => add(`HOME_CARD.${k}`, v));
  add('LOGIN_LINK', LOGIN_LINK);
  return out;
}

describe('the guide is complete in every language', () => {
  const texts = allTexts();

  it('has a good amount of text', () => expect(texts.length).toBeGreaterThan(150));

  it('has something written for every text in English, French and Arabic', () => {
    const missing = texts.filter(({ text }) => LANG_IDS.some((l) => !text[l]?.trim())).map((t) => t.where);
    expect(missing).toEqual([]);
  });

  it('writes the Arabic in Arabic and the French differently from the English', () => {
    const notArabic = texts.filter(({ text }) => !ARABIC.test(text.ar)).map((t) => t.where);
    expect(notArabic).toEqual([]);
    // a sentence (3+ words) that is identical in French and English was probably never translated
    const untranslated = texts.filter(({ text }) => text.en.split(/\s+/).length >= 4 && text.fr === text.en).map((t) => t.where);
    expect(untranslated).toEqual([]);
  });

  it('has no text with doubled spaces, a leading or trailing space, or a leftover placeholder', () => {
    const bad = texts.flatMap(({ where, text }) => LANG_IDS.filter((l) => /\s{2,}|^\s|\s$|TODO|XXX|\{\w+\}/.test(text[l])).map((l) => `${where} (${l})`));
    expect(bad).toEqual([]);
  });

  it('writes Arabic punctuation correctly: no Latin question mark or comma right after Arabic letters', () => {
    const bad = texts.filter(({ text }) => /[؀-ۿ][?,]/.test(text.ar)).map((t) => t.where);
    expect(bad).toEqual([]);
  });
});

describe('structure', () => {
  it('has unique section ids, starting with the welcome', () => {
    const ids = SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('welcome');
    expect(ids).toEqual(expect.arrayContaining(['setup', 'key', 'level', 'interests', 'chat', 'voice', 'grammar', 'phrases', 'review', 'topics', 'progress', 'settings', 'plan', 'words', 'help']));
    expect(sectionById('chat')?.id).toBe('chat');
    expect(sectionById('nope')).toBeUndefined();
  });

  it('explains the beginner path in the right order: account and language, key, level, interests', () => {
    const ids = SECTIONS.map((s) => s.id);
    expect(ids.indexOf('setup')).toBeLessThan(ids.indexOf('key'));
    expect(ids.indexOf('key')).toBeLessThan(ids.indexOf('level'));
    expect(ids.indexOf('level')).toBeLessThan(ids.indexOf('interests'));
    expect(ids.indexOf('interests')).toBeLessThan(ids.indexOf('chat'));
  });

  it('gives every level a plan with a sensible day', () => {
    for (const id of LEVEL_IDS) {
      const plan = PLANS[id];
      expect(plan.daily.length).toBeGreaterThanOrEqual(3);
      const minutes = plan.daily.reduce((n, d) => n + d.minutes, 0);
      expect(minutes).toBeGreaterThanOrEqual(10);
      expect(minutes).toBeLessThanOrEqual(35);
      expect(plan.daily.every((d) => d.minutes > 0)).toBe(true);
      expect(LEVELS_INFO[id].name.en).toBeTruthy();
    }
  });

  it('has a French and an Arabic word for every word of the glossary, with no duplicates', () => {
    expect(GLOSSARY.length).toBeGreaterThan(30);
    expect(new Set(GLOSSARY.map((g) => g.en)).size).toBe(GLOSSARY.length);
    expect(GLOSSARY.every((g) => g.en && g.fr && ARABIC.test(g.ar))).toBe(true);
  });

  it('opens real screens, and marks tabs correctly', () => {
    const tabs = ['/chat', '/grammar', '/phrases', '/review', '/topics'];
    for (const s of SECTIONS) {
      if (!s.go) continue;
      expect(s.go.tab).toBe(tabs.includes(s.go.href));
    }
  });

  it('links only to Google AI Studio over https', () => {
    const links = SECTIONS.flatMap((s) => s.blocks.filter((b) => b.type === 'link')) as Extract<Block, { type: 'link' }>[];
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) expect(l.url).toMatch(/^https:\/\/aistudio\.google\.com\//);
  });
});

// A guide that names a button that no longer exists is worse than no guide. Every “quoted” English word that is a label of the
// app must really appear in the app's source. The rest (example sentences, and names that come from the server) are listed here.
describe('the guide names things that exist in the app', () => {
  const NOT_IN_THE_APP = new Set([
    // examples to type or say
    'Hello', 'I like football', 'I like football.', 'I am from Morocco', 'How do you say pomme in English?', 'Please use easy words.', 'Let’s role-play a job interview.', 'To be honest, …',
    // categories of phrases, and tense names: they come from the server
    'Starting your answer', 'Agreeing politely', 'Connecting ideas', 'Giving opinions', 'Sounding sure', 'Storytelling', 'Explaining', 'Natural word pairs',
    'Present simple', 'Present continuous', 'Past simple', 'Past continuous', 'Present perfect', 'Future with will', 'Future with going to',
    // Google's page, and answers the server gives
    'AIza', 'Create API key', 'Create API key in new project', 'Valid', 'daily limit', 'too many requests', 'Too many requests',
    // names of the tenses' kinds and tabs, which are written in the headings of the screens
    'perfect continuous', 'going to',
  ]);

  function sources(dir: string): string {
    return readdirSync(dir)
      .flatMap((name) => {
        const path = join(dir, name);
        if (name === 'guide' || name === '__tests__') return [];
        return statSync(path).isDirectory() ? [sources(path)] : /\.(tsx?|ts)$/.test(name) ? [readFileSync(path, 'utf8')] : [];
      })
      .join('\n');
  }

  it('only quotes labels that appear in the screens', () => {
    const code = sources(join(__dirname, '..', '..'));
    const english: string[] = [];
    for (const s of SECTIONS) {
      const grab = (t: T) => english.push(t.en);
      s.blocks.forEach((b) => {
        if (b.type === 'p' || b.type === 'tip' || b.type === 'warn') grab(b.text);
        if (b.type === 'steps' || b.type === 'bullets') b.items.forEach(grab);
        if (b.type === 'faq') b.items.forEach((i) => (grab(i.q), grab(i.a)));
      });
    }
    Object.values(PLANS).forEach((p) => p.daily.forEach((d) => english.push(d.text.en)));

    const quoted = [...new Set(english.flatMap((e) => [...e.matchAll(/“([^”]+)”/g)].map((m) => m[1])))];
    // a quote can also point to a section of the guide itself (“Get your free Gemini key”)
    const ownTitles = new Set(SECTIONS.map((s) => s.title.en));
    const missing = quoted.filter((q) => !NOT_IN_THE_APP.has(q) && !ownTitles.has(q) && !code.includes(q) && !code.includes(q.replace(/’/g, "'")) && !code.includes(q.replace(/’/g, '\\u2019')));
    expect(missing).toEqual([]);
  });
});
