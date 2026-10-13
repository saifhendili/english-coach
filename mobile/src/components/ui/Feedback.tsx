import { ActivityIndicator, View } from 'react-native';
import { ApiError } from '@/lib/api';
import { RADIUS, useTheme } from '@/theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { AppText } from './Text';

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={colors.primary} />;
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 60 }} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <Spinner size="large" />
      {label ? <AppText variant="small" color="text2">{label}</AppText> : null}
    </View>
  );
}

const TIPS: Record<string, string> = {
  RATE_LIMITED: 'Free Gemini keys have a per-minute quota. Wait a minute, then try again.',
  QUOTA_DAILY: 'Free models have a daily limit that resets at midnight Pacific time. Pick a different model in Settings, or come back later.',
  GEMINI_TIMEOUT: 'Gemini is slow right now. Trying again usually works.',
  GEMINI_OVERLOADED: 'Gemini is busy. Trying again in a moment usually works.',
};

type ErrorLike = { message: string; code?: string } | null | undefined;

export function ErrorBanner({ error, onRetry, retryLabel = 'Try again' }: { error: ErrorLike; onRetry?: () => void; retryLabel?: string }) {
  const { colors } = useTheme();
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : error.code;
  return (
    <View
      accessibilityRole="alert"
      style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: RADIUS.lg, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger + '33' }}
    >
      <Icon name="alert-circle" size={22} color={colors.danger} />
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="small" weight="700" style={{ color: colors.dangerText }}>
          {error.message}
        </AppText>
        {code && TIPS[code] ? (
          <AppText variant="small" style={{ color: colors.dangerText, opacity: 0.85 }}>
            {TIPS[code]}
          </AppText>
        ) : null}
        {onRetry ? (
          <View style={{ marginTop: 6 }}>
            <Button title={retryLabel} icon="refresh" size="sm" variant="danger" onPress={onRetry} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
