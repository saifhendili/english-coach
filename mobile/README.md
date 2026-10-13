# English Coach for iPhone

The React Native (Expo) app for the English Coach server in `../server`. It is a full client, not a wrapper around the
web page: sign in, level test, interests, topics, streamed chat with corrections and "sound more natural" upgrades,
tap-a-word dictionary, read-aloud, voice input, power phrases with practice, a Grammar section (the twelve verb tenses as lessons with timelines, drills, irregular verbs), spaced-repetition review and progress charts.
It talks to the same API as the web app, so an account works in both. The learner's own Gemini key is stored encrypted on
the server (Settings), exactly as on the web.

Expo SDK 57 · React Native 0.86 · expo-router · TypeScript · TanStack Query · zustand.

## Try it on your iPhone (free, no Apple account)

1. Start the server and MongoDB (see the root README): `docker compose up -d` and `cd server && npm run dev`.
2. Install **Expo Go** from the App Store on the iPhone. Put the iPhone on the same Wi-Fi as the computer.
3. On the computer:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

4. Scan the QR code with the iPhone's Camera app and open it in Expo Go.

The app works out the server's address from the Expo address (same computer, port 4000), so nothing needs typing. If it
cannot (for example you started Expo with `--tunnel`), the sign-in screen shows a **Server** box: type the computer's
address, e.g. `192.168.1.9`. The address is kept on the phone. If the phone cannot connect, the computer's firewall may be
blocking port 4000 (API) or 8081 (Expo).

First run: create an account, then **Settings → Gemini API key** (a free key from Google AI Studio).

## Put it on the App Store / TestFlight

Linux has no Xcode, so builds run in Expo's cloud (EAS). You need an
[Apple Developer Program](https://developer.apple.com/programs/) membership (paid, yearly) for TestFlight and the App Store.

1. Change `ios.bundleIdentifier` in `app.json` (it is the placeholder `com.englishcoach.app`) to one you own, and the
   `name`/`slug` if you like. Replace `assets/images/icon.png` (1024 px, no transparency) if you want a different icon.
2. **Host the API over HTTPS** (a domain with a certificate). iOS only allows plain `http` to the local network, which is
   what Expo Go development uses (`NSAllowsLocalNetworking` in `app.json`); a store build cannot call `http://192.168…`.
   In the installed app, type the HTTPS address in the sign-in screen's **Server** box.
3. Then:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init                      # links the project to your Expo account
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest submit --platform ios     # uploads to App Store Connect / TestFlight
   ```

   `eas.json` has two profiles: `preview` (internal distribution, needs your device registered) and `production`
   (the store build; the build number goes up by itself). EAS asks for your Apple login and creates the certificates.
4. App Store review wants a privacy policy URL and the usual listing text. The app sends the learner's messages and voice
   recordings to your server, which sends them to Google Gemini with the learner's own key: say so in the privacy text.

`ITSAppUsesNonExemptEncryption` is set to `false` (the app only uses the standard HTTPS stack), so there is no export-compliance prompt.

## Develop

```bash
npm test             # Jest: 128 tests (API/stream parsing, voice recording, review logic, chat turns, placement flow, tense answer checking and practice sessions, charts...)
npm run typecheck    # tsc --noEmit, strict
npx eslint src       # includes the React Compiler rules
npx expo-doctor      # dependency and config check
npx expo export --platform ios --output-dir /tmp/ios   # a production bundle, the same step an EAS build runs
```

`npx expo start --web` serves the same app in a browser on :8081. It is only a test harness (no iOS here), and the
server's `CLIENT_ORIGIN` already lists it. Screens are checked with Playwright against the real API that way.

Where things are:

- `src/app/` routes (expo-router): `(tabs)` Home, Topics, Chat, Grammar, Phrases, Review; stack screens `chat/[id]`, `phrases/[category]`,
  `grammar/[tense]` (a lesson), `grammar/practice`, `grammar/irregular`, `interests`, `placement`, `progress`, `settings`; `login`. The auth gate is `Stack.Protected` in `_layout.tsx`.
- `src/hooks/` data and state machines (`useChatTurn`, `useReviewSession`, `usePlacementFlow`, `usePracticeSession`, `useVoiceInput`...).
  Logic lives here and in `src/lib/` so it is unit-tested; screens stay thin.
- `src/components/ui/` the small design kit (brand gradient, cards, buttons, sheet, skeleton); `charts/` hand-drawn
  `react-native-svg` charts with the validated palette, a table view for each, and VoiceOver-adjustable value reading.
- `src/lib/stream.ts` streams the chat reply with `expo/fetch` (`response.body.getReader()`) and parses Server-Sent Events.
- `src/lib/transcribe.ts` + `hooks/useVoiceInput.ts`: record with `expo-audio` (AAC `.m4a`), upload to `/stt/transcribe`, put the
  transcript in the box. The server accepts `audio/mp4` and Gemini transcribes it (checked with real m4a/wav/aac clips).
- Everything uses Expo Go's bundled native modules, so no custom dev build is needed to try it.

One navigation rule: a stack screen that returns to a tab (results pages, "Save & see topics"...) uses `router.dismissTo('/tab')`, not
`router.navigate`, which would stack a second copy of the tabs on top of the screen it was meant to leave.

## What is and is not verified

Checked here: type checking, ESLint, 128 unit tests, `expo-doctor` (21/21), a production iOS bundle export, and every screen
in the web build against the real server and real Gemini (chat with streaming and corrections, topics, phrases, review,
progress, placement, grammar, settings).

**Not checked, because this machine has no iPhone, simulator or Xcode:** behaviour on a real device. In particular
microphone recording and upload on iOS, text-to-speech audio (it is silent when the ringer switch is off; the highlighted
word while it reads depends on the voice reporting word boundaries), haptics, the keyboard pushing the chat box up,
notch and home-indicator spacing, VoiceOver, and the build/submit steps above. Expect to fix small things on first run.

## Leftovers you can delete

`assets/images/` still holds the Expo starter's unused pictures (`android-icon-*.png`, `expo-badge*.png`, `expo-logo.png`,
`logo-glow.png`, `react-logo*.png`, `tabIcons/`, `tutorial-web.png`). Only `icon.png`, `splash-icon.png` and `favicon.png` are used.
