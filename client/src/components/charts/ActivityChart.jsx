import { useState } from 'react';
import { compact, labelIndexes, niceScale, roundedTopRect, shortDate } from '../../lib/chart';
import ChartCard, { DataTable, Legend } from './ChartCard';
import Tooltip from './Tooltip';
import { useWidth } from './useWidth';

const H = 200; // the whole box: plot and the band for the x-axis labels
const M = { l: 32, r: 6, t: 8, b: 26 };
const GAP = 2; // the surface-coloured gap between stacked segments

const SERIES = [
  { key: 'messages', label: 'Chat messages', color: 'var(--viz-1)' },
  { key: 'reviews', label: 'Cards reviewed', color: 'var(--viz-2)' },
];

// Per day: messages written and cards reviewed, stacked. Hover, touch or the arrow keys read a day.
export default function ActivityChart({ days }) {
  const [box, width] = useWidth();
  const [active, setActive] = useState(null);

  const innerW = width - M.l - M.r;
  const innerH = H - M.t - M.b;
  const { top, ticks } = niceScale(Math.max(...days.map((d) => d.messages + d.reviews)));
  const slot = innerW / days.length;
  const barW = Math.max(3, Math.min(24, slot - 2)); // thin marks, with air between them
  const x = (i) => M.l + slot * i + (slot - barW) / 2;
  const y = (v) => M.t + innerH - (v / top) * innerH;
  const base = M.t + innerH;

  const at = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.min(days.length - 1, Math.max(0, Math.floor(((e.clientX - rect.left - M.l) / innerW) * days.length)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => Math.min(days.length - 1, Math.max(0, (a ?? days.length) + (e.key === 'ArrowRight' ? 1 : -1))));
    } else if (e.key === 'Escape') setActive(null);
  };

  const day = active == null ? null : days[active];
  const total = days.reduce((n, d) => n + d.messages + d.reviews, 0);

  return (
    <ChartCard
      title="Daily activity"
      subtitle="Messages you wrote and cards you reviewed, last 30 days"
      legend={<Legend items={SERIES} />}
      chart={
        <div
          ref={box}
          className="relative"
          tabIndex={0}
          role="group"
          aria-label={`Daily activity chart, ${total} actions in 30 days. Use the left and right arrow keys to read each day.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          <svg width={width} height={H} role="img" aria-hidden="true" style={{ touchAction: 'pan-y', display: 'block' }}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth="1" />
                <text x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--viz-muted)">
                  {compact(t)}
                </text>
              </g>
            ))}

            {days.map((d, i) => {
              const dim = active != null && active !== i ? 0.45 : 1;
              const mH = (d.messages / top) * innerH;
              const rH = (d.reviews / top) * innerH;
              const topIsReviews = d.reviews > 0;
              return (
                <g key={d.date} opacity={dim}>
                  {d.messages > 0 &&
                    (topIsReviews ? (
                      <rect x={x(i)} y={base - mH} width={barW} height={mH} fill="var(--viz-1)" />
                    ) : (
                      <path d={roundedTopRect(x(i), base - mH, barW, mH)} fill="var(--viz-1)" />
                    ))}
                  {d.reviews > 0 && (
                    <path
                      d={roundedTopRect(x(i), base - mH - rH, barW, Math.max(1, rH - (d.messages > 0 ? GAP : 0)))}
                      fill="var(--viz-2)"
                    />
                  )}
                </g>
              );
            })}

            {labelIndexes(days.length).map((i) => {
              const cx = x(i) + barW / 2;
              // A label centred on a bar near an edge would be cut off: hang it inward from the edge instead.
              const anchor = cx - 22 < M.l ? 'start' : cx + 22 > width - M.r ? 'end' : 'middle';
              return (
                <text key={i} x={anchor === 'end' ? width - M.r : anchor === 'start' ? M.l : cx} y={H - 8} textAnchor={anchor} fontSize="11" fill="var(--viz-muted)">
                  {shortDate(days[i].date)}
                </text>
              );
            })}

            {active != null && <line x1={x(active) + barW / 2} x2={x(active) + barW / 2} y1={M.t} y2={base} stroke="var(--viz-axis)" strokeWidth="1" />}

            {/* The hit area is the whole column (wider than the bar) and the full height of the plot. */}
            <rect
              x={M.l}
              y={0}
              width={innerW}
              height={H - M.b + 8}
              fill="transparent"
              onPointerMove={(e) => setActive(at(e))}
              onPointerDown={(e) => setActive(at(e))}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
            />
          </svg>

          {day && (
            <Tooltip
              x={x(active) + barW / 2}
              width={width}
              title={shortDate(day.date)}
              rows={SERIES.map((s) => ({ label: s.label, value: day[s.key], color: s.color }))}
            />
          )}
        </div>
      }
      table={
        <DataTable
          caption="Daily activity, last 30 days"
          columns={['Day', 'Messages', 'Reviews']}
          rows={[...days].reverse().map((d) => [shortDate(d.date), d.messages, d.reviews])}
        />
      }
    />
  );
}
