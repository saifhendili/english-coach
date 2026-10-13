import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { ChatSession, MISTAKE_TYPES } from '../models/ChatSession.js';
import { Interest } from '../models/Interest.js';
import { Mistake } from '../models/Mistake.js';
import { Topic } from '../models/Topic.js';
import { FOCUS_AREAS } from '../services/focus.js';
import { generateJson, streamJson } from '../services/gemini.js';
import { locked } from '../services/lock.js';
import { modelOpts } from '../services/models.js';
import { LANGUAGE_NAMES, chatSystem, compactSummary, roleplayOpening, sessionReport, talkOpening } from '../services/prompts.js';
import { partialString } from '../services/stream.js';

// Long chats: the last KEEP messages are sent in full (12 turns); once COMPACT_AT messages pile up
// the older ones are folded into a short running summary.
const KEEP = 24;
const COMPACT_AT = 40;

const FREE_OPENERS = [
  'Hi! What is something good that happened to you this week?',
  'Hello! What did you do today?',
  'Hi there! Tell me about something you are looking forward to.',
  'Hey! If you could go anywhere tomorrow, where would you go?',
  'Hi! What is a small thing that made you smile recently?',
  'Hello! What do you usually do to relax?',
  'Hi! Tell me about your favourite place in your city.',
  'Hey! What is the best meal you have had lately?',
];

const objectId = z.string().regex(/^[0-9a-f]{24}$/i);

// ---- Gemini output (the array limits are applied in code: see the note in controllers/topics.js) ----

const turnSchema = ({ translate }) =>
  z.object({
    reply: z.string().min(1).max(1200),
    correction: z.object({
      hasMistakes: z.boolean(),
      corrected: z.string().max(2000),
      items: z.array(
        z.object({
          wrong: z.string().min(1).max(300),
          right: z.string().min(1).max(300),
          type: z.enum(MISTAKE_TYPES),
          explanation: z.string().min(1).max(300),
        }),
      ),
    }),
    phrases: z.array(
      z.object({ said: z.string().max(200).nullable(), better: z.string().min(2).max(160), why: z.string().min(1).max(300) }),
    ),
    newWords: z.array(
      z.object({
        word: z.string().min(1).max(60),
        meaning: z.string().min(1).max(200),
        ...(translate && { translation: z.string().min(1).max(80) }),
      }),
    ),
  });

const openingSchema = z.object({ reply: z.string().min(1).max(600) });
const summarySchema = z.object({ summary: z.string().min(1).max(800) });
const reportSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1).max(800),
  strengths: z.array(z.string().min(1).max(200)),
  topMistakes: z.array(
    z.object({ pattern: z.string().min(1).max(80), example: z.string().min(1).max(240), tip: z.string().min(1).max(240) }),
  ),
  nextTopic: z.object({ title: z.string().min(3).max(100), why: z.string().min(1).max(240) }),
});

// topicId: a saved topic. title: a conversation about anything (e.g. the "next topic" a report suggests).
const createBody = z.object({
  topicId: objectId.optional(),
  mode: z.enum(['talk', 'roleplay']).optional(),
  title: z.string().trim().min(3).max(100).optional(),
});
const turnBody = z.object({ sessionId: objectId, text: z.string().trim().min(1).max(1200) });

// ---- Views ----

const turnsOf = (s) => s.messages.filter((m) => m.role === 'user').length;

const messageView = (m) => ({
  role: m.role,
  text: m.text,
  correction: m.correction?.items
    ? { hasMistakes: Boolean(m.correction.hasMistakes), corrected: m.correction.corrected, items: m.correction.items.map((i) => ({ ...i.toObject?.() ?? i })) }
    : null,
  phrases: (m.phrases ?? []).map((p) => ({ said: p.said ?? null, better: p.better, why: p.why })),
  newWords: (m.newWords ?? []).map((w) => ({ word: w.word, meaning: w.meaning, translation: w.translation ?? null })),
  createdAt: m.createdAt,
});

function sessionView(s, { messages = true } = {}) {
  const ended = s.status === 'ended';
  const mistakes = s.messages.reduce((n, m) => n + (m.correction?.items?.length ?? 0), 0);
  return {
    id: s.id,
    mode: s.mode,
    title: s.title,
    emoji: s.emoji,
    scenario: s.scenario ?? null,
    level: s.level,
    status: s.status,
    turns: turnsOf(s),
    score: s.score ?? null,
    report: s.report ?? null,
    stats: ended ? { turns: turnsOf(s), mistakes, minutes: Math.max(1, Math.round(((s.endedAt ?? s.updatedAt) - s.createdAt) / 60000)) } : null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    ...(messages && { messages: s.messages.map(messageView) }),
  };
}

async function loadSession(req, id) {
  const parsed = objectId.safeParse(id);
  const session = parsed.success && (await ChatSession.findOne({ _id: parsed.data, userId: req.user._id }));
  if (!session) throw new AppError(404, 'NOT_FOUND', 'Conversation not found');
  return session;
}

const wantsTranslation = (user) => user.nativeLang !== 'en' && Boolean(LANGUAGE_NAMES[user.nativeLang]);

async function focusFor(user) {
  const interest = await Interest.findOne({ userId: user._id });
  return FOCUS_AREAS.filter((f) => interest?.focus.includes(f.id));
}

// ---- Sessions ----

export async function createSession(req, res) {
  const { topicId, mode: wanted, title: customTitle } = createBody.parse(req.body ?? {});
  const user = req.user;

  let topic = null;
  if (topicId) {
    topic = await Topic.findOne({ _id: topicId, userId: user._id });
    if (!topic) throw new AppError(404, 'NOT_FOUND', 'Topic not found');
  }
  const mode = !topic ? (customTitle ? 'talk' : 'free') : wanted === 'roleplay' ? 'roleplay' : 'talk';
  const level = user.level ?? topic?.level ?? 'B1';

  let opening;
  if (mode === 'talk' && topic) {
    opening = topic.openers[0]; // already written for this level, no Gemini call needed
  } else if (mode === 'free') {
    opening = FREE_OPENERS[Math.floor(Math.random() * FREE_OPENERS.length)];
  } else {
    const { system, prompt } = topic
      ? roleplayOpening({ scenario: topic.scenario, level })
      : talkOpening({ title: customTitle, level });
    const out = await generateJson({
      apiKey: req.geminiKey,
      ...modelOpts(user, 'fast'),
      system,
      prompt,
      schema: openingSchema,
      temperature: 1,
      noThinking: true,
    });
    opening = out.reply;
  }

  const session = await ChatSession.create({
    userId: user._id,
    topicId: topic?._id ?? null,
    mode,
    title: topic?.title ?? customTitle ?? 'Free chat',
    emoji: topic?.emoji ?? '💬',
    scenario: mode === 'roleplay' ? topic.scenario : undefined,
    level,
    messages: [{ role: 'assistant', text: opening }],
  });
  res.status(201).json({ session: sessionView(session) });
}

export async function listSessions(req, res) {
  const limit = z.coerce.number().int().min(1).max(50).default(20).parse(req.query.limit);
  const sessions = await ChatSession.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('title emoji mode status level score createdAt updatedAt endedAt messages.role messages.correction.items');
  res.json({ sessions: sessions.map((s) => sessionView(s, { messages: false })) });
}

export async function getSession(req, res) {
  res.json({ session: sessionView(await loadSession(req, req.params.id)) });
}

// ---- A conversation turn (streamed) ----

// Everything not yet folded into the summary, then the new message. History may start with the
// coach's opening line: Gemini accepts a conversation that begins with a "model" turn.
function contentsFor(session, text) {
  const learner = (t) => `<learner>${t.replace(/<\/?learner>/gi, '')}</learner>`;
  const history = session.messages.slice(session.compactedUpTo).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.role === 'user' ? learner(m.text) : m.text }],
  }));
  return [...history, { role: 'user', parts: [{ text: learner(text) }] }];
}

// Folds old messages into the running summary. Best effort: if it fails the chat simply
// keeps sending the longer history.
async function maybeCompact(session, req) {
  if (session.messages.length - session.compactedUpTo <= COMPACT_AT) return;
  const upTo = session.messages.length - KEEP;
  try {
    const { system, prompt } = compactSummary({
      previous: session.summaryText,
      messages: session.messages.slice(session.compactedUpTo, upTo),
    });
    const out = await generateJson({
      apiKey: req.geminiKey,
      ...modelOpts(req.user, 'fast'),
      system,
      prompt,
      schema: summarySchema,
      temperature: 0.2,
      noThinking: true,
    });
    session.summaryText = out.summary;
    session.compactedUpTo = upTo;
    await session.save();
  } catch (err) {
    console.warn('[chat] could not compact the conversation:', err.code ?? err.message);
  }
}

function openSse(res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  res.flushHeaders?.();
  return (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Events: "delta" {text} while the reply is written, then "done" {userMessage, assistantMessage, turns},
// or "error" {code, message}. Nothing is saved unless the whole turn succeeds, so a failed
// request can simply be sent again.
export async function turn(req, res) {
  const { sessionId, text } = turnBody.parse(req.body);
  const user = req.user;
  const session = await loadSession(req, sessionId);
  if (session.status === 'ended') throw new AppError(409, 'ALREADY_ENDED', 'This conversation has ended.');

  await locked(`chat:${sessionId}`, async () => {
    await maybeCompact(session, req); // before the stream opens, so a hiccup here is not a stream error

    const focus = await focusFor(user);
    const translate = wantsTranslation(user);
    const aborted = new AbortController();
    res.on('close', () => {
      if (!res.writableFinished) aborted.abort(); // the learner left: stop paying for the answer
    });

    const send = openSse(res);
    let sent = 0;
    try {
      const data = await streamJson({
        apiKey: req.geminiKey,
        ...modelOpts(user, 'fast'),
        contents: contentsFor(session, text),
        system: chatSystem({
          level: session.level,
          language: user.nativeLang,
          strictness: user.settings.strictness,
          mode: session.mode,
          title: session.title,
          scenario: session.scenario,
          summaryText: session.summaryText,
          focus,
        }),
        schema: turnSchema({ translate }),
        temperature: 0.8,
        noThinking: true,
        signal: aborted.signal,
        onText: (buffer) => {
          const { text: reply } = partialString(buffer, 'reply');
          if (reply.length > sent) {
            send('delta', { text: reply.slice(sent) });
            sent = reply.length;
          }
        },
      });

      const items = data.correction.items.slice(0, 6);
      const correction = { hasMistakes: items.length > 0, corrected: items.length ? data.correction.corrected : text, items };
      const phrases = data.phrases.slice(0, 2).map((p) => ({ said: p.said, better: p.better, why: p.why }));
      const newWords = data.newWords.slice(0, 3);

      session.messages.push({ role: 'user', text, correction, phrases }, { role: 'assistant', text: data.reply, newWords });
      await session.save();
      if (items.length) {
        await Mistake.insertMany(
          items.map((i) => ({
            userId: user._id,
            sessionId: session._id,
            wrong: i.wrong,
            right: i.right,
            type: i.type,
            explanation: i.explanation,
            sentence: text,
            corrected: correction.corrected,
          })),
        );
      }

      const [userMsg, botMsg] = session.messages.slice(-2).map(messageView);
      send('done', { userMessage: userMsg, assistantMessage: botMsg, turns: turnsOf(session) });
    } catch (err) {
      if (!aborted.signal.aborted) {
        send('error', { code: err.code ?? 'INTERNAL', message: err.message, retryAfterSeconds: err.extra?.retryAfterSeconds });
        if (!err.code) console.error(err);
      }
    } finally {
      res.end();
    }
  });
}

// ---- End of session ----

export async function endSession(req, res) {
  const session = await loadSession(req, req.params.id);
  if (session.status === 'ended') return res.json({ session: sessionView(session) });

  await locked(`chat:${session.id}`, async () => {
    const learnerMessages = session.messages.filter((m) => m.role === 'user');
    let report = null;

    if (learnerMessages.length) {
      const { system, prompt } = sessionReport({
        level: session.level,
        language: req.user.nativeLang,
        title: session.title,
        transcript: session.messages.slice(-40),
        mistakes: session.messages.flatMap((m) => m.correction?.items ?? []),
        phrases: session.messages.flatMap((m) => (m.phrases ?? []).map((p) => p.better)),
      });
      try {
        report = await generateJson({
          apiKey: req.geminiKey,
          ...modelOpts(req.user, 'strong'),
          system,
          prompt,
          schema: reportSchema,
          temperature: 0.5,
          noThinking: true,
        });
      } catch (err) {
        // Quota or key trouble: let the learner try again. A model that keeps returning bad JSON should not trap them.
        if (!/^GEMINI_BAD_/.test(err.code)) throw err;
      }
    }

    session.status = 'ended';
    session.endedAt = new Date();
    session.report = report;
    session.score = report?.score ?? null;
    await session.save();
    res.json({ session: sessionView(session) });
  });
}
