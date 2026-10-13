import { useState } from 'react';

// A chart with its title, an optional legend, and a Chart/Table switch. The table is the same data in text,
// so nothing depends on seeing colour or hovering.
export default function ChartCard({ title, subtitle, legend, chart, table }) {
  const [view, setView] = useState('chart');
  return (
    <section className="chart-card viz-root" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--viz-text-2)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div role="group" aria-label={`${title}: view`} className="inline-flex shrink-0 rounded-lg p-0.5 text-xs font-semibold" style={{ background: 'var(--viz-grid)' }}>
          {['chart', 'table'].map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="rounded-md px-2.5 py-1 capitalize transition"
              style={view === v ? { background: 'var(--viz-surface)', color: 'var(--viz-text)' } : { color: 'var(--viz-text-2)' }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {legend && view === 'chart' && <div className="mt-3">{legend}</div>}
      <div className="mt-3">{view === 'chart' ? chart : table}</div>
    </section>
  );
}

// The table view: a plain, scrollable table.
export function DataTable({ columns, rows, caption }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg" style={{ border: '1px solid var(--viz-grid)' }}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 text-xs" style={{ background: 'var(--viz-surface)', color: 'var(--viz-text-2)' }}>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--viz-grid)' }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// A legend for two or more series: a swatch shaped like the mark (a rect for bars), then the name in text ink.
export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5" style={{ color: 'var(--viz-text-2)' }}>
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
