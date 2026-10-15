import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_PORT = 4000;

// Where the English Coach server probably is, without asking the user.
//  - A build made with EXPO_PUBLIC_API_URL set (an APK for your own phone, say `EXPO_PUBLIC_API_URL=http://192.168.1.9:4000`)
//    uses that address. It can still be changed on the sign-in screen.
//  - In Expo Go the app is served by the Expo dev server on the developer's computer: the same computer
//    runs the API, so its address (from `hostUri`) is the right host. Same Wi-Fi is all it needs.
//  - In a browser (testing the web build) it is the page's own host.
// Returns '' when it cannot tell (an Expo tunnel, a standalone build with no preset): the user then types the address.
export function defaultServer(): string {
  const preset = normalizeServer(process.env.EXPO_PUBLIC_API_URL ?? '');
  if (preset) return preset;
  if (Platform.OS === 'web') {
    const { hostname } = globalThis.location ?? { hostname: 'localhost' };
    return `http://${hostname}:${API_PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host || /\.(exp\.direct|ngrok|trycloudflare)/.test(host)) return '';
  return `http://${host}:${API_PORT}`;
}

// What a person types into the "Server" box -> an origin.
//   "192.168.1.9"                 -> "http://192.168.1.9:4000"
//   "192.168.1.9:4000/api"        -> "http://192.168.1.9:4000"
//   "https://coach.example.com/"  -> "https://coach.example.com"
// Returns null for something that cannot be an address.
export function normalizeServer(input: string): string | null {
  let text = input.trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) text = `http://${text}`;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (!url.hostname || /\s/.test(url.hostname)) return null;

  // http without a port: assume the API's port. https without one is a deployed site on 443.
  const port = url.port || (url.protocol === 'http:' ? String(API_PORT) : '');
  return `${url.protocol}//${url.hostname}${port ? `:${port}` : ''}`;
}
