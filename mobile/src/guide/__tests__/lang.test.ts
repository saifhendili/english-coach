import { chooseLang, isLang, isRtl, langFromLocale } from '../lang';

describe('langFromLocale', () => {
  it('reads the language of a locale, however it is written', () => {
    expect(langFromLocale('fr-FR')).toBe('fr');
    expect(langFromLocale('ar_MA')).toBe('ar');
    expect(langFromLocale('AR')).toBe('ar');
    expect(langFromLocale('en-GB')).toBe('en');
  });
  it('gives null for a language the guide is not written in', () => {
    expect(langFromLocale('es-ES')).toBeNull();
    expect(langFromLocale('')).toBeNull();
    expect(langFromLocale(undefined)).toBeNull();
    expect(langFromLocale(null)).toBeNull();
  });
});

describe('chooseLang', () => {
  it('prefers what the learner chose last time', () => {
    expect(chooseLang({ stored: 'ar', device: 'fr-FR', account: 'en' })).toBe('ar');
  });
  it('then the language of the phone', () => {
    expect(chooseLang({ stored: null, device: 'fr-FR', account: 'ar' })).toBe('fr');
  });
  it('then the language the coach explains in (set on the account)', () => {
    expect(chooseLang({ stored: null, device: 'es-ES', account: 'ar' })).toBe('ar');
  });
  it('and English when nothing else is known', () => {
    expect(chooseLang({})).toBe('en');
    expect(chooseLang({ stored: 'xx', device: 'de-DE', account: 'zz' })).toBe('en');
  });
});

it('only Arabic is right to left', () => {
  expect(isRtl('ar')).toBe(true);
  expect(isRtl('fr')).toBe(false);
  expect(isRtl('en')).toBe(false);
});

it('isLang', () => {
  expect(isLang('fr')).toBe(true);
  expect(isLang('de')).toBe(false);
  expect(isLang(undefined)).toBe(false);
});
