// Reads the value of a JSON string property out of text that is still arriving.
// Gemini streams its structured answer as growing JSON, e.g. '{"reply":"Hel' ... '{"reply":"Hello!","corr'.
// The reply is the first key, so it can be shown to the learner while the corrections are still
// being written. Returns what is decoded so far and whether the closing quote has been seen.
const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' };

export function partialString(buffer, key) {
  const start = new RegExp(`"${key}"\\s*:\\s*"`).exec(buffer);
  if (!start) return { text: '', done: false };

  let out = '';
  for (let i = start.index + start[0].length; i < buffer.length; i++) {
    const c = buffer[i];
    if (c === '"') return { text: out, done: true };
    if (c !== '\\') {
      out += c;
      continue;
    }
    const next = buffer[i + 1];
    if (next === undefined) break; // escape cut in half: wait for the next chunk
    if (next === 'u') {
      const hex = buffer.slice(i + 2, i + 6);
      if (hex.length < 4) break;
      out += String.fromCharCode(parseInt(hex, 16));
      i += 5;
    } else {
      out += ESCAPES[next] ?? next;
      i += 1;
    }
  }
  // An emoji arrives as two \uXXXX escapes: never show half of one.
  const last = out.charCodeAt(out.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1);
  return { text: out, done: false };
}
