import type { Lang } from './content';

const SUPPORTED: Lang[] = ['en', 'fr', 'ar'];

export const isLang = (value: unknown): value is Lang => typeof value === 'string' && (SUPPORTED as string[]).includes(value);

/** "fr-FR" -> "fr", "ar_MA" -> "ar"; null when the guide is not written in that language. */
export function langFromLocale(locale: string | null | undefined): Lang | null {
  const base = locale?.toLowerCase().split(/[-_]/)[0];
  return isLang(base) ? base : null;
}

export function deviceLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

/**
 * Which language the guide opens in: what the learner chose last time, else the language of the phone, else the language the
 * coach explains mistakes in (when signed in), else English. The phone comes before the account because the account language
 * starts as French for everybody until it is changed.
 */
export function chooseLang({ stored, device, account }: { stored?: string | null; device?: string | null; account?: string | null }): Lang {
  if (isLang(stored)) return stored;
  return langFromLocale(device) ?? (isLang(account) ? account : 'en');
}

export const isRtl = (lang: Lang): boolean => lang === 'ar';
