// One readout for a hovered or focused mark. Values lead (strong), names follow (secondary); each row is keyed
// by a short line of its series colour. Everything is rendered as text nodes, never as HTML.
// `x` is where to centre it, in the pixels of the (relatively positioned) chart box that holds it.
export default function Tooltip({ x, width, title, rows, top = 4 }) {
  const half = 74; // about half the tooltip's width, so it never leaves the box
  const left = Math.min(Math.max(x, half + 4), Math.max(half + 4, width - half - 4));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ left, top, background: 'var(--viz-surface)', border: '1px solid var(--viz-border)', color: 'var(--viz-text)' }}
    >
      {title && (
        <p className="mb-1 whitespace-nowrap font-semibold" style={{ color: 'var(--viz-text-2)' }}>
          {title}
        </p>
      )}
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 whitespace-nowrap">
            {row.color && <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden="true" />}
            <strong className="text-sm">{row.value}</strong>
            <span style={{ color: 'var(--viz-text-2)' }}>{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
