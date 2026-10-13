import { FIELD_GROUPS, SEED_NAMES, tidyName } from '../fields';

describe('tidyName', () => {
  it('collapses spaces and trims', () => expect(tidyName('  Street   Food ')).toBe('Street Food'));
  it('gives all-lowercase input Title Case', () => expect(tidyName('board games')).toBe('Board Games'));
  it('leaves deliberate capitals alone', () => expect(tidyName('iOS apps')).toBe('iOS apps'));
  it('does not shout', () => expect(tidyName('AI')).toBe('AI'));
  it('copes with an empty string', () => expect(tidyName('   ')).toBe(''));
});

describe('seed fields', () => {
  it('has seven groups of six, with no duplicate names', () => {
    expect(FIELD_GROUPS).toHaveLength(7);
    expect(FIELD_GROUPS.every((g) => g.fields.length === 6)).toBe(true);
    expect(SEED_NAMES.size).toBe(42);
  });
});
