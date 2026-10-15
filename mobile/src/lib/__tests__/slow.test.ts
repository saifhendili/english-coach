import { SLOW_AFTER_MS, useWaking, watchSlow } from '../slow';

jest.mock('@/store/auth', () => ({ getServer: () => 'https://example.test', useAuth: { getState: () => ({ token: null }) } }));

const flush = () => Promise.resolve().then(() => Promise.resolve());

beforeEach(() => {
  jest.useFakeTimers();
  useWaking.setState({ waking: 0 });
});
afterEach(() => jest.useRealTimers());

describe('watchSlow', () => {
  it('says nothing about a quick request, and never asks the server', async () => {
    const probe = jest.fn().mockResolvedValue(true);
    const result = await watchSlow(async () => 'ok', { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS * 2);
    expect(result).toBe('ok');
    expect(probe).not.toHaveBeenCalled();
    expect(useWaking.getState().waking).toBe(0);
  });

  it('says nothing about a slow request when the server answers the health check (a slow Gemini reply)', async () => {
    const probe = jest.fn().mockResolvedValue(true);
    let finish!: () => void;
    const pending = watchSlow(() => new Promise<void>((r) => (finish = r)), { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS);
    await flush();
    expect(probe).toHaveBeenCalledTimes(1);
    expect(useWaking.getState().waking).toBe(0);
    finish();
    await pending;
    expect(useWaking.getState().waking).toBe(0);
  });

  it('says the server is waking up while a slow request waits and the health check gets no answer, then stops', async () => {
    const probe = jest.fn().mockResolvedValue(false);
    let finish!: () => void;
    const pending = watchSlow(() => new Promise<void>((r) => (finish = r)), { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS);
    await flush();
    expect(useWaking.getState().waking).toBe(1);
    finish();
    await pending;
    expect(useWaking.getState().waking).toBe(0);
  });

  it('stops saying it when the request fails', async () => {
    const probe = jest.fn().mockResolvedValue(false);
    let fail!: (e: Error) => void;
    const pending = watchSlow(() => new Promise<void>((_r, rej) => (fail = rej)), { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS);
    await flush();
    expect(useWaking.getState().waking).toBe(1);
    fail(new Error('boom'));
    await expect(pending).rejects.toThrow('boom');
    expect(useWaking.getState().waking).toBe(0);
  });

  it('does not get stuck when the request ends before the health check comes back', async () => {
    let answer!: (v: boolean) => void;
    const probe = jest.fn(() => new Promise<boolean>((r) => (answer = r)));
    let finish!: () => void;
    const pending = watchSlow(() => new Promise<void>((r) => (finish = r)), { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS);
    finish();
    await pending;
    answer(false); // too late: the request is already over
    await flush();
    expect(useWaking.getState().waking).toBe(0);
  });

  it('counts several slow requests at once', async () => {
    const probe = jest.fn().mockResolvedValue(false);
    const finishers: (() => void)[] = [];
    const a = watchSlow(() => new Promise<void>((r) => finishers.push(r)), { probe });
    const b = watchSlow(() => new Promise<void>((r) => finishers.push(r)), { probe });
    jest.advanceTimersByTime(SLOW_AFTER_MS);
    await flush();
    expect(useWaking.getState().waking).toBe(2);
    finishers[0]();
    await a;
    expect(useWaking.getState().waking).toBe(1);
    finishers[1]();
    await b;
    expect(useWaking.getState().waking).toBe(0);
  });
});
