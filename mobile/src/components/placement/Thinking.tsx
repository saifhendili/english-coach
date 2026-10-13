import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Card, Skeleton, Spinner } from '@/components/ui';
import { BRAND } from '@/theme';

// "Working on it" with a changing line of what is happening, so a slow Gemini answer does not feel like a freeze.
export function Thinking({ title, messages }: { title: string; messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), 2400);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <Card style={{ alignItems: 'center', gap: 22, paddingVertical: 34 }} accessibilityRole="progressbar" accessibilityLabel={title} accessibilityLiveRegion="polite">
      <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="large" />
      </LinearGradient>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <AppText variant="subhead" style={{ textAlign: 'center' }}>{title}</AppText>
        <AppText variant="small" color="text2" style={{ textAlign: 'center' }}>{messages[i]}</AppText>
      </View>
      <View style={{ width: '80%', gap: 10 }}>
        {[100, 82, 64].map((w) => (
          <Skeleton key={w} width={`${w}%`} height={12} radius={6} />
        ))}
      </View>
    </Card>
  );
}
