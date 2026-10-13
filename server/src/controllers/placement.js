import { z } from 'zod';
import { AppError } from '../middleware/errors.js';
import { PlacementAttempt } from '../models/PlacementAttempt.js';
import { generateJson } from '../services/gemini.js';
import { locked } from '../services/lock.js';
import { modelOpts } from '../services/models.js';
import {
  LEVELS, MAX_QUESTIONS, MIN_TO_FINISH, PRODUCTIVE, TYPE_PLAN,
  chanceFor, finalAbility, levelToNum, numToLevel, productiveScore,
  shouldStop, shuffleOptions, skillBreakdown, updateAbility,
} from '../services/placement.js';
import { gradeProductive, mcqQuestion, placementFeedback, productiveQuestion } from '../services/prompts.js';

// ---- Gemini output schemas (also sent to Gemini as the response schema) ----

const mcqSchema = (withPassage) =>
  z
    .object({
      theme: z.string().min(1).max(60),
      passage: withPassage ? z.string().min(40) : z.string().optional(),
      question: z.string().min(5),
      options: z.array(z.string().min(1)).length(4),
      answerIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(1),
    })
    .refine((q) => new Set(q.options.map((o) => o.trim().toLowerCase())).size === 4, 'options must be distinct');

const taskSchema = z.object({ theme: z.string().min(1).max(60), question: z.string().min(5) });

const gradeSchema = z.object({
  cefrLevel: z.enum(LEVELS),
  grammar: z.number().int().min(0).max(10),
  vocabulary: z.number().int().min(0).max(10),
  fluency: z.number().int().min(0).max(10),
  feedback: z.string().min(1),
});

const feedbackSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(1).max(5),
  nextSteps: z.array(z.string()).min(1).max(4),
});

// ---- Request bodies ----

const objectId = z.string().regex(/^[0-9a-f]{24}$/i);
const answerSchema = z.union([
  z.object({ skip: z.literal(true) }),
  z.object({ choiceIndex: z.number().int().min(0).max(3) }),
  z.object({ text: z.string().trim().min(1).max(1500) }),
]);
const nextBody = z.object({ attemptId: objectId, answer: answerSchema.optional() });
const finishBody = z.object({ attemptId: objectId });

// ---- Helpers ----

async function loadAttempt(req, id) {
  const attempt = await PlacementAttempt.findOne({ _id: id, userId: req.user._id });
  if (!attempt) throw new AppError(404, 'NOT_FOUND', 'Placement test not found');
  return attempt;
}

const isAnswered = (q) => q.score != null;
const answeredOf = (attempt) => attempt.questions.filter(isAnswered);
const openQuestion = (attempt) => attempt.questions.find((q) => !isAnswered(q));
const abilityHistory = (attempt) => answeredOf(attempt).map((q) => q.abilityAfter);

// The correct answer and explanation stay on the server until the review page.
function publicQuestion(q, index) {
  return { index, type: q.type, prompt: q.prompt, passage: q.passage ?? null, options: q.options.length ? [...q.options] : null };
}

function stateView(attempt) {
  const answered = answeredOf(attempt).length;
  const open = openQuestion(attempt);
  return {
    attemptId: attempt.id,
    status: attempt.status,
    answered,
    maxQuestions: MAX_QUESTIONS,
    canFinishEarly: answered >= MIN_TO_FINISH,
    readyToFinish: !open && shouldStop(abilityHistory(attempt)),
    question: open ? publicQuestion(open, attempt.questions.indexOf(open)) : null,
  };
}

function resultView(attempt) {
  return {
    attemptId: attempt.id,
    status: attempt.status,
    level: attempt.resultLevel,
    ability: attempt.finalAbility,
    answered: attempt.questions.length,
    breakdown: attempt.breakdown,
    feedback: attempt.feedback ?? null,
    finishedAt: attempt.finishedAt,
    review: attempt.questions.map((q, index) => ({
      index,
      type: q.type,
      level: q.level,
      theme: q.theme,
      prompt: q.prompt,
      passage: q.passage ?? null,
      options: q.options.length ? [...q.options] : null,
      correctIndex: q.options.length ? q.answerIndex : null,
      explanation: q.explanation ?? null,
      yourChoice: q.answer?.choiceIndex ?? null,
      yourText: q.answer?.text ?? null,
      skipped: Boolean(q.answer?.skipped),
      score: q.score,
      grade: q.grade ?? null,
    })),
  };
}

const resultWord = (score) => (score >= 0.75 ? 'good' : score >= 0.4 ? 'partial' : 'missed');

// Generates the next question at the learner's current level and appends it.
async function addQuestion(attempt, req) {
  const index = attempt.questions.length;
  const type = TYPE_PLAN[index];
  const level = numToLevel(attempt.ability);
  const ctx = {
    type,
    level,
    askedThemes: attempt.questions.map((q) => q.theme).filter(Boolean),
    recent: answeredOf(attempt)
      .slice(-3)
      .map((q) => ({ type: q.type, level: q.level, result: resultWord(q.score) })),
  };
  const common = { apiKey: req.geminiKey, ...modelOpts(req.user, 'fast'), temperature: 1 };

  if (PRODUCTIVE.has(type)) {
    const { system, prompt } = productiveQuestion(ctx);
    const out = await generateJson({ ...common, system, prompt, schema: taskSchema });
    attempt.questions.push({ type, level, theme: out.theme, prompt: out.question });
    return;
  }

  const { system, prompt } = mcqQuestion(ctx);
  const out = await generateJson({ ...common, system, prompt, schema: mcqSchema(type === 'reading') });
  const shuffled = shuffleOptions(out.options, out.answerIndex);
  attempt.questions.push({
    type,
    level,
    theme: out.theme,
    prompt: out.question,
    passage: type === 'reading' ? out.passage : undefined,
    options: shuffled.options,
    answerIndex: shuffled.answerIndex,
    explanation: out.explanation,
  });
}

// Scores the open question and updates the ability estimate. Throws before changing
// anything if grading fails, so the learner can simply resubmit.
async function recordAnswer(attempt, answer, req) {
  const q = openQuestion(attempt);
  if (!q) throw new AppError(409, 'NO_OPEN_QUESTION', 'There is no question waiting for an answer.');
  const multipleChoice = !PRODUCTIVE.has(q.type);

  let score;
  let grade;
  let stored;
  if ('skip' in answer) {
    score = 0;
    stored = { skipped: true };
  } else if (multipleChoice) {
    if (!('choiceIndex' in answer)) throw new AppError(400, 'WRONG_ANSWER_TYPE', 'Choose one of the options.');
    score = answer.choiceIndex === q.answerIndex ? 1 : 0;
    stored = { choiceIndex: answer.choiceIndex };
  } else {
    if (!('text' in answer)) throw new AppError(400, 'WRONG_ANSWER_TYPE', 'This question needs a written or spoken answer.');
    const { system, prompt } = gradeProductive({ type: q.type, level: q.level, task: q.prompt, text: answer.text });
    grade = await generateJson({
      apiKey: req.geminiKey,
      ...modelOpts(req.user, 'strong'),
      system,
      prompt,
      schema: gradeSchema,
      temperature: 0.2,
    });
    score = productiveScore(grade.cefrLevel, q.level);
    stored = { text: answer.text };
  }

  q.answer = stored;
  q.score = score;
  if (grade) q.grade = grade;
  attempt.ability = updateAbility({
    ability: attempt.ability,
    level: levelToNum(q.level),
    score,
    answeredBefore: answeredOf(attempt).length - 1, // q itself is now counted
    chance: chanceFor(q.type),
  });
  q.abilityAfter = attempt.ability;
  q.answeredAt = new Date();
}

// ---- Handlers ----

// Starts a test, or resumes the one in progress.
export async function start(req, res) {
  const attempt =
    (await PlacementAttempt.findOne({ userId: req.user._id, status: 'in_progress' }).sort({ createdAt: -1 })) ??
    new PlacementAttempt({ userId: req.user._id });

  await locked(attempt.id, async () => {
    if (!openQuestion(attempt) && !shouldStop(abilityHistory(attempt))) {
      await addQuestion(attempt, req);
      await attempt.save(); // only now does a brand-new attempt reach the DB
    }
    res.json(stateView(attempt));
  });
}

// Records the answer to the open question (if given) and returns the next question.
// Without an answer it resumes: returns the open question, or generates the next one
// when an earlier call saved the answer but failed to generate (e.g. quota).
export async function next(req, res) {
  const { attemptId, answer } = nextBody.parse(req.body);

  await locked(attemptId, async () => {
    const attempt = await loadAttempt(req, attemptId);
    if (attempt.status === 'finished') throw new AppError(409, 'ALREADY_FINISHED', 'This test is already finished.');

    if (answer) {
      await recordAnswer(attempt, answer, req);
      await attempt.save(); // keep the answer even if generating the next question fails
    }
    if (!openQuestion(attempt) && !shouldStop(abilityHistory(attempt))) {
      await addQuestion(attempt, req);
      await attempt.save();
    }
    res.json(stateView(attempt));
  });
}

export async function finish(req, res) {
  const { attemptId } = finishBody.parse(req.body);

  await locked(attemptId, async () => {
    const attempt = await loadAttempt(req, attemptId);
    if (attempt.status === 'finished') return res.json(resultView(attempt));

    const answered = answeredOf(attempt);
    if (answered.length < MIN_TO_FINISH) {
      throw new AppError(409, 'TOO_EARLY', `Answer at least ${MIN_TO_FINISH} questions first.`);
    }

    const ability = finalAbility(attempt.ability, answered);
    const level = numToLevel(ability);
    const breakdown = skillBreakdown(answered);

    const missed = answered
      .filter((q) => q.score < 0.75)
      .map((q) => ({
        type: q.type,
        level: q.level,
        theme: q.theme,
        note: q.options.length
          ? q.answer?.skipped
            ? `skipped (correct: "${q.options[q.answerIndex]}")`
            : `chose "${q.options[q.answer.choiceIndex]}", correct: "${q.options[q.answerIndex]}"`
          : (q.grade?.feedback ?? 'skipped'),
      }));

    let feedback = null;
    try {
      const { system, prompt } = placementFeedback({ level, breakdown, missed, language: req.user.nativeLang });
      feedback = await generateJson({
        apiKey: req.geminiKey,
        ...modelOpts(req.user, 'strong'),
        system,
        prompt,
        schema: feedbackSchema,
        temperature: 0.6,
      });
    } catch (err) {
      // Quota/key problems: let the learner retry rather than finish without a report.
      // A model that keeps returning bad JSON should not block the result.
      if (!/^GEMINI_BAD_/.test(err.code)) throw err;
    }

    if (openQuestion(attempt)) attempt.questions.pop(); // an unanswered question is always the last one
    attempt.status = 'finished';
    attempt.finalAbility = ability;
    attempt.resultLevel = level;
    attempt.breakdown = breakdown;
    attempt.feedback = feedback;
    attempt.finishedAt = new Date();
    await attempt.save();

    req.user.level = level;
    await req.user.save();

    res.json(resultView(attempt));
  });
}

export async function status(req, res) {
  const [inProgress, last] = await Promise.all([
    PlacementAttempt.findOne({ userId: req.user._id, status: 'in_progress', 'questions.0': { $exists: true } }),
    PlacementAttempt.findOne({ userId: req.user._id, status: 'finished' }).sort({ finishedAt: -1 }),
  ]);
  res.json({
    inProgress: inProgress && { attemptId: inProgress.id, answered: answeredOf(inProgress).length },
    last: last && { attemptId: last.id, level: last.resultLevel, finishedAt: last.finishedAt },
  });
}

export async function result(req, res) {
  const id = objectId.safeParse(req.params.id);
  if (!id.success) throw new AppError(404, 'NOT_FOUND', 'Placement test not found');
  const attempt = await loadAttempt(req, id.data);
  if (attempt.status !== 'finished') throw new AppError(409, 'NOT_FINISHED', 'This test is not finished yet.');
  res.json(resultView(attempt));
}
