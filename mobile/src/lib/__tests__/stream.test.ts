import { readEvents } from '../stream';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const enc = new TextEncoder();

// A reader that hands back the given byte chunks one by one, like a network stream.
const readerOf = (chunks: Uint8Array[]) => {
  let i = 0;
  return { read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined }) };
};

const frame = (name: string, data: unknown) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

describe('readEvents', () => {
  it('parses events delivered one per chunk', async () => {
    const seen: [string, unknown][] = [];
    await readEvents(readerOf([enc.encode(frame('delta', { text: 'Hi' })), enc.encode(frame('done', { turns: 1 }))]), (n, d) => seen.push([n, d]));
    expect(seen).toEqual([['delta', { text: 'Hi' }], ['done', { turns: 1 }]]);
  });

  it('puts an event back together when the network splits it anywhere', async () => {
    const bytes = enc.encode(frame('delta', { text: 'a split event' }) + frame('done', { ok: true }));
    for (let cut = 1; cut < bytes.length; cut += 7) {
      const seen: string[] = [];
      await readEvents(readerOf([bytes.slice(0, cut), bytes.slice(cut)]), (n) => seen.push(n));
      expect(seen).toEqual(['delta', 'done']);
    }
  });

  it('does not break a character that is cut in the middle of its bytes', async () => {
    const bytes = enc.encode(frame('delta', { text: 'café 😀 — ok' }));
    const seen: unknown[] = [];
    // cut inside the emoji (4 bytes) and inside the accented e
    const mid = bytes.indexOf(0xf0) + 2;
    await readEvents(readerOf([bytes.slice(0, mid), bytes.slice(mid)]), (_n, d) => seen.push(d));
    expect(seen).toEqual([{ text: 'café 😀 — ok' }]);
  });

  it('ignores an unfinished event at the end of the stream', async () => {
    const seen: string[] = [];
    await readEvents(readerOf([enc.encode(frame('delta', { text: 'x' }) + 'event: delta\ndata: {"te')]), (n) => seen.push(n));
    expect(seen).toEqual(['delta']);
  });

  it('copes with an empty stream', async () => {
    const seen: string[] = [];
    await readEvents(readerOf([]), (n) => seen.push(n));
    expect(seen).toEqual([]);
  });
});
