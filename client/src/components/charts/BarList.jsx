import { useRef, useState } from 'react';
import ChartCard, { DataTable } from './ChartCard';
import Tooltip from './Tooltip';

const VALUE_ROOM = 44; // pixels kept free at the end of every bar for its value label

// Horizontal bars for nominal categories (a skill, a type of mistake): one colour for all of them, because the bar's
// length already says "more". Square at the baseline, 4px round at the data end, the value at the tip.
//   rows: [{ label, value, detail? }]   max: the full-bar value (default: the largest)   unit: '%' etc.
export default function BarList({ title, subtitle, rows, max, unit = '', valueLabel = 'Value', caption }) {
  const full = max ?? Math.max(...rows.map((r) => r.value), 1);
  const box = useRef(null);
  const [tip, setTip] = useState(null);
  const total = rows.reduce((n, r) => n + r.value, 0);

  const show = (row, el) => {
    const outer = box.current.getBoundingClientRect();
    const bar = el.getBoundingClientRect();
    setTip({ row, x: bar.left - outer.left + Math.min(bar.width, 160) / 2 + 40, y: bar.top - outer.top - 8 });
  };

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      chart={
        <div ref={box} className="relative" onPointerLeave={() => setTip(null)}>
          <ul className="space-y-2.5">
            {rows.map((row) => {
              const pct = Math.max(0, Math.min(1, row.value / full));
              return (
                <li
                  key={row.label}
                  tabIndex={0}
                  className="grid grid-cols-[7.5rem_1fr] items-center gap-3 rounded-lg outline-offset-2"
                  onPointerEnter={(e) => show(row, e.currentTarget)}
                  onFocus={(e) => show(row, e.currentTarget)}
                  onBlur={() => setTip(null)}
                  aria-label={`${row.label}: ${row.value}${unit}${row.detail ? `, ${row.detail}` : ''}`}
                >
                  <span className="truncate text-[13px]" style={{ color: 'var(--viz-text-2)' }}>
                    {row.label}
                  </span>
                  <span className="relative block h-5" style={{ borderLeft: '1px solid var(--viz-axis)' }}>
                    <span
                      className="absolute left-0 top-0.5 block h-4 transition-[filter] hover:brightness-110"
                      style={{
                        width: `max(2px, calc((100% - ${VALUE_ROOM}px) * ${pct}))`,
                        background: 'var(--viz-1)',
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                    <span
                      className="absolute top-0 text-xs font-bold leading-5"
                      style={{ left: `calc((100% - ${VALUE_ROOM}px) * ${pct} + 8px)`, color: 'var(--viz-text)' }}
                    >
                      {row.value}
                      {unit}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          {tip && (
            <Tooltip
              x={tip.x}
              width={box.current?.clientWidth ?? 300}
              top={Math.max(0, tip.y - 42)}
              title={tip.row.label}
              rows={[{ label: tip.row.detail ?? valueLabel, value: `${tip.row.value}${unit}`, color: 'var(--viz-1)' }, ...(unit === '' && total > 0 ? [{ label: 'of all', value: `${Math.round((tip.row.value / total) * 100)}%` }] : [])]}
            />
          )}
        </div>
      }
      table={<DataTable caption={caption ?? title} columns={['Name', valueLabel, ...(rows.some((r) => r.detail) ? ['Detail'] : [])]} rows={rows.map((r) => [r.label, `${r.value}${unit}`, ...(rows.some((x) => x.detail) ? [r.detail ?? ''] : [])])} />}
    />
  );
}
