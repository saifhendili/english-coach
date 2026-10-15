import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServerBox } from '@/components/ServerBox';
import { AppText, Button, Card, ErrorBanner, Icon, Logo, TextField } from '@/components/ui';
import { LOGIN_LINK } from '@/guide/strings';
import { api, apiUrl } from '@/lib/api';
import { getServer, useAuth } from '@/store/auth';
import { BRAND, useTheme } from '@/theme';

type AuthResponse = { token: string; user: { id: string; email: string } };

// A small example of what the app does: you write, it corrects you kindly.
function CorrectionDemo() {
  return (
    <View style={{ gap: 10, marginTop: 22 }}>
      <View style={{ alignSelf: 'flex-end', maxWidth: '88%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 22, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
        <AppText variant="caption" color="muted">You</AppText>
        <AppText weight="600" style={{ color: '#0f172a' }}>
          I <AppText weight="600" style={{ color: '#f43f5e', textDecorationLine: 'line-through' }}>go</AppText> to gym yesterday
        </AppText>
      </View>
      <View style={{ alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
        <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Coach</AppText>
        <AppText weight="700" style={{ color: '#fff' }}>✓ I went to the gym yesterday</AppText>
        <AppText variant="small" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Use the past simple with “yesterday”, and add “the” before gym.</AppText>
      </View>
    </View>
  );
}

export default function Login() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = useMutation({
    mutationFn: () => api<AuthResponse>(`/auth/${mode}`, { method: 'POST', body: { email, password } }),
    onSuccess: (data) => useAuth.getState().login(data.token, data.user),
  });

  const unreachable = auth.error && 'code' in auth.error && (auth.error as { code: string }).code === 'NETWORK';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 28, paddingBottom: 30, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Logo size={44} />
            <AppText variant="heading" weight="800" style={{ color: '#fff' }}>English Coach</AppText>
          </View>
          <AppText variant="display" style={{ color: '#fff', marginTop: 22 }}>Speak English{'\n'}with confidence.</AppText>
          <CorrectionDemo />
        </LinearGradient>

        <View style={{ padding: 20, gap: 18 }}>
          <View style={{ gap: 4 }}>
            <AppText variant="title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</AppText>
            <AppText color="text2">{mode === 'login' ? 'Sign in to keep practising.' : 'Start your English journey in a minute.'}</AppText>
          </View>

          <Card style={{ gap: 14 }}>
            <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" returnKeyType="next" />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              hint={mode === 'register' ? 'At least 8 characters.' : undefined}
              returnKeyType="go"
              onSubmitEditing={() => email && password && auth.mutate()}
            />
            <ErrorBanner error={auth.error} />
            <Button title={mode === 'login' ? 'Sign in' : 'Create account'} trailingIcon="arrow-forward" full size="lg" loading={auth.isPending} disabled={!email.trim() || password.length < 1} onPress={() => auth.mutate()} />
          </Card>

          <Pressable onPress={() => { auth.reset(); setMode(mode === 'login' ? 'register' : 'login'); }} accessibilityRole="button">
            <AppText weight="700" color="primaryText" style={{ textAlign: 'center' }}>
              {mode === 'login' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
            </AppText>
          </Pressable>

          <Pressable onPress={() => router.push('/guide')} accessibilityRole="button" accessibilityLabel={`How does it work? ${LOGIN_LINK.fr}. ${LOGIN_LINK.ar}`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 }}>
            <Icon name="book-outline" size={18} color="primaryText" />
            <AppText variant="small" weight="700" color="primaryText">{LOGIN_LINK.en} · {LOGIN_LINK.fr} · {LOGIN_LINK.ar}</AppText>
          </Pressable>

          <ServerBox forceOpen={Boolean(unreachable) || !getServer()} />
          <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>{apiUrl('')}</AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
