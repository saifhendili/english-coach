import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { PlacementResult, PlacementView } from '@/types';
import { usePlacementFlow } from '../usePlacementFlow';

const mockApi = jest.fn();
jest.mock('@/lib/api', () => ({ api: (...a: unknown[]) => mockApi(...a) }));

const q = (index: number): PlacementView => ({ attemptId: 'att1', answered: index, maxQuestions: 15, canFinishEarly: index >= 8, question: { index, type: 'grammar', level: 'B1', prompt: `Question ${index}`, options: ['a', 'b', 'c', 'd'] } });
const result = { level: 'B2', answered: 12, breakdown: { grammar: { score: 80, count: 4 } }, feedback: null, review: [] } as PlacementResult;

type Handler = (path: string, body?: unknown) => unknown;
let handler: Handler;
const clients: QueryClient[] = [];
const paths = () => mockApi.mock.calls.map(([p]) => p);

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockImplementation(async (path: string, opts?: { body?: unknown }) => handler(path, opts?.body));
});
afterEach(() => clients.splice(0).forEach((c) => c.clear()));

async function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  clients.push(qc);
  const invalidate = jest.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const view = await renderHook(() => usePlacementFlow(), { wrapper });
  return { ...view, invalidate };
}

describe('usePlacementFlow', () => {
  it('starts on the intro, then shows the first question', async () => {
    handler = () => q(0);
    const { result: r } = await setup();
    expect(r.current.phase).toBe('intro');
    await act(async () => r.current.begin());
    expect(r.current.phase).toBe('question');
    expect(r.current.view?.question?.prompt).toBe('Question 0');
    expect(r.current.answer).toBeNull();
  });

  it('stays on the intro with the error when the test cannot start', async () => {
    handler = () => {
      throw new Error('No key');
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    expect(r.current.phase).toBe('intro');
    expect(r.current.error?.message).toBe('No key');
  });

  it('sends the answer with the attempt id and moves to the next question', async () => {
    handler = (path) => (path === '/placement/start' ? q(0) : q(1));
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.setAnswer(2));
    await act(async () => r.current.submit({ choiceIndex: 2 }));
    expect(mockApi).toHaveBeenLastCalledWith('/placement/next', { method: 'POST', body: { attemptId: 'att1', answer: { choiceIndex: 2 } } });
    expect(r.current.view?.question?.index).toBe(1);
    expect(r.current.answer).toBeNull(); // a fresh question starts unanswered
  });

  it('"I don’t know" sends a skip', async () => {
    handler = (path) => (path === '/placement/start' ? q(0) : q(1));
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.skip());
    expect(mockApi).toHaveBeenLastCalledWith('/placement/next', { method: 'POST', body: { attemptId: 'att1', answer: { skip: true } } });
  });

  it('scores the test when the server says it is ready, and refreshes the level', async () => {
    handler = (path) => {
      if (path === '/placement/start') return q(11);
      if (path === '/placement/next') return { attemptId: 'att1', answered: 12, maxQuestions: 15, canFinishEarly: true, readyToFinish: true };
      return result;
    };
    const { result: r, invalidate } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.submit({ choiceIndex: 0 }));
    expect(paths()).toEqual(['/placement/start', '/placement/next', '/placement/finish']);
    expect(r.current.phase).toBe('result');
    expect(r.current.result?.level).toBe('B2');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['settings'] });
  });

  it('after a failed answer, asks the server: if the question is unchanged the answer was not saved and stays in the form', async () => {
    let starts = 0;
    handler = (path) => {
      if (path === '/placement/start') return starts++ === 0 ? q(3) : q(3);
      throw Object.assign(new Error('Network down'), { code: 'NETWORK' });
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.setAnswer(1));
    await act(async () => r.current.submit({ choiceIndex: 1 }));
    expect(r.current.phase).toBe('question');
    expect(r.current.view?.question?.index).toBe(3);
    expect(r.current.error?.message).toBe('Network down');
    expect(r.current.answer).toBe(1);
  });

  it('after a failed answer, carries on if the server had saved it after all', async () => {
    let starts = 0;
    handler = (path) => {
      if (path === '/placement/start') return starts++ === 0 ? q(3) : q(4);
      throw Object.assign(new Error('Timed out'), { code: 'NETWORK' });
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.submit({ choiceIndex: 1 }));
    expect(r.current.view?.question?.index).toBe(4);
    expect(r.current.error).toBeNull();
  });

  it('is stuck, with a way to retry, when even the check fails', async () => {
    let starts = 0;
    handler = (path) => {
      if (path === '/placement/start' && starts++ === 0) return q(3);
      throw new Error('offline');
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.submit({ choiceIndex: 1 }));
    expect(r.current.phase).toBe('stuck');
    expect(r.current.error?.message).toBe('offline');
  });

  it('a BUSY answer (double tap) returns to the question without an error', async () => {
    handler = (path) => {
      if (path === '/placement/start') return q(0);
      throw Object.assign(new Error('busy'), { code: 'BUSY' });
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => r.current.submit({ choiceIndex: 0 }));
    expect(r.current.phase).toBe('question');
    expect(r.current.error).toBeNull();
  });

  it('Finish now scores the answers so far; a failed scoring can be retried', async () => {
    let fail = true;
    handler = (path) => {
      if (path === '/placement/start') return q(9);
      if (fail) throw new Error('Gemini busy');
      return result;
    };
    const { result: r } = await setup();
    await act(async () => r.current.begin());
    await act(async () => void r.current.finishEarly());
    expect(r.current.phase).toBe('finishing');
    expect(r.current.error?.message).toBe('Gemini busy');
    fail = false;
    await act(async () => r.current.finish('att1'));
    expect(r.current.phase).toBe('result');
    expect(r.current.error).toBeNull();
  });

  it('shows a previous result', async () => {
    handler = () => result;
    const { result: r } = await setup();
    await act(async () => r.current.showResult('old-attempt'));
    expect(mockApi).toHaveBeenCalledWith('/placement/old-attempt/result');
    expect(r.current.phase).toBe('result');
  });
});
