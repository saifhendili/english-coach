# AI English Coach

Plan: [claude.md](claude.md). Status: foundation, adaptive placement test, interests and topics, chat and power phrases, voice input, review (spaced repetition), progress, verb-tense grammar practice (phone app) and an iPhone app (`mobile/`) are done.

## Run

```bash
docker compose up -d                 # MongoDB on 127.0.0.1:27019
cd server && npm install && npm run dev   # API on :4000 (needs server/.env, see .env.example)
cd client && npm install && npm run dev   # app on http://localhost:5180 (the computer)
cd client && npm run dev:phone            # app on https://<this computer's address>:5181 (a phone, see below)
cd server && npm test                     # unit tests (also: cd client && npm test)
GEMINI_KEY=AIza... npm run check-models   # (in server/) re-verify the free-model list
```

`server/.env`: set `JWT_SECRET` and `ENCRYPTION_KEY` (`openssl rand -hex 32`).
Changing `ENCRYPTION_KEY` makes every stored Gemini key unreadable; users would have to re-enter it.

Sign up in the app, then paste your Gemini key in Settings. It is stored encrypted per account.

## iPhone app

`mobile/` is a React Native (Expo) client for the same API with every feature of the web app. Try it free on an iPhone with
Expo Go (`cd mobile && npm install && npx expo start`, scan the QR code), or build it for TestFlight/the App Store with EAS.
An Android APK is built the same way (`cd mobile && npm run apk`). The app has a built-in guide for beginners in English, French and Arabic. Steps, what is verified and what is not: [mobile/README.md](mobile/README.md). To use it away from home, [deploy the API on Render](#deploy-the-api-on-render).

## Layout

- `server/src/{routes,controllers,services,models,middleware}`
- `client/src/{pages,components,hooks,store,lib}`
- `mobile/src/{app,components,hooks,store,lib}`: the iPhone app
- `services/prompts.js`: every prompt sent to Gemini
- `services/gemini.js`: per-request client, 25s timeout, retry/backoff on 429, `generateJson` (the zod schema is sent to Gemini and used to validate the reply)
- `services/placement.js`: pure adaptive logic (ability estimate, next level, stopping rule), unit-tested
- `middleware/auth.js`: `requireAuth`, and `requireGeminiKey`, which answers 412 `KEY_MISSING` (the client then redirects to Settings)

## Placement test

Up to 15 questions in a fixed skill mix (grammar, vocabulary, reading, writing, speaking); Gemini writes each one on demand.
The ability estimate starts at B1 and moves like an Elo rating after every answer; the next question is generated at the nearest level.
It stops at 15 questions, or from 10 once the last 5 estimates are stable. The learner may finish early after 6.
Correct answers never leave the server until the review screen. Writing and speaking are graded by Gemini as the CEFR level they show.

## Grammar: verb tenses

The **Grammar** tab (phone app) teaches the twelve English tenses and drills them. Everything below except "New with AI" is
hand-written and costs no Gemini quota.

- **Lessons** (`server/src/data/tenses.js`): for each tense what it is for, how it is formed (affirmative, negative, question,
  each with an example), when to use it, the words that give it away, three typical mistakes with the reason, the tense it is most
  often confused with, and a small timeline picture (PAST, NOW, FUTURE).
- **Practice** (`data/tense-exercises.js`, 144 exercises, 12 per tense): fill the blank, choose the right words, find and fix the
  mistake, and "which tense is this sentence?". Answers are checked on the phone, so feedback is instant, and typed answers
  accept contractions (`doesn't` for `does not`, `she's gone` for `she has gone`). Each answer comes with a one-line reason.
  A question answered wrong comes back once at the end of the session ("second try", not counted twice).
- **What comes next** (`services/tenses.js`): questions missed last time first, then ones never seen, then the ones answered
  right longest ago. "Mixed practice" draws from every tense and favours the weaker ones. The hub recommends the weakest tense
  once it has 5 answers under 80 %, otherwise the next lesson at the learner's level.
- **Irregular verbs** (`data/irregular-verbs.js`, 90 verbs): a searchable list and a drill where you type the past simple and the
  past participle (both forms of `get`, `learn`, `dream`... are accepted).
- **New with AI**: Gemini writes 6 fresh exercises about the learner's interests and level (`POST /tenses/generate`). The
  server throws away any that would mislead (not exactly one blank, fewer than three wrong options, a "fix" that changes
  nothing, repeats of the bank), and they are labelled "AI-written". Only this costs free quota.
- **Progress** per tense (answers and accuracy) and per exercise is kept in `TenseStat` / `TenseItemStat`. A tense mistake the
  coach corrects in a chat now has a "Practise the tenses" link, and the hub counts them.

API (all need a login): `GET /tenses` (lessons, stats, recommendation, irregular verbs), `GET /tenses/practice?tense=<id|mixed|irregular>&count=10`,
`POST /tenses/practice` (record `{ results: [{ id, tense, correct }] }`), `POST /tenses/generate` (needs the Gemini key).
Not done yet: the web client has no Grammar page, and practice does not count towards the day streak.

## Free models only

The app only uses Gemini models that have a free tier: see `server/src/services/models.js`
(the list, why each model is in or out, and the defaults). Settings only offers those models and the API
rejects any other (paid, retired or `-latest` alias). Google retires models quietly, so run
`npm run check-models` now and then. Free usage requires the key's Google project to have no billing enabled.

Free quota is counted per model and is small (measured: `gemini-3.8-flash` allows only 20 requests a day; Google
does not publish the others). So the fast and strong jobs use different models by default, and if a model is
out of quota, rate limited or retired, `generateJson` falls back to the next free model (`fallbackChain`).
Settings explains a daily limit instead of retrying it.

## Interests and topics

- **Interests page** asks two things: what to improve (speaking/oral, pronunciation, grammar, vocabulary, listening, reading, writing;
  the weakest placement skills are pre-selected) and what the learner likes talking about (seed groups, "More fields" asks Gemini
  for more, "Add my own" accepts anything). Saved in one `Interest` document per user.
- **Topics** are generated in batches of 6 by the fast model. The server, not Gemini, picks each topic's field and angle
  (debate, storytelling, role-play, opinion, problem-solving), so batches are varied; the last 80 titles are sent to avoid repeats and
  any repeat is dropped again in code. "Surprise me" blends two interests per topic. Each topic has 3 openers, 8 key words
  (with a translation in the learner's language), a role-play scenario and tips for the chosen focus areas.
- The Topics feed shows the latest stored topics and generates more when scrolled (only after the learner has scrolled once,
  so a tall screen cannot spend free quota on its own). Favourites are stored per user.
- Gemini gotcha: a `minItems`/`maxItems` on the `topics` array makes the API answer 400 `INVALID_ARGUMENT` when the items
  contain exact-length arrays, so that count is enforced in code (see `controllers/topics.js`).

## Chat

- **Start** from a topic card (Talk, or "Play this scene" for the role-play), from the Chat page (free chat), or from the "Try next"
  suggestion in a session report. A talk session opens with the topic's first starter (no Gemini call); a role-play opens in character.
- **Each turn** is one streamed call (`POST /chat/turn`, Server-Sent Events). The JSON puts `reply` first, so the reply appears
  while the corrections are still being written (`services/stream.js` reads the half-finished JSON). Then it carries `correction`
  (each mistake with a type and a short explanation in the learner's language), `phrases` ("sound more natural" upgrades) and
  `newWords`. Nothing is saved unless the whole turn succeeds, a closed tab stops the Gemini call, and the learner's text is put
  back in the box if a request fails. The fast model answers (about 0.7s to the first text); the 2.5 models run with thinking off,
  which they accept and the newer ones reject (see `jsonConfig` in `services/gemini.js`).
- **Long chats** keep the last 24 messages and fold older ones into a running summary.
- Every correction is also stored as a `Mistake` (ready for spaced-repetition review). Settings can show corrections after
  every message or only in the report at the end.
- **Report** (`POST /sessions/:id/end`, strong model): score, what went well, top mistakes, words and phrases worth keeping, next topic.
- Tap any word for a definition (dictionaryapi.dev through our server, cached; it hangs on some words, so there is a 6s cap and an
  "Explain in context" button that asks Gemini for the meaning and a translation). The speaker reads a message aloud with the
  word highlighted, "slow" slows it down, and "hide text" turns a chat into listening practice. The mic types for you.

## Power phrases

`/phrases`: 101 hand-written phrases in 11 situations (starting an answer, sounding sure or not, opinions, agreeing politely,
connecting ideas, explaining, storytelling, polite requests, clarifying, wrapping up, natural word pairs) in
`server/src/data/phrasebank.js`. Each can be saved, listened to, and practised: a short situation, your answer, and the coach
checks whether you used the phrase and used it naturally. "More like these" asks Gemini for extra ones at your level.
The coach's "sound more natural" suggestions in a chat use the same Save button. Saved words and phrases (with a translation
when known) live under Phrases > Saved and already carry the fields the review phase will need.

## Using it on a phone

Run `npm run dev:phone` in `client/` (it can run next to `npm run dev`), then open `https://<this computer's address>:5181`
(Vite prints it as "Network:") on the same Wi-Fi, accept the one-time certificate warning, and allow the microphone.
It must be https: a phone only gives the microphone to a "secure context", and plain `http://192.168.x.x` is not one
(on the computer, `http://localhost` is, which is why the normal `npm run dev` needs no certificate).
If the phone cannot reach it, the computer's firewall may be blocking port 5181.

## Voice input

The mic button types what you say into the box (chat, phrase practice, the placement speaking question). `hooks/useVoiceInput.js`
picks the way by what the browser can do:

- **Speech recognition** (Chrome, Edge, Android): free, the words appear live. One sentence per tap on purpose: continuous mode
  makes Android Chrome repeat text, and `lib/voice.js` (`joinResults`) also collapses results that repeat the sentence so far.
- **Record and transcribe** (Firefox, iPhone, or when the browser's recogniser is blocked or has no network): the app records,
  converts to 16 kHz WAV in the browser (Gemini documents WAV, not Chrome's WebM), and `POST /stt/transcribe` asks Gemini
  for a verbatim transcript, keeping the learner's mistakes so the coach can correct them. A minute at most.

## Review

Saved words and phrases and every mistake the coach corrected are cards, scheduled with FSRS (`services/srs.js`, ts-fsrs, learning
steps off so new cards go straight to day-scale gaps). Ten new cards a day, taken alternately from mistakes and saved items, so
a long saved list cannot hold back the corrections. Cards are shown as a cloze (the example with the phrase blanked out), the
learner's own sentence with the mistake marked (type the fix), or plain recall. A card answered Again comes back once at the end
of the same session (practice only, it is not scheduled twice). Each answer is logged in `ReviewLog`.

## Progress

`GET /progress` feeds hand-drawn SVG charts (`components/charts/`, built to the data-viz skill's mark specs, colours validated in
light and dark): day streak, 30-day activity (stacked), conversation scores, mistakes by type, and skills from the latest level
test. Every chart has hover, keyboard (arrow keys) and a table view.

## Deploy the API on Render

`render.yaml` describes the API as a Render web service (free plan, Frankfurt). Render has no MongoDB, so the database is a free
MongoDB Atlas cluster. Do these once; nothing here goes in a file, so the public repo stays clean.

1. **Database.** On [MongoDB Atlas](https://www.mongodb.com/atlas) create a free **M0** cluster. Under *Database Access* add a user with a
   password (use letters and digits only, or percent-encode symbols). Under *Network Access* allow `0.0.0.0/0` (Render's free
   plan has no fixed address). Under *Connect → Drivers* copy the connection string and **put a database name** after the host:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/english-coach?retryWrites=true&w=majority`.
2. **Key.** Run `openssl rand -hex 32` and keep the result. It encrypts every stored Gemini key, so never lose it and never change it
   later (changing it makes the saved Gemini keys unreadable and everyone has to enter theirs again).
3. **Code on GitHub.** Render builds from the repo, so the changes have to be committed and pushed first (`git push`). Do not commit
   `server/.env` (it is git-ignored).
4. **Render.** *New → Blueprint*, pick the repo, and when it asks for the two secrets paste `MONGODB_URI` (step 1) and
   `ENCRYPTION_KEY` (step 2). `JWT_SECRET` is generated by Render and `TRUST_PROXY=1` is already set in the file.
5. **Check it.** When the deploy is live (a few minutes), open `https://<your-service>.onrender.com/api/health`: it must answer
   `{"ok":true}`. Then prove the database works (a wrong password must answer 401 with JSON, not 500):

   ```bash
   curl -s -X POST https://<your-service>.onrender.com/api/auth/login \
     -H 'content-type: application/json' -d '{"email":"nobody@example.com","password":"wrong-password"}'
   ```

   If the service does not start, its logs say why: a `Could not connect to MongoDB` line means step 1 (the password, the database
   name or Network Access), and a `ENCRYPTION_KEY` message means step 2 (it must be exactly 64 hex characters).
6. **Use it from the phone.** Rebuild the Android app with the address baked in:
   `cd mobile && EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com npm run apk`. For the iPhone with Expo Go, type the same
   address in the sign-in screen's **Server** box (or start Expo with `EXPO_PUBLIC_API_URL=… npx expo start`).

The free plan **goes to sleep after 15 minutes without a request**, and the first request afterwards takes about a minute. The app
notices a slow server and shows "The server is waking up" instead of looking frozen. For a test that is fine; to keep it awake you can
ping `/api/health` every 10 minutes with a free monitor such as UptimeRobot, or pay for the Starter plan.

The web client is not part of this blueprint. If you host it separately (for example on Vercel), set `CLIENT_ORIGIN` on the API to its
address, and make it call the API address; the phone app does not need `CLIENT_ORIGIN`.

## Tests

`cd server && npm test` (pure logic, scheduling, the tense content and exercise picking, parsers), `cd client && npm test` (voice, WAV, review, chart helpers) and `cd mobile && npm test` (the same kinds of logic for the phone app, plus its hooks).
