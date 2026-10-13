import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { FONT, useTheme } from '@/theme';
import type { TimelineMark } from '@/types';

const H = 92;
const PAD = 22;
const AXIS = 42;

// When the action happens: a line from PAST through NOW to FUTURE with the tense's marks on it. Decorative: the lesson text
// says the same in words.
export function Timeline({ marks }: { marks: TimelineMark[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(320);
  const x = (at: number) => PAD + (at / 100) * (width - 2 * PAD);
  const now = x(50);
  const ink = colors.primary;
  const label = { fontFamily: FONT['700'], fontSize: 10, fill: colors.muted, letterSpacing: 1 } as const;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(240, Math.round(e.nativeEvent.layout.width)))} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={H}>
        {/* the line of time, with an arrow towards the future */}
        <Line x1={PAD - 8} x2={width - PAD + 4} y1={AXIS} y2={AXIS} stroke={colors.border} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M${width - PAD + 2} ${AXIS - 6}L${width - PAD + 12} ${AXIS}L${width - PAD + 2} ${AXIS + 6}Z`} fill={colors.border} />

        {/* now */}
        <Line x1={now} x2={now} y1={AXIS - 16} y2={AXIS + 16} stroke={colors.text2} strokeWidth={2} strokeLinecap="round" />

        {marks.map((m, i) => {
          if (m.type === 'ticks') {
            return (
              <G key={i}>
                {m.at.map((a) => (
                  <Line key={a} x1={x(a)} x2={x(a)} y1={AXIS - 9} y2={AXIS + 9} stroke={ink} strokeWidth={3} strokeLinecap="round" />
                ))}
              </G>
            );
          }
          if (m.type === 'bar') {
            const start = x(m.from);
            const end = x(m.to);
            return (
              <G key={i}>
                <Rect x={start} y={AXIS - 7} width={end - start} height={14} rx={7} fill={ink} opacity={0.88} />
                {m.open === 'right' ? <Path d={`M${end - 2} ${AXIS - 10}L${end + 9} ${AXIS}L${end - 2} ${AXIS + 10}Z`} fill={ink} /> : null}
              </G>
            );
          }
          const cx = x(m.at);
          return (
            <G key={i}>
              {m.link ? <Line x1={cx} x2={now} y1={AXIS} y2={AXIS} stroke={ink} strokeWidth={2.5} strokeDasharray="2 6" strokeLinecap="round" /> : null}
              <Circle cx={cx} cy={AXIS} r={8} fill={m.ref ? colors.card : ink} stroke={ink} strokeWidth={m.ref ? 3 : 0} />
              {m.label ? (
                <SvgText x={cx} y={AXIS - 17} textAnchor="middle" fontFamily={FONT['600']} fontSize={11} fill={colors.text2}>
                  {m.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}

        <SvgText x={PAD - 8} y={H - 10} textAnchor="start" {...label}>PAST</SvgText>
        <SvgText x={now} y={H - 10} textAnchor="middle" {...label}>NOW</SvgText>
        <SvgText x={width - PAD + 10} y={H - 10} textAnchor="end" {...label}>FUTURE</SvgText>
      </Svg>
    </View>
  );
}
