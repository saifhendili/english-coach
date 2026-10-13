import { ApiError, hooks } from './api';
import { useAuth } from '../store/auth';

// POST that answers with Server-Sent Events (EventSource cannot POST).
// Calls onEvent(name, data) for each event. Rejects with an ApiError if the server answers an
// ordinary error (bad input, 404...) before the stream starts.
export async function streamPost(path, body, { onEvent, signal }) {
  const token = useAuth.getState().token;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection.');
  }

  if (!res.ok) {
    const e = (await res.json().catch(() => null))?.error ?? {};
    if (res.status === 401 && token) useAuth.getState().logout();
    if (e.code === 'KEY_MISSING') hooks.onKeyMissing?.();
    throw new ApiError(res.status, e.code ?? 'UNKNOWN', e.message ?? res.statusText, e);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const name = /^event: (.*)$/m.exec(frame)?.[1];
      const data = /^data: (.*)$/m.exec(frame)?.[1];
      if (name && data) onEvent(name, JSON.parse(data));
    }
  }
}
