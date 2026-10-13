import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { ChatMessage, ChatSession } from '@/types';
import { useChatTurn } from '../useChatTurn';

const mockStream = jest.fn();
jest.mock('@/lib/stream', () => ({ streamPost: (...a: unknown[]) => mockStream(...a) }));

const msg = (role: 'user' | 'assistant', text: string): ChatMessage => ({ role, text, correction: null, phrases: [], newWords: [], createdAt: '' });
const session = { id: 's1', turns: 0, messages: [msg('assistant', 'Hello!')] } as unknown as ChatSession;

const clients: QueryClient[] = [];

async function setup(onReply?: jest.Mock) {
  // gcTime Infinity: the cache sets no timers, so Jest can exit when the tests are done.
  const qc = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  clients.push(qc);
  qc.setQueryData(['session', 's1'], session);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const view = await renderHook(() => useChatTurn('s1', { onReply }), { wrapper });
  return { qc, ...view };
}

beforeEach(() => mockStream.mockReset());
afterEach(() => clients.splice(0).forEach((qc) => qc.clear()));

describe('useChatTurn', () => {
  it('streams the reply, then stores both messages in the session', async () => {
    const onReply = jest.fn();
    mockStream.mockImplementation(async (_path, _body, { onEvent }) => {
      onEvent('delta', { text: 'Nice ' });
      onEvent('delta', { text: 'to meet you' });
      onEvent('done', { turns: 1, userMessage: msg('user', 'Hi'), assistantMessage: msg('assistant', 'Nice to meet you') });
    });
    const view = await setup(onReply);
    let result: string | undefined;
    await act(async () => {
      result = await view.result.current.send('Hi');
    });

    expect(mockStream).toHaveBeenCalledWith('/chat/turn', { sessionId: 's1', text: 'Hi' }, expect.any(Object));
    expect(result).toBe('sent');
    expect(view.result.current.pending).toBeNull();
    const cached = view.qc.getQueryData<ChatSession>(['session', 's1'])!;
    expect(cached.turns).toBe(1);
    expect(cached.messages.map((m) => m.text)).toEqual(['Hello!', 'Hi', 'Nice to meet you']);
    expect(onReply).toHaveBeenCalledWith(expect.objectContaining({ text: 'Nice to meet you' }), 1);
  });

  it('shows the text as it arrives', async () => {
    let release!: () => void;
    mockStream.mockImplementation(async (_p, _b, { onEvent }) => {
      onEvent('delta', { text: 'Wel' });
      await new Promise<void>((r) => (release = r));
      onEvent('done', { turns: 1, userMessage: msg('user', 'Hi'), assistantMessage: msg('assistant', 'Welcome') });
    });
    const view = await setup();
    let promise!: Promise<unknown>;
    await act(async () => {
      promise = view.result.current.send('Hi');
    });
    expect(view.result.current.pending).toEqual({ user: 'Hi', bot: 'Wel' });
    expect(view.result.current.sending).toBe(true);
    await act(async () => {
      release();
      await promise;
    });
    expect(view.result.current.sending).toBe(false);
  });

  it('reports an error event and saves nothing', async () => {
    mockStream.mockImplementation(async (_p, _b, { onEvent }) => onEvent('error', { code: 'RATE_LIMITED', message: 'Too fast' }));
    const view = await setup();
    let result: string | undefined;
    await act(async () => {
      result = await view.result.current.send('Hi');
    });
    expect(result).toBe('failed');
    expect(view.result.current.error).toEqual({ code: 'RATE_LIMITED', message: 'Too fast' });
    expect(view.result.current.pending).toBeNull();
    expect(view.qc.getQueryData<ChatSession>(['session', 's1'])!.messages).toHaveLength(1);
  });

  it('treats a stream that ends without a result as a lost connection', async () => {
    mockStream.mockImplementation(async (_p, _b, { onEvent }) => onEvent('delta', { text: 'Half a rep' }));
    const view = await setup();
    let result: string | undefined;
    await act(async () => {
      result = await view.result.current.send('Hi');
    });
    expect(result).toBe('failed');
    expect(view.result.current.error?.message).toMatch(/connection was lost/);
    expect(view.qc.getQueryData<ChatSession>(['session', 's1'])!.messages).toHaveLength(1);
  });

  it('reports a request that fails before streaming (e.g. no key)', async () => {
    mockStream.mockRejectedValue(Object.assign(new Error('Add your Gemini key'), { code: 'KEY_MISSING' }));
    const view = await setup();
    let result: string | undefined;
    await act(async () => {
      result = await view.result.current.send('Hi');
    });
    expect(result).toBe('failed');
    expect(view.result.current.error).toEqual({ code: 'KEY_MISSING', message: 'Add your Gemini key' });
  });

  it('stops quietly when the screen goes away mid-reply', async () => {
    let signal!: AbortSignal;
    mockStream.mockImplementation((_p, _b, opts: { signal: AbortSignal }) => {
      signal = opts.signal;
      return new Promise((_res, rej) => opts.signal.addEventListener('abort', () => rej(Object.assign(new Error('x'), { name: 'AbortError' }))));
    });
    const view = await setup();
    let promise!: Promise<string>;
    await act(async () => {
      promise = view.result.current.send('Hi');
    });
    await act(async () => view.unmount());
    expect(signal.aborted).toBe(true);
    await expect(promise).resolves.toBe('aborted');
  });

  it('clears the old error when sending again', async () => {
    mockStream.mockRejectedValueOnce(new Error('boom'));
    mockStream.mockImplementationOnce(async (_p, _b, { onEvent }) =>
      onEvent('done', { turns: 1, userMessage: msg('user', 'Hi'), assistantMessage: msg('assistant', 'Hey') }),
    );
    const view = await setup();
    await act(async () => void (await view.result.current.send('Hi')));
    expect(view.result.current.error).not.toBeNull();
    await act(async () => void (await view.result.current.send('Hi')));
    expect(view.result.current.error).toBeNull();
  });
});
