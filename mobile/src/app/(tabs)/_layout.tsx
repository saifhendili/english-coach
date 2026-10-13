import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useReviewSummary } from '@/hooks/useReview';
import { FONT, useTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tab(name: IconName, focused: IconName) {
  const render = ({ color, size, focused: on }: { color: ColorValue; size: number; focused: boolean }) => <Ionicons name={on ? focused : name} size={size} color={color} />;
  render.displayName = `TabIcon(${name})`;
  return render;
}

export default function TabLayout() {
  const { colors } = useTheme();
  const due = useReviewSummary().data?.due ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: FONT['600'], fontSize: 11, lineHeight: 13 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tab('home-outline', 'home') }} />
      <Tabs.Screen name="topics" options={{ title: 'Topics', tabBarIcon: tab('compass-outline', 'compass') }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: tab('chatbubbles-outline', 'chatbubbles') }} />
      <Tabs.Screen name="grammar" options={{ title: 'Grammar', tabBarIcon: tab('school-outline', 'school') }} />
      <Tabs.Screen name="phrases" options={{ title: 'Phrases', tabBarIcon: tab('chatbox-ellipses-outline', 'chatbox-ellipses') }} />
      <Tabs.Screen
        name="review"
        options={{ title: 'Review', tabBarIcon: tab('layers-outline', 'layers'), tabBarBadge: due > 0 ? (due > 99 ? '99+' : due) : undefined, tabBarBadgeStyle: { backgroundColor: '#f43f5e', fontFamily: FONT['700'] } }}
      />
    </Tabs>
  );
}
