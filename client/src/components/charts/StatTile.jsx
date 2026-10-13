import { TrendingDown, TrendingUp } from 'lucide-react';
import { signed } from '../../lib/chart';

// A 14-point trend in the quiet ink colour, the latest point in the accent. No axes: it is a hint, not a chart.
function Sparkline({ values }) {
  const W = 84;
  const H = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [5 + ((W - 10) * i) / (values.length - 1), H - 5 - (v / max) * (H - 10)]); // 5px of room for the end dot
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const [lx, ly] = pts.at(-1);
  return (
    <svg width={W} height={H} aria-hidden="true" className="shrink-0">
      <path d={d} fill="none" stroke="var(--viz-muted)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="4" fill="var(--viz-1)" stroke="var(--viz-surface)" strokeWidth="2" />
    </svg>
  );
}

// label (sentence case) · value · optional delta against a named period · optional trend.
export default function StatTile({ label, value, delta, deltaLabel, trend, note }) {
  const up = delta > 0;
  return (
    <div className="chart-card viz-root !p-4">
      <p className="text-sm" style={{ color: 'var(--viz-text-2)' }}>
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold leading-none tracking-tight">{value}</p>
        {trend && trend.some((v) => v > 0) && <Sparkline values={trend} />}
      </div>
      {delta != null && delta !== 0 && (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: up ? 'var(--viz-good)' : 'var(--viz-text-2)' }}>
          {up ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
          {signed(delta)} {deltaLabel}
        </p>
      )}
      {note && (
        <p className="mt-2 text-xs" style={{ color: 'var(--viz-text-2)' }}>
          {note}
        </p>
      )}
    </div>
  );
}
