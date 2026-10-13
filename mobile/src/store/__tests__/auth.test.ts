import { useAuth } from '../auth';

const mockMem = new Map<string, string>();
jest.mock('@/lib/storage', () => ({
  storage: {
    get: async (k: string) => mockMem.get(k) ?? null,
    set: async (k: string, v: string) => void mockMem.set(k, v),
    remove: async (k: string) => void mockMem.delete(k),
  },
}));

beforeEach(() => {
  mockMem.clear();
  useAuth.setState({ token: null, user: null, server: null, ready: false });
});

describe('auth store', () => {
  it('starts not ready, and is ready (signed out) after reading an empty store', async () => {
    expect(useAuth.getState().ready).toBe(false);
    await useAuth.getState().hydrate();
    expect(useAuth.getState()).toMatchObject({ ready: true, token: null, user: null, server: null });
  });

  it('login keeps the session, and a fresh start restores it', async () => {
    await useAuth.getState().login('tok123', { id: 'u1', email: 'a@b.co' });
    useAuth.setState({ token: null, user: null, ready: false }); // the app was closed and reopened
    await useAuth.getState().hydrate();
    expect(useAuth.getState()).toMatchObject({ ready: true, token: 'tok123', user: { id: 'u1', email: 'a@b.co' } });
  });

  it('logout forgets the session but not the server address', async () => {
    await useAuth.getState().setServer('http://192.168.1.9:4000');
    await useAuth.getState().login('tok', { id: 'u', email: 'e@x.co' });
    await useAuth.getState().logout();
    useAuth.setState({ ready: false });
    await useAuth.getState().hydrate();
    expect(useAuth.getState()).toMatchObject({ token: null, user: null, server: 'http://192.168.1.9:4000' });
  });

  it('a damaged saved user does not crash the app', async () => {
    mockMem.set('english-coach.token', 'tok');
    mockMem.set('english-coach.user', '{not json');
    await useAuth.getState().hydrate();
    expect(useAuth.getState().ready).toBe(true);
    expect(useAuth.getState().user).toBeNull();
  });

  it('clearing the server address goes back to detection', async () => {
    await useAuth.getState().setServer('http://x:4000');
    await useAuth.getState().setServer(null);
    expect(useAuth.getState().server).toBeNull();
    expect(mockMem.has('english-coach.server')).toBe(false);
  });
});
