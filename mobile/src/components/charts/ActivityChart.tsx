import { useState } from 'react';
import { View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { compact, labelIndexes, niceScale, roundedTopRect, shortDate } from '@/lib/chart';
import { FONT, useViz } from '@/theme';
import { ChartCard, DataTable, Legend, Tooltip } from './ChartCard';

const H = 200; // the whole box: plot and the band for the x-axis labels
const M = { l: 32, r: 6, t: 8, b: 26 };
const GAP = 2; // the gap between stacked segments

type Day = { date: string; messages: number; reviews: number };

// Per day: messages written and cards reviewed, stacked. Touch (or VoiceOver's up/down swipe) reads a day.
export function ActivityChart({ days }: { days: Day[] }) {
  const viz = useViz();
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  const series = [
    { key: 'messages' as const, label: 'Chat messages', color: viz.s1 },
    { key: 'reviews' as const, label: 'Cards reviewed', color: viz.s2 },
  ];

  const innerW = width - M.l - M.r;
  const innerH = H - M.t - M.b;
  const { top, ticks } = niceScale(Math.max(...days.map((d) => d.messages + d.reviews)));
  const slot = innerW / days.length;
  const barW = Math.max(3, Math.min(24, slot - 2)); // thin marks, with air between them
  const x = (i: number) => M.l + slot * i + (slot - barW) / 2;
  const y = (v: number) => M.t + innerH - (v / top) * innerH;
  const base = M.t + innerH;

  const at = (locationX: number) => Math.min(days.length - 1, Math.max(0, Math.floor(((locationX - M.l) / innerW) * days.length)));
  // A touch with no usable position (it can happen at the very edge of the screen) is ignored rather than becoming NaN.
  const read = (locationX: number) => Number.isFinite(locationX) && setActive(at(locationX));
  const step = (by: number) => setActive((a) => Math.min(days.length - 1, Math.max(0, (a ?? (by > 0 ? -1 : days.length)) + by)));
  const onAction = (e: AccessibilityActionEvent) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1);

  const day = active == null ? null : days[active];
  const total = days.reduce((n, d) => n + d.messages + d.reviews, 0);

  return (
    <ChartCard
      title="Daily activity"
      subtitle="Messages you wrote and cards you reviewed, last 30 days"
      legend={<Legend items={series} />}
      chart={
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(200, Math.round(e.nativeEvent.layout.width)))}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Daily activity chart, ${total} actions in 30 days. Swipe up or down to read each day, or open the table.`}
          accessibilityValue={{ text: day ? `${shortDate(day.date)}: ${day.messages} messages, ${day.reviews} cards reviewed` : undefined }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={onAction}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => read(e.nativeEvent.locationX)}
          onResponderMove={(e) => read(e.nativeEvent.locationX)}
        >
          <Svg width={width} height={H}>
            {ticks.map((t) => (
              <G key={t}>
                <Line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? viz.axis : viz.grid} strokeWidth={1} />
                <SvgText fontFamily={FONT['500']} x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={viz.muted}>{compact(t)}</SvgText>
              </G>
            ))}

            {days.map((d, i) => {
              const mH = (d.messages / top) * innerH;
              const rH = (d.reviews / top) * innerH;
              return (
                <G key={d.date} opacity={active != null && active !== i ? 0.45 : 1}>
                  {d.messages > 0 ? (d.reviews > 0 ? <Rect x={x(i)} y={base - mH} width={barW} height={mH} fill={viz.s1} /> : <Path d={roundedTopRect(x(i), base - mH, barW, mH)} fill={viz.s1} />) : null}
                  {d.reviews > 0 ? <Path d={roundedTopRect(x(i), base - mH - rH, barW, Math.max(1, rH - (d.messages > 0 ? GAP : 0)))} fill={viz.s2} /> : null}
                </G>
              );
            })}

            {labelIndexes(days.length).map((i) => {
              const cx = x(i) + barW / 2;
              // A label centred on a bar near an edge would be cut off: hang it inward from the edge instead.
              const anchor = cx - 22 < M.l ? 'start' : cx + 22 > width - M.r ? 'end' : 'middle';
              return (
                <SvgText fontFamily={FONT['500']} key={i} x={anchor === 'end' ? width - M.r : anchor === 'start' ? M.l : cx} y={H - 8} textAnchor={anchor} fontSize={11} fill={viz.muted}>
                  {shortDate(days[i].date)}
                </SvgText>
              );
            })}

            {active != null ? <Line x1={x(active) + barW / 2} x2={x(active) + barW / 2} y1={M.t} y2={base} stroke={viz.axis} strokeWidth={1} /> : null}
          </Svg>

          {day ? <Tooltip x={x(active as number) + barW / 2} width={width} title={shortDate(day.date)} rows={series.map((s) => ({ label: s.label, value: day[s.key], color: s.color }))} /> : null}
        </View>
      }
      table={<DataTable caption="Daily activity, last 30 days" columns={['Day', 'Messages', 'Reviews']} rows={[...days].reverse().map((d) => [shortDate(d.date), d.messages, d.reviews])} />}
    />
  );
}
