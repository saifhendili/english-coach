// Each weight from its own file: importing from the package root would bundle every weight and italic (about 1.3 MB).
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_500Medium_Italic } from '@expo-google-fonts/plus-jakarta-sans/500Medium_Italic';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_700Bold_Italic } from '@expo-google-fonts/plus-jakarta-sans/700Bold_Italic';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ServerWaking } from '@/components/ServerWaking';
import { ApiError, hooks } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { FONT, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Do not retry answers the user has to act on (a bad key, a missing key, a quota): show them.
      retry: (count, err) => (err instanceof ApiError && err.status >= 400 && err.status < 500 ? false : count < 2),
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_500Medium_Italic,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_700Bold_Italic,
    PlusJakartaSans_800ExtraBold,
  });
  const { ready, token } = useAuth();
  const { colors, dark } = useTheme();

  useEffect(() => {
    void useAuth.getState().hydrate();
    // Any API answer of 412 KEY_MISSING sends the learner to Settings to add their Gemini key.
    hooks.onKeyMissing = () => router.push('/settings');
    return () => {
      hooks.onKeyMissing = null;
    };
  }, []);

  // Signing out must not leave the previous person's data in the cache.
  useEffect(() => {
    if (!token) queryClient.clear();
  }, [token]);

  const loaded = fontsLoaded && ready;
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;

  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: colors.bg, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary } };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <ServerWaking />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerTitleStyle: { fontFamily: FONT['700'], fontSize: 17 },
              headerStyle: { backgroundColor: colors.bg },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            {/* Signed in */}
            <Stack.Protected guard={Boolean(token)}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="progress" options={{ title: 'Your progress' }} />
              <Stack.Screen name="interests" options={{ title: 'Interests' }} />
              <Stack.Screen name="placement" options={{ title: 'Level test' }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="phrases/[category]" options={{ title: 'Phrases' }} />
              <Stack.Screen name="grammar/[tense]" options={{ title: 'Verb tense' }} />
              <Stack.Screen name="grammar/practice" options={{ title: 'Practice' }} />
              <Stack.Screen name="grammar/irregular" options={{ title: 'Irregular verbs' }} />
            </Stack.Protected>
            {/* Signed out */}
            <Stack.Protected guard={!token}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack.Protected>
            {/* The guide works signed in or out. It comes after the sign-in screen on purpose: the app starts on the first screen
                that is available, which signed out must be the sign-in screen. */}
            <Stack.Screen name="guide" options={{ title: 'Guide' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
