import { useState } from 'react';
import { linePath, nearestIndex, shortDate } from '../../lib/chart';
import ChartCard, { DataTable } from './ChartCard';
import Tooltip from './Tooltip';
import { useWidth } from './useWidth';

const H = 190;
const M = { l: 30, r: 34, t: 10, b: 26 }; // room on the right for the label of the last point

// Score of each finished conversation, oldest to newest: one series, so no legend; the latest value is labelled.
export default function ScoreChart({ sessions }) {
  const [box, width] = useWidth();
  const [active, setActive] = useState(null);

  const innerW = width - M.l - M.r;
  const innerH = H - M.t - M.b;
  const n = sessions.length;
  const x = (i) => M.l + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const y = (v) => M.t + innerH - (v / 100) * innerH; // scores are always 0 to 100
  const base = M.t + innerH;
  const pts = sessions.map((s, i) => [x(i), y(s.score)]);
  const last = n - 1;

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(pts.map((p) => p[0]), e.clientX - rect.left));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => Math.min(last, Math.max(0, (a ?? n) + (e.key === 'ArrowRight' ? 1 : -1))));
    } else if (e.key === 'Escape') setActive(null);
  };

  const hit = active == null ? null : sessions[active];
  const firstScore = sessions[0].score;

  return (
    <ChartCard
      title="Conversation scores"
      subtitle={`From ${firstScore} to ${sessions[last].score} over ${n} conversations`}
      chart={
        <div
          ref={box}
          className="relative"
          tabIndex={0}
          role="group"
          aria-label={`Conversation score chart, latest ${sessions[last].score} out of 100. Use the left and right arrow keys to read each conversation.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
        >
          <svg width={width} height={H} aria-hidden="true" style={{ touchAction: 'pan-y', display: 'block' }}>
            {[0, 50, 100].map((t) => (
              <g key={t}>
                <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth="1" />
                <text x={M.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--viz-muted)">
                  {t}
                </text>
              </g>
            ))}

            <path d={`${linePath(pts)}L${pts[last][0]} ${base}L${pts[0][0]} ${base}Z`} fill="var(--viz-1)" opacity="0.1" />
            <path d={linePath(pts)} fill="none" stroke="var(--viz-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {active != null && <line x1={pts[active][0]} x2={pts[active][0]} y1={M.t} y2={base} stroke="var(--viz-axis)" strokeWidth="1" />}

            {/* The end dot (and the hovered one) carries a 2px ring in the surface colour. */}
            {[...new Set([last, active].filter((i) => i != null))].map((i) => (
              <circle key={i} cx={pts[i][0]} cy={pts[i][1]} r="4" fill="var(--viz-1)" stroke="var(--viz-surface)" strokeWidth="2" />
            ))}
            <text x={pts[last][0] + 9} y={pts[last][1] + 4} fontSize="13" fontWeight="700" fill="var(--viz-text)">
              {sessions[last].score}
            </text>

            <text x={M.l} y={H - 8} fontSize="11" fill="var(--viz-muted)" textAnchor="start">
              {shortDate(sessions[0].at)}
            </text>
            {n > 1 && (
              <text x={width - M.r} y={H - 8} fontSize="11" fill="var(--viz-muted)" textAnchor="end">
                {shortDate(sessions[last].at)}
              </text>
            )}

            <rect x={M.l - 8} y={0} width={innerW + 16} height={H - M.b + 8} fill="transparent" onPointerMove={move} onPointerDown={move} onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)} />
          </svg>

          {hit && <Tooltip x={pts[active][0]} width={width} title={`${shortDate(hit.at)} · ${hit.title}`} rows={[{ label: 'score', value: hit.score, color: 'var(--viz-1)' }]} />}
        </div>
      }
      table={
        <DataTable
          caption="Score of each finished conversation"
          columns={['Date', 'Conversation', 'Score']}
          rows={[...sessions].reverse().map((s) => [shortDate(s.at), s.title, s.score])}
        />
      }
    />
  );
}
