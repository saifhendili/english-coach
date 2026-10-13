import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { generateJson } from '../services/gemini.js';
import { modelOpts } from '../services/models.js';
import { transcribeAudio } from '../services/prompts.js';
import { MIN_AUDIO_BYTES, audioMime } from '../services/stt.js';

const schema = z.object({ transcript: z.string().max(3000) });

// The request body is the raw audio (see the route). Returns { text }, empty when nothing was said.
export async function transcribe(req, res) {
  const mimeType = audioMime(req.headers['content-type']);
  if (!mimeType) {
    throw new AppError(415, 'UNSUPPORTED_AUDIO', 'Send the recording as WAV, MP3, AAC, OGG, FLAC, WebM or MP4 audio.');
  }
  const audio = req.body;
  if (!Buffer.isBuffer(audio) || audio.length < MIN_AUDIO_BYTES) {
    throw new AppError(400, 'AUDIO_TOO_SHORT', 'The recording is empty or too short.');
  }

  const { system, prompt } = transcribeAudio();
  const out = await generateJson({
    apiKey: req.geminiKey,
    ...modelOpts(req.user, 'fast'),
    system,
    prompt: [{ role: 'user', parts: [{ inlineData: { mimeType, data: audio.toString('base64') } }, { text: prompt }] }],
    schema,
    temperature: 0,
    noThinking: true,
    timeoutMs: 40_000,
  });
  res.json({ text: out.transcript.trim() });
}
