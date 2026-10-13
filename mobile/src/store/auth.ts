import { create } from 'zustand';
import { defaultServer } from '@/lib/config';
import { storage } from '@/lib/storage';

const KEYS = { token: 'english-coach.token', user: 'english-coach.user', server: 'english-coach.server' };

export type AuthUser = { id: string; email: string };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  /** Server address typed by the user; null means "use the detected one". */
  server: string | null;
  /** False until the saved login has been read from storage (the splash screen waits for it). */
  ready: boolean;
  hydrate: () => Promise<void>;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  setServer: (server: string | null) => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  server: null,
  ready: false,

  async hydrate() {
    const [token, user, server] = await Promise.all([storage.get(KEYS.token), storage.get(KEYS.user), storage.get(KEYS.server)]);
    let parsed: AuthUser | null = null;
    try {
      parsed = user ? (JSON.parse(user) as AuthUser) : null;
    } catch {
      parsed = null;
    }
    set({ token, user: token ? parsed : null, server, ready: true });
  },

  async login(token, user) {
    set({ token, user });
    await Promise.all([storage.set(KEYS.token, token), storage.set(KEYS.user, JSON.stringify(user))]);
  },

  async logout() {
    set({ token: null, user: null });
    await Promise.all([storage.remove(KEYS.token), storage.remove(KEYS.user)]);
  },

  async setServer(server) {
    set({ server });
    if (server) await storage.set(KEYS.server, server);
    else await storage.remove(KEYS.server);
  },
}));

/** The server origin in use: what the user typed, else what was detected. */
export function getServer(): string {
  return useAuth.getState().server ?? defaultServer();
}
