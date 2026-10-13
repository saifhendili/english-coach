import { useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { useViz } from '@/theme';
import { ChartCard, DataTable } from './ChartCard';

const VALUE_ROOM = 44; // pixels kept free at the end of every bar for its value label

type Row = { label: string; value: number; detail?: string };

function BarRow({ row, full, unit }: { row: Row; full: number; unit: string }) {
  const viz = useViz();
  const [track, setTrack] = useState(0);
  const pct = Math.max(0, Math.min(1, row.value / full));
  const barW = Math.max(2, (track - VALUE_ROOM) * pct); // a share of the width left after the value's room

  return (
    <View accessible accessibilityLabel={`${row.label}: ${row.value}${unit}${row.detail ? `, ${row.detail}` : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <AppText variant="small" numberOfLines={1} style={{ width: 112, color: viz.text2, fontSize: 13 }}>{row.label}</AppText>
      <View onLayout={(e) => setTrack(e.nativeEvent.layout.width)} style={{ flex: 1, height: 20, borderLeftWidth: 1, borderLeftColor: viz.axis, justifyContent: 'center' }}>
        {track > 0 ? (
          <>
            <View style={{ position: 'absolute', left: 0, top: 2, width: barW, height: 16, backgroundColor: viz.s1, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
            <AppText variant="caption" weight="800" style={{ position: 'absolute', left: barW + 8, color: viz.text }}>{row.value}{unit}</AppText>
          </>
        ) : null}
      </View>
    </View>
  );
}

// Horizontal bars for nominal categories (a skill, a type of mistake): one colour for all of them, because the bar's
// length already says "more". Square at the baseline, 4px round at the data end, the value written at the tip.
export function BarList({ title, subtitle, rows, max, unit = '', valueLabel = 'Value', caption }: { title: string; subtitle?: string; rows: Row[]; max?: number; unit?: string; valueLabel?: string; caption?: string }) {
  const full = max ?? Math.max(...rows.map((r) => r.value), 1);
  const hasDetail = rows.some((r) => r.detail);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      chart={
        <View style={{ gap: 10 }}>
          {rows.map((row) => (
            <BarRow key={row.label} row={row} full={full} unit={unit} />
          ))}
        </View>
      }
      table={<DataTable caption={caption ?? title} columns={['Name', valueLabel, ...(hasDetail ? ['Detail'] : [])]} rows={rows.map((r) => [r.label, `${r.value}${unit}`, ...(hasDetail ? [r.detail ?? ''] : [])])} />}
    />
  );
}
