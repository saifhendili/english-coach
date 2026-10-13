import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { streamPost } from '@/lib/stream';
import type { ChatMessage, ChatSession } from '@/types';

export type TurnFailure = { code?: string; message: string };
export type TurnResult = 'sent' | 'failed' | 'aborted';

type DoneEvent = { turns: number; userMessage: ChatMessage; assistantMessage: ChatMessage };

// One learner message → the coach's streamed reply. While it streams, `pending` holds both sides so the screen can show
// them; when it finishes they are written into the cached session. If anything fails nothing was saved on the server, so
// the caller gets 'failed' and can put the text back in the box.
export function useChatTurn(sessionId: string, { onReply }: { onReply?: (reply: ChatMessage, turns: number) => void } = {}) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<{ user: string; bot: string } | null>(null);
  const [error, setError] = useState<TurnFailure | null>(null);
  const controller = useRef<AbortController | null>(null);
  const onReplyRef = useRef(onReply);
  useEffect(() => {
    onReplyRef.current = onReply;
  }, [onReply]);

  // Leaving the screen stops an unfinished reply.
  useEffect(() => () => controller.current?.abort(), []);

  const send = useCallback(
    async (text: string): Promise<TurnResult> => {
      setError(null);
      setPending({ user: text, bot: '' });

      const ac = new AbortController();
      controller.current = ac;
      let failure: TurnFailure | null = null;
      let done: DoneEvent | null = null;
      try {
        await streamPost('/chat/turn', { sessionId, text }, {
          signal: ac.signal,
          onEvent: (name, data) => {
            if (name === 'delta') setPending((p) => p && { ...p, bot: p.bot + (data as { text: string }).text });
            else if (name === 'error') failure = data as TurnFailure;
            else if (name === 'done') done = data as DoneEvent;
          },
        });
        if (!done && !failure) failure = { message: 'The connection was lost. Your message was not sent.' };
      } catch (err) {
        if ((err as Error).name === 'AbortError') return 'aborted';
        failure = { code: (err as { code?: string }).code, message: (err as Error).message };
      }

      if (done) {
        const { turns, userMessage, assistantMessage } = done as DoneEvent;
        qc.setQueryData<ChatSession>(['session', sessionId], (old) => old && { ...old, turns, messages: [...old.messages, userMessage, assistantMessage] });
        setPending(null);
        onReplyRef.current?.(assistantMessage, turns);
        return 'sent';
      }
      setPending(null);
      setError(failure);
      return 'failed';
    },
    [qc, sessionId],
  );

  const clearError = useCallback(() => setError(null), []);
  return { pending, error, send, clearError, sending: pending !== null };
}
