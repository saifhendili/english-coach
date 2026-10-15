import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { chooseLang, deviceLocale } from '@/guide/lang';
import type { Lang } from '@/guide/content';
import { storage } from '@/lib/storage';
import { useAuth } from '@/store/auth';

const KEY = 'guide:lang';

// The guide's language: the learner's last choice, else the phone's language, else the coach's language. Works before sign-in.
export function useGuideLang() {
  const token = useAuth((s) => s.token);
  const settings = useSettings(Boolean(token));
  const [stored, setStored] = useState<string | null | undefined>(undefined); // undefined: not read yet

  useEffect(() => {
    let alive = true;
    void storage.get(KEY).then((value) => alive && setStored(value));
    return () => {
      alive = false;
    };
  }, []);

  const lang = chooseLang({ stored, device: deviceLocale(), account: settings.data?.nativeLang });
  const setLang = useCallback((next: Lang) => {
    setStored(next);
    void storage.set(KEY, next);
  }, []);

  return { lang, setLang, ready: stored !== undefined, signedIn: Boolean(token), settings };
}
