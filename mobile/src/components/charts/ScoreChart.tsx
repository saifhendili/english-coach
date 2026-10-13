import { useState } from 'react';
import { View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { linePath, nearestIndex, shortDate } from '@/lib/chart';
import { FONT, useViz } from '@/theme';
import { ChartCard, DataTable, Tooltip } from './ChartCard';

const H = 190;
const M = { l: 30, r: 34, t: 10, b: 26 }; // room on the right for the label of the last point

type Session = { at: string; title: string; score: number };

// Score of each finished conversation, oldest to newest: one series, so no legend; the latest value is labelled.
export function ScoreChart({ sessions }: { sessions: Session[] }) {
  const viz = useViz();
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  const innerW = width - M.l - M.r;
  const innerH = H - M.t - M.b;
  const n = sessions.length;
  const x = (i: number) => M.l + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const y = (v: number) => M.t + innerH - (v / 100) * innerH; // scores are always 0 to 100
  const base = M.t + innerH;
  const pts = sessions.map((s, i): [number, number] => [x(i), y(s.score)]);
  const last = n - 1;

  // A touch with no usable position is ignored rather than snapping to the first point.
  const read = (locationX: number) => Number.isFinite(locationX) && setActive(nearestIndex(pts.map((p) => p[0]), locationX));
  const onAction = (e: AccessibilityActionEvent) => setActive((a) => Math.min(last, Math.max(0, (a ?? (e.nativeEvent.actionName === 'increment' ? -1 : n)) + (e.nativeEvent.actionName === 'increment' ? 1 : -1))));

  const hit = active == null ? null : sessions[active];

  return (
    <ChartCard
      title="Conversation scores"
      subtitle={`From ${sessions[0].score} to ${sessions[last].score} over ${n} conversations`}
      chart={
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(200, Math.round(e.nativeEvent.layout.width)))}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Conversation score chart, latest ${sessions[last].score} out of 100. Swipe up or down to read each conversation, or open the table.`}
          accessibilityValue={{ text: hit ? `${shortDate(hit.at)}, ${hit.title}: ${hit.score}` : undefined }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={onAction}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) => read(e.nativeEvent.locationX)}
          onResponderMove={(e) => read(e.nativeEvent.locationX)}
        >
          <Svg width={width} height={H}>
            {[0, 50, 100].map((t) => (
              <G key={t}>
                <Line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? viz.axis : viz.grid} strokeWidth={1} />
                <SvgText fontFamily={FONT['500']} x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={viz.muted}>{t}</SvgText>
              </G>
            ))}

            <Path d={`${linePath(pts)}L${pts[last][0]} ${base}L${pts[0][0]} ${base}Z`} fill={viz.s1} opacity={0.1} />
            <Path d={linePath(pts)} fill="none" stroke={viz.s1} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {active != null ? <Line x1={pts[active][0]} x2={pts[active][0]} y1={M.t} y2={base} stroke={viz.axis} strokeWidth={1} /> : null}

            {/* The end dot (and the touched one) carries a 2px ring in the surface colour. */}
            {[...new Set([last, active].filter((i): i is number => i != null))].map((i) => (
              <Circle key={i} cx={pts[i][0]} cy={pts[i][1]} r={4} fill={viz.s1} stroke={viz.surface} strokeWidth={2} />
            ))}
            <SvgText fontFamily={FONT['700']} x={pts[last][0] + 9} y={pts[last][1] + 4} fontSize={13} fill={viz.text}>{sessions[last].score}</SvgText>

            <SvgText fontFamily={FONT['500']} x={M.l} y={H - 8} fontSize={11} fill={viz.muted} textAnchor="start">{shortDate(sessions[0].at)}</SvgText>
            {n > 1 ? <SvgText fontFamily={FONT['500']} x={width - M.r} y={H - 8} fontSize={11} fill={viz.muted} textAnchor="end">{shortDate(sessions[last].at)}</SvgText> : null}
          </Svg>

          {hit && active != null ? <Tooltip x={pts[active][0]} width={width} title={`${shortDate(hit.at)} · ${hit.title}`} rows={[{ label: 'score', value: hit.score, color: viz.s1 }]} /> : null}
        </View>
      }
      table={<DataTable caption="Score of each finished conversation" columns={['Date', 'Conversation', 'Score']} rows={[...sessions].reverse().map((s) => [shortDate(s.at), s.title, s.score])} />}
    />
  );
}
