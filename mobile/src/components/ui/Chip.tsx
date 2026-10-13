import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './Text';

type Tone = 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

export function Chip({ label, tone = 'primary', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { colors } = useTheme();
  const palette = {
    primary: [colors.primarySoft, colors.primaryText],
    success: [colors.successSoft, colors.successText],
    warn: [colors.warnSoft, colors.warnText],
    danger: [colors.dangerSoft, colors.dangerText],
    info: [colors.infoSoft, colors.infoText],
    neutral: [colors.chipBg, colors.text2],
  }[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: palette[0], borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      {icon ? <Icon name={icon} size={13} color={palette[1]} /> : null}
      <AppText variant="caption" weight="700" style={{ color: palette[1] }}>
        {label}
      </AppText>
    </View>
  );
}
