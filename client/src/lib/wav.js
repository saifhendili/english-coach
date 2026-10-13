// Encodes mono samples (-1..1) as a 16-bit PCM WAV file. Gemini documents WAV (not the WebM that Chrome
// records), and every browser can decode its own recording to samples, so uploads are converted to WAV.
export function encodeWav(samples, sampleRate) {
  const bytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));

  text(0, 'RIFF');
  view.setUint32(4, 36 + bytes, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per frame
  view.setUint16(34, 16, true); // bits per sample
  text(36, 'data');
  view.setUint32(40, bytes, true);

  samples.forEach((s, i) => {
    const clamped = Math.max(-1, Math.min(1, s));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });
  return new Blob([buffer], { type: 'audio/wav' });
}

const TARGET_RATE = 16000; // plenty for speech, and a minute of it is under 2 MB

// Turns whatever the browser recorded (webm, mp4, ogg) into a 16 kHz mono WAV.
export async function recordingToWav(blob) {
  const Context = window.AudioContext || window.webkitAudioContext;
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    // Rendering through an OfflineAudioContext resamples and mixes down to mono in one go.
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * TARGET_RATE)), TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return { wav: encodeWav(rendered.getChannelData(0), TARGET_RATE), seconds: decoded.duration };
  } finally {
    context.close?.();
  }
}
