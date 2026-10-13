import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register } from '../controllers/auth.js';
import * as chat from '../controllers/chat.js';
import * as dictionary from '../controllers/dictionary.js';
import * as interests from '../controllers/interests.js';
import * as phrases from '../controllers/phrases.js';
import * as placement from '../controllers/placement.js';
import { progress } from '../controllers/progress.js';
import * as review from '../controllers/review.js';
import * as saved from '../controllers/saved.js';
import * as stt from '../controllers/stt.js';
import * as tenses from '../controllers/tenses.js';
import * as topics from '../controllers/topics.js';
import { getSettings, testGeminiKey, updateSettings } from '../controllers/settings.js';
import { requireAuth, requireGeminiKey } from '../middleware/auth.js';
import { MAX_AUDIO_BYTES } from '../services/stt.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

// Brute-force guard on credentials only.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later' } },
});
router.post('/auth/register', authLimiter, register);
router.post('/auth/login', authLimiter, login);

router.use(requireAuth);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/test-key', testGeminiKey);

router.get('/placement/status', placement.status);
router.get('/placement/:id/result', placement.result);
router.post('/placement/start', requireGeminiKey, placement.start);
router.post('/placement/next', requireGeminiKey, placement.next);
router.post('/placement/finish', requireGeminiKey, placement.finish);

router.get('/interests', interests.get);
router.put('/interests', interests.put);
router.post('/interests/suggest', requireGeminiKey, interests.suggest);

router.get('/topics', topics.list);
router.post('/topics/generate', requireGeminiKey, topics.generate);
router.post('/topics/:id/favorite', topics.favorite);

router.get('/sessions', chat.listSessions);
router.post('/sessions', requireGeminiKey, chat.createSession);
router.get('/sessions/:id', chat.getSession);
router.post('/sessions/:id/end', requireGeminiKey, chat.endSession);
router.post('/chat/turn', requireGeminiKey, chat.turn);

// The body is the raw recording. Login is checked first (router.use above), so nobody unauthenticated can upload.
router.post('/stt/transcribe', express.raw({ type: 'audio/*', limit: MAX_AUDIO_BYTES }), requireGeminiKey, stt.transcribe);

router.get('/saved', saved.list);
router.post('/saved', saved.save);
router.delete('/saved/:id', saved.remove);

router.get('/dictionary/:word', dictionary.define);
router.post('/dictionary/explain', requireGeminiKey, dictionary.explain);

router.get('/progress', progress);

router.get('/review/summary', review.summary);
router.get('/review/queue', review.queue);
router.post('/review/answer', review.answer);

router.get('/phrases', phrases.list);
router.post('/phrases/generate', requireGeminiKey, phrases.generate);
router.post('/phrases/practice', requireGeminiKey, phrases.practice);

router.get('/tenses', tenses.overview);
router.get('/tenses/practice', tenses.practice);
router.post('/tenses/practice', tenses.record);
router.post('/tenses/generate', requireGeminiKey, tenses.generate);

export default router;
