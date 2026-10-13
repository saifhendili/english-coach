import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText, Icon } from '@/components/ui';
import { signed } from '@/lib/chart';
import { useViz } from '@/theme';
import { ChartSurface } from './ChartCard';

// A 14-point trend in the quiet ink colour, the latest point in the accent. No axes: it is a hint, not a chart.
function Sparkline({ values }: { values: number[] }) {
  const viz = useViz();
  const W = 84;
  const H = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i): [number, number] => [5 + ((W - 10) * i) / Math.max(values.length - 1, 1), H - 5 - (v / max) * (H - 10)]); // 5px of room for the end dot
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={W} height={H}>
        <Path d={d} fill="none" stroke={viz.muted} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={lx} cy={ly} r={4} fill={viz.s1} stroke={viz.surface} strokeWidth={2} />
      </Svg>
    </View>
  );
}

// label (sentence case) · value · optional delta against a named period · optional trend.
export function StatTile({ label, value, delta, deltaLabel, trend, note }: { label: string; value: string | number; delta?: number | null; deltaLabel?: string; trend?: number[]; note?: string }) {
  const viz = useViz();
  const up = (delta ?? 0) > 0;
  return (
    <ChartSurface padding={16}>
      <View style={{ gap: 4 }}>
        <AppText variant="small" style={{ color: viz.text2 }}>{label}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <AppText weight="600" style={{ color: viz.text, fontSize: 30, lineHeight: 34 }}>{value}</AppText>
          {trend && trend.some((v) => v > 0) ? <Sparkline values={trend} /> : null}
        </View>
      </View>
      {delta != null && delta !== 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? viz.good : viz.text2} />
          <AppText variant="caption" weight="700" style={{ color: up ? viz.good : viz.text2 }}>{signed(delta)} {deltaLabel}</AppText>
        </View>
      ) : null}
      {note ? <AppText variant="caption" style={{ color: viz.text2, fontWeight: '500' }}>{note}</AppText> : null}
    </ChartSurface>
  );
}
