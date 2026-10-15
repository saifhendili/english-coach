import { fetch as streamingFetch } from 'expo/fetch';
import { ApiError, apiUrl, errorFrom, networkError } from '@/lib/api';
import { watchSlow } from '@/lib/slow';
import { useAuth } from '@/store/auth';

// POST that answers with Server-Sent Events. React Native's old fetch could not read a response as it arrives;
// expo/fetch can (response.body.getReader()), which is what makes the coach's reply appear word by word.
// Calls onEvent(name, data) for each event. Rejects with an ApiError if the server answers an ordinary error
// (bad input, 404...) before the stream starts.
export async function streamPost(
  path: string,
  body: unknown,
  { onEvent, signal }: { onEvent: (name: string, data: unknown) => void; signal?: AbortSignal },
): Promise<void> {
  const token = useAuth.getState().token;
  let res: Awaited<ReturnType<typeof streamingFetch>>;
  try {
    res = await watchSlow(() =>
      streamingFetch(apiUrl(path), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
        body: JSON.stringify(body),
        signal,
      }),
    );
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw networkError();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw errorFrom(res.status, res.statusText, data, Boolean(token));
  }
  if (!res.body) throw new ApiError(0, 'NO_STREAM', 'The server answered, but this device cannot read it as a stream.');

  await readEvents(res.body.getReader(), onEvent);
}

type Reader = { read: () => Promise<{ done: boolean; value?: Uint8Array }> };

// Splits a Server-Sent Events byte stream into events. Exported for tests.
export async function readEvents(reader: Reader, onEvent: (name: string, data: unknown) => void): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const name = /^event: (.*)$/m.exec(frame)?.[1];
      const data = /^data: (.*)$/m.exec(frame)?.[1];
      if (name && data) onEvent(name, JSON.parse(data));
    }
  }
}
