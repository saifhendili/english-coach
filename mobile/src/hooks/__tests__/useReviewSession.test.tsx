import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { ReviewCardData } from '@/types';
import { useReviewSession } from '../useReviewSession';

const mockApi = jest.fn();
jest.mock('@/lib/api', () => ({ api: (...a: unknown[]) => mockApi(...a) }));

const card = (id: string): ReviewCardData => ({ kind: 'saved', id, type: 'word', isNew: false, preview: { 1: '1m', 2: '5m', 3: '1d', 4: '3d' }, text: `word-${id}` });
const summary = { due: 2, reviewsDue: 2, newToday: 0, newWaiting: 0, reviewedToday: 0, totalCards: 2 };

const clients: QueryClient[] = [];
let queueItems: ReviewCardData[];
let answerImpl: (body: { rating: number }) => unknown;

beforeEach(() => {
  queueItems = [card('a'), card('b')];
  answerImpl = () => ({ ok: true });
  mockApi.mockReset();
  mockApi.mockImplementation(async (path: string, opts?: { body?: { rating: number } }) => {
    if (path === '/review/summary') return summary;
    if (path.startsWith('/review/queue')) return { items: queueItems, remaining: 0, newWaiting: 0 };
    if (path === '/review/answer') return answerImpl(opts!.body!);
    throw new Error(`unexpected ${path}`);
  });
});
afterEach(() => clients.splice(0).forEach((c) => c.clear()));

async function setup(onFinish?: () => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity } } });
  clients.push(qc);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const view = await renderHook(() => useReviewSession({ onFinish }), { wrapper });
  await act(async () => {}); // let the summary load
  return view;
}

const answers = () => mockApi.mock.calls.filter(([p]) => p === '/review/answer').map(([, o]) => o.body);

describe('useReviewSession', () => {
  it('starts on the start screen and loads a queue', async () => {
    const { result } = await setup();
    expect(result.current.phase).toBe('start');
    await act(async () => result.current.start());
    expect(result.current.phase).toBe('session');
    expect(result.current.total).toBe(2);
    expect(result.current.card?.id).toBe('a');
  });

  it('sends each rating, counts it, and finishes after the last card', async () => {
    const onFinish = jest.fn();
    const { result } = await setup(onFinish);
    await act(async () => result.current.start());
    await act(async () => result.current.rate(3));
    expect(result.current.card?.id).toBe('b');
    expect(result.current.stats[3]).toBe(1);
    await act(async () => result.current.rate(4));
    expect(result.current.phase).toBe('done');
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(answers()).toEqual([{ kind: 'saved', id: 'a', rating: 3 }, { kind: 'saved', id: 'b', rating: 4 }]);
  });

  it('brings a card answered Again back at the end as a second try that sends nothing', async () => {
    const { result } = await setup();
    await act(async () => result.current.start());
    await act(async () => result.current.rate(1));
    expect(result.current.queue.map((c) => `${c.id}${c.retry ? '*' : ''}`)).toEqual(['b', 'a*']);
    await act(async () => result.current.rate(3));
    expect(result.current.card).toMatchObject({ id: 'a', retry: true });
    await act(async () => result.current.rate(null)); // moving on from the second try
    expect(result.current.phase).toBe('done');
    expect(answers()).toHaveLength(2); // Again, Good: the second try was not sent
    expect(result.current.stats).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0 });
  });

  it('stays on the card and shows the error when the server fails', async () => {
    answerImpl = () => {
      throw Object.assign(new Error('Server down'), { code: 'SERVER' });
    };
    const { result } = await setup();
    await act(async () => result.current.start());
    await act(async () => result.current.rate(3));
    expect(result.current.card?.id).toBe('a');
    expect(result.current.error?.message).toBe('Server down');
    expect(result.current.stats[3]).toBe(0);
  });

  it('moves on when the card was already answered elsewhere (NOT_DUE)', async () => {
    answerImpl = () => {
      throw Object.assign(new Error('Not due'), { code: 'NOT_DUE' });
    };
    const { result } = await setup();
    await act(async () => result.current.start());
    await act(async () => result.current.rate(3));
    expect(result.current.card?.id).toBe('b');
    expect(result.current.error).toBeNull();
  });

  it('stays on the start screen when there is nothing to review', async () => {
    queueItems = [];
    const { result } = await setup();
    await act(async () => result.current.start());
    expect(result.current.phase).toBe('start');
    expect(result.current.loading).toBe(false);
  });

  it('reports a queue that cannot be loaded', async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === '/review/summary') return summary;
      throw new Error('offline');
    });
    const { result } = await setup();
    await act(async () => result.current.start());
    expect(result.current.phase).toBe('start');
    expect(result.current.loadError?.message).toBe('offline');
  });

  it('Close before answering goes back to the start; Finish after answering shows the result', async () => {
    const { result } = await setup();
    await act(async () => result.current.start());
    await act(async () => result.current.stop());
    expect(result.current.phase).toBe('start');
    await act(async () => result.current.start());
    await act(async () => result.current.rate(3));
    await act(async () => result.current.stop());
    expect(result.current.phase).toBe('done');
  });
});
