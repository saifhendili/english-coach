// Splits `text` into pieces, flagging the ones that match any of `fragments` (first occurrence of each,
// never overlapping). Used to strike out what was wrong and highlight what is right.
export function segments(text, fragments) {
  const hits = [];
  for (const fragment of fragments) {
    if (!fragment) continue;
    let start = text.indexOf(fragment);
    if (start < 0) start = text.toLowerCase().indexOf(fragment.toLowerCase());
    const end = start + fragment.length;
    if (start >= 0 && !hits.some((h) => start < h.end && end > h.start)) hits.push({ start, end });
  }
  hits.sort((a, b) => a.start - b.start);

  const out = [];
  let pos = 0;
  for (const h of hits) {
    if (h.start > pos) out.push({ text: text.slice(pos, h.start), hit: false });
    out.push({ text: text.slice(h.start, h.end), hit: true });
    pos = h.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos), hit: false });
  return out.length ? out : [{ text, hit: false }];
}
