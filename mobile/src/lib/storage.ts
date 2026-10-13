import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Small values that must survive restarts (the login token, the server address).
// On the iPhone they live in the Keychain. The web build (used only to test the app in a browser)
// falls back to localStorage, because expo-secure-store has no web support.
const isWeb = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* storage blocked: the app still works for this session */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isWeb) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* nothing to do */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
