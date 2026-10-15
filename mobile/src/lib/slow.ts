import { create } from 'zustand';
import { getServer } from '@/store/auth';

// A free host puts the server to sleep when nobody has used it for a while, and the first request then takes about a minute.
// While that happens the app says so, instead of looking frozen. A slow answer alone does not mean "asleep" (Gemini can take
// 10 seconds), so when a request is slow the app asks the server a tiny question (/api/health): only if even that gets no answer
// is the server waking up.

export const SLOW_AFTER_MS = 6000;
export const PROBE_TIMEOUT_MS = 4000;

export const useWaking = create<{ waking: number }>(() => ({ waking: 0 }));

/** True when the server answers a tiny question quickly. */
export async function serverAnswers(timeoutMs = PROBE_TIMEOUT_MS): Promise<boolean> {
  const server = getServer();
  if (!server) return true; // nothing to ask: leave the normal "cannot reach" message to do its job
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${server}/api/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Runs a request; if it is slow and the server does not answer a health check, shows "waking up" until the request ends. */
export async function watchSlow<T>(work: () => Promise<T>, { after = SLOW_AFTER_MS, probe = serverAnswers }: { after?: number; probe?: () => Promise<boolean> } = {}): Promise<T> {
  let done = false;
  let counted = false;
  const timer = setTimeout(() => {
    void probe().then((answers) => {
      if (answers || done) return; // it answered, or the request finished while we asked
      counted = true;
      useWaking.setState((s) => ({ waking: s.waking + 1 }));
    });
  }, after);
  try {
    return await work();
  } finally {
    done = true;
    clearTimeout(timer);
    if (counted) useWaking.setState((s) => ({ waking: Math.max(0, s.waking - 1) }));
  }
}
