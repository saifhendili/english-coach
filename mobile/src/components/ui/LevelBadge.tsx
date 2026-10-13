import { LinearGradient } from 'expo-linear-gradient';
import { LEVEL_STYLE } from '@/theme';
import { AppText } from './Text';

const SIZES = {
  sm: { box: { height: 28, minWidth: 36, borderRadius: 9, paddingHorizontal: 8 }, font: 12, line: 16 },
  md: { box: { height: 44, minWidth: 56, borderRadius: 14, paddingHorizontal: 12 }, font: 18, line: 24 },
  xl: { box: { height: 104, minWidth: 104, borderRadius: 30, paddingHorizontal: 18 }, font: 48, line: 56 },
};

export function LevelBadge({ level, size = 'md' }: { level: string | null | undefined; size?: keyof typeof SIZES }) {
  const style = level ? LEVEL_STYLE[level] : undefined;
  if (!style) return null;
  const s = SIZES[size];
  return (
    <LinearGradient colors={style.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.box, { alignItems: 'center', justifyContent: 'center' }]} accessibilityLabel={`Level ${level}`}>
      <AppText weight="800" style={{ color: '#fff', fontSize: s.font, lineHeight: s.line }}>
        {level}
      </AppText>
    </LinearGradient>
  );
}
