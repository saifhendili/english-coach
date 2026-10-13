import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, View, type DimensionValue } from 'react-native';
import { useTheme } from '@/theme';

// A grey placeholder bar that gently pulses while content is on its way.
export function Skeleton({ width = '100%', height = 16, radius = 8 }: { width?: DimensionValue; height?: number; radius?: number }) {
  const { colors } = useTheme();
  const [pulse] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.55, duration: 800, useNativeDriver: true })]));
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);

  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: colors.border, opacity: pulse }} />;
}

export function SkeletonCard() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: 14, padding: 18, borderRadius: 28, backgroundColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={70} height={24} radius={12} />
        <Skeleton width={90} height={24} radius={12} />
        <Skeleton width={50} height={24} radius={12} />
      </View>
      <Skeleton width="80%" height={22} />
      <Skeleton height={14} />
      <Skeleton width="65%" height={14} />
    </View>
  );
}
