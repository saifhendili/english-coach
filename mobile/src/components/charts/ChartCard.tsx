import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useViz } from '@/theme';

// The chart surface: a card in the chart palette (its own light and dark surface), so the colours behind the marks are
// the ones the palette was validated against.
export function ChartSurface({ children, label, padding = 18 }: { children: React.ReactNode; label?: string; padding?: number }) {
  const viz = useViz();
  return (
    <View accessibilityLabel={label} style={{ backgroundColor: viz.surface, borderRadius: 24, borderWidth: 1, borderColor: viz.border, padding, gap: 12 }}>
      {children}
    </View>
  );
}

// A chart with its title, an optional legend, and a Chart/Table switch. The table is the same data as text, so nothing
// depends on seeing colour or touching the chart.
export function ChartCard({ title, subtitle, legend, chart, table }: { title: string; subtitle?: string; legend?: React.ReactNode; chart: React.ReactNode; table: React.ReactNode }) {
  const viz = useViz();
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <ChartSurface label={title}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="700" accessibilityRole="header" style={{ color: viz.text }}>{title}</AppText>
          {subtitle ? <AppText variant="small" style={{ color: viz.text2 }}>{subtitle}</AppText> : null}
        </View>
        <View accessibilityRole="tablist" accessibilityLabel={`${title}: view`} style={{ flexDirection: 'row', padding: 2, borderRadius: 10, backgroundColor: viz.grid }}>
          {(['chart', 'table'] as const).map((v) => (
            <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: view === v }} accessibilityLabel={`${title}: ${v}`} onPress={() => setView(v)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: view === v ? viz.surface : 'transparent' }}>
              <AppText variant="caption" weight="700" style={{ color: view === v ? viz.text : viz.text2, textTransform: 'capitalize' }}>{v}</AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {legend && view === 'chart' ? legend : null}
      {view === 'chart' ? chart : table}
    </ChartSurface>
  );
}

// The table view: a plain, scrollable table.
export function DataTable({ columns, rows, caption }: { columns: string[]; rows: (string | number)[][]; caption: string }) {
  const viz = useViz();
  return (
    <ScrollView nestedScrollEnabled accessibilityLabel={caption} style={{ maxHeight: 288, borderRadius: 12, borderWidth: 1, borderColor: viz.grid }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: viz.surface }}>
        {columns.map((c, i) => (
          <AppText key={c} variant="caption" weight="700" style={{ color: viz.text2, flex: i === 1 && columns.length === 3 ? 2 : 1, textAlign: i === columns.length - 1 && columns.length > 1 ? 'right' : 'left' }}>{c}</AppText>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: viz.grid }}>
          {row.map((cell, j) => (
            <AppText key={j} variant="small" numberOfLines={2} style={{ color: viz.text, flex: j === 1 && row.length === 3 ? 2 : 1, textAlign: j === row.length - 1 && row.length > 1 ? 'right' : 'left', fontVariant: ['tabular-nums'] }}>{cell}</AppText>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// A legend for two or more series: a swatch, then the name in text ink.
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  const viz = useViz();
  return (
    <View accessibilityLabel="Legend" style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
          <AppText variant="caption" style={{ color: viz.text2, fontWeight: '500' }}>{item.label}</AppText>
        </View>
      ))}
    </View>
  );
}

// One readout for a touched mark. Values lead, names follow; each row is keyed by a short line of its series colour.
// `x` is where to centre it, in the pixels of the chart box that holds it.
export function Tooltip({ x, width, title, rows, top = 4 }: { x: number; width: number; title?: string; rows: { label: string; value: string | number; color?: string }[]; top?: number }) {
  const viz = useViz();
  const w = 156;
  const left = Math.min(Math.max(x - w / 2, 4), Math.max(4, width - w - 4));
  return (
    <View pointerEvents="none" accessibilityRole="alert" style={{ position: 'absolute', left, top, width: w, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: viz.surface, borderWidth: 1, borderColor: viz.border, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
      {title ? <AppText variant="caption" weight="700" numberOfLines={1} style={{ color: viz.text2, marginBottom: 2 }}>{title}</AppText> : null}
      {rows.map((row) => (
        <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {row.color ? <View style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: row.color }} /> : null}
          <AppText variant="small" weight="800" style={{ color: viz.text }}>{row.value}</AppText>
          <AppText variant="caption" style={{ color: viz.text2, fontWeight: '500' }} numberOfLines={1}>{row.label}</AppText>
        </View>
      ))}
    </View>
  );
}
