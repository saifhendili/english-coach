import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { Exercise } from '@/types';
import { usePracticeSession } from '../usePracticeSession';

const mockApi = jest.fn();
jest.mock('@/lib/api', () => ({ api: (...a: unknown[]) => mockApi(...a) }));

const fill = (id: string, answer: string): Exercise => ({ id, type: 'fill', tense: 'past-simple', prompt: `We ____ (go) ${id}.`, answers: [answer] });
const choice = (id: string): Exercise => ({ id, type: 'choose', tense: 'past-simple', prompt: 'x ____', options: ['a', 'b', 'c', 'd'], correctIndex: 2 });

let exercises: Exercise[];
let recordImpl: (body: { results: unknown[] }) => unknown;
const clients: QueryClient[] = [];

beforeEach(() => {
  exercises = [fill('a', 'went'), choice('b'), fill('c', 'ate')];
  recordImpl = () => ({ stats: {}, recommended: { tense: null, reason: 'done' } });
  mockApi.mockReset();
  mockApi.mockImplementation(async (path: string, opts?: { body?: { results: unknown[] } }) => {
    if (path.startsWith('/tenses/practice?')) return { exercises };
    if (path === '/tenses/generate') return { exercises };
    if (path === '/tenses/practice') return recordImpl(opts!.body!);
    throw new Error(`unexpected ${path}`);
  });
});
afterEach(() => clients.splice(0).forEach((c) => c.clear()));

async function setup(params: { tense: string; source?: 'ai'; count?: number } = { tense: 'past-simple' }) {
  const qc = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity } } });
  qc.setQueryData(['tenses'], { lessons: [], stats: {}, recommended: { tense: null, reason: 'done' }, chatTenseMistakes: 0, irregular: { count: 0, verbs: [] } });
  clients.push(qc);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const view = await renderHook(() => usePracticeSession(params), { wrapper });
  await act(async () => {});
  return view;
}
const recorded = () => mockApi.mock.calls.filter(([p]) => p === '/tenses/practice').map(([, o]) => o.body.results);

describe('usePracticeSession', () => {
  it('loads the exercises and starts on the first', async () => {
    const { result } = await setup({ tense: 'past-simple', count: 8 });
    expect(mockApi).toHaveBeenCalledWith('/tenses/practice?tense=past-simple&count=8');
    expect(result.current.phase).toBe('question');
    expect(result.current.exercise?.id).toBe('a');
    expect(result.current.total).toBe(3);
    expect(result.current.position).toBe(1);
  });

  it('keeps the question number steady while its verdict is showing', async () => {
    const { result } = await setup();
    expect(result.current.position).toBe(1);
    await act(async () => result.current.submit('went'));
    expect(result.current.position).toBe(1); // still question 1 on the feedback screen
    await act(async () => result.current.next());
    expect(result.current.position).toBe(2);
    await act(async () => result.current.submit(0)); // wrong
    expect(result.current.position).toBe(2);
    await act(async () => result.current.next());
    await act(async () => result.current.submit('ate'));
    await act(async () => result.current.next());
    expect(result.current.exercise?.retry).toBe(true);
    expect(result.current.position).toBe(3); // a second try never adds to the count
    expect(result.current.position).toBeLessThanOrEqual(result.current.total);
  });

  it('asks Gemini for new exercises when the source is ai', async () => {
    await setup({ tense: 'past-simple', source: 'ai' });
    expect(mockApi).toHaveBeenCalledWith('/tenses/generate', { method: 'POST', body: { tense: 'past-simple', count: 6 } });
  });

  it('checks an answer at once and waits on the feedback', async () => {
    const { result } = await setup();
    await act(async () => result.current.submit('Went'));
    expect(result.current.phase).toBe('feedback');
    expect(result.current.last).toEqual({ correct: true, expected: 'went' });
    expect(result.current.correct).toBe(1);
  });

  it('goes through right answers and saves them at the end', async () => {
    const { result } = await setup();
    await act(async () => result.current.submit('went'));
    await act(async () => result.current.next());
    await act(async () => result.current.submit(2));
    await act(async () => result.current.next());
    await act(async () => result.current.submit('ate'));
    await act(async () => result.current.next());
    expect(result.current.phase).toBe('done');
    expect(result.current.correct).toBe(3);
    expect(recorded()).toEqual([[{ id: 'a', tense: 'past-simple', correct: true }, { id: 'b', tense: 'past-simple', correct: true }, { id: 'c', tense: 'past-simple', correct: true }]]);
  });

  it('brings a missed question back once at the end, and counts it only the first time', async () => {
    const { result } = await setup();
    await act(async () => result.current.submit('wrong'));
    expect(result.current.correct).toBe(0);
    await act(async () => result.current.next());
    await act(async () => result.current.submit(2));
    await act(async () => result.current.next());
    await act(async () => result.current.submit('ate'));
    await act(async () => result.current.next());
    expect(result.current.exercise).toMatchObject({ id: 'a', retry: true });
    expect(result.current.total).toBe(3); // the second try does not add to the count
    await act(async () => result.current.submit('went')); // right this time
    expect(result.current.last?.correct).toBe(true);
    await act(async () => result.current.next());
    expect(result.current.phase).toBe('done');
    expect(recorded()[0].map((r: { id: string; correct: boolean }) => [r.id, r.correct])).toEqual([['a', false], ['b', true], ['c', true]]);
    expect(result.current.missed.map((e) => e.id)).toEqual(['a']); // listed once, even though it came back
  });

  it('does not queue a second try again when the second try is wrong too', async () => {
    exercises = [fill('a', 'went')];
    const { result } = await setup();
    await act(async () => result.current.submit('x'));
    await act(async () => result.current.next());
    expect(result.current.exercise?.retry).toBe(true);
    await act(async () => result.current.submit('y'));
    await act(async () => result.current.next());
    expect(result.current.phase).toBe('done');
    expect(recorded()[0]).toEqual([{ id: 'a', tense: 'past-simple', correct: false }]);
  });

  it('ignores a second answer while the feedback is showing', async () => {
    const { result } = await setup();
    await act(async () => result.current.submit('went'));
    await act(async () => result.current.submit('wrong'));
    expect(result.current.results).toHaveLength(1);
    expect(result.current.last?.correct).toBe(true);
  });

  it('Finish part-way saves what was answered; with nothing answered it saves nothing', async () => {
    const first = await setup();
    await act(async () => first.result.current.submit('went'));
    await act(async () => first.result.current.next());
    await act(async () => first.result.current.stop());
    expect(first.result.current.phase).toBe('done');
    expect(recorded()).toHaveLength(1);
    expect(recorded()[0]).toHaveLength(1);

    mockApi.mockClear();
    const second = await setup();
    await act(async () => second.result.current.stop());
    expect(second.result.current.phase).toBe('done');
    expect(recorded()).toHaveLength(0);
  });

  it('sends the results only once', async () => {
    exercises = [fill('a', 'went')];
    const { result } = await setup();
    await act(async () => result.current.submit('went'));
    await act(async () => result.current.next());
    await act(async () => result.current.stop());
    expect(recorded()).toHaveLength(1);
  });

  it('shows a load error, and starts again on request', async () => {
    mockApi.mockImplementationOnce(async () => {
      throw new Error('Offline');
    });
    const { result } = await setup();
    expect(result.current.phase).toBe('error');
    expect(result.current.error?.message).toBe('Offline');
    await act(async () => result.current.restart());
    expect(result.current.phase).toBe('question');
  });

  it('keeps going when saving fails, and lets the learner retry the save', async () => {
    exercises = [fill('a', 'went')];
    let fail = true;
    recordImpl = () => {
      if (fail) throw new Error('No connection');
      return { stats: {}, recommended: { tense: null, reason: 'done' } };
    };
    const { result } = await setup();
    await act(async () => result.current.submit('went'));
    await act(async () => result.current.next());
    expect(result.current.phase).toBe('done');
    expect(result.current.saveError?.message).toBe('No connection');
    fail = false;
    await act(async () => result.current.retrySave());
    expect(result.current.saveError).toBeNull();
    expect(recorded()).toHaveLength(2);
  });

  it('treats an empty set as an error', async () => {
    exercises = [];
    const { result } = await setup();
    expect(result.current.phase).toBe('error');
  });
});
