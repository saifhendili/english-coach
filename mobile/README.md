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
2. **Host the API over HTTPS** (a domain with a certificate; the repository's `render.yaml` and the root README's *Deploy the API on Render* section do this). iOS only allows plain `http` to the local network, which is
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
npm test             # Jest: 163 tests (API/stream parsing, voice recording, review logic, chat turns, placement flow, tense answer checking and practice sessions, charts...)
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

## The in-app guide (every level, three languages)

The app itself is in English, so a beginner could not even read the first screen. The **Guide** explains every step in simple
English, French and Arabic (Arabic reads right to left). It opens from:

- the sign-in screen ("How does it work?", works before you have an account),
- a card on Home for new learners (title in all three languages; "Not now" hides it for good),
- Settings → Guide, and a **?** button in the header of Topics, Chat, Grammar, Phrases and Review, which opens the guide at that
  part,
- the level test screen ("How the test works").

It has 16 sections: what the app is, the 3 set-up steps, **how to get the free Gemini key step by step** (with a button to Google
AI Studio), the level test and what A1 to C2 mean, interests, chat (what the corrections and the "Sound more natural" cards
are), voice, grammar, phrases, review (the four buttons), topics, progress, settings, **a daily plan for each of the six levels**
(pick A1 to C2: what to do in 10 to 30 minutes, and a goal), a glossary of the app's buttons translated, and a help section
(cannot connect, key, daily limit, microphone, no sound, forgot password).

- The guide opens in the language the learner last chose, else the phone's language, else the coach's language. A card offers one
  tap to make the coach explain mistakes in that language (it is French by default on the server).
- The text is data in `src/guide/content.ts`. `src/guide/__tests__` checks that every text exists in all three languages, that the
  Arabic is Arabic script, and that **every quoted button or screen name in the guide really exists in the app**, so the guide cannot
  quietly go out of date when a label changes.
- The French and Arabic were written by the assistant that built the app. Have a native speaker read them once.

## Android APK

The same app builds for Android. An installable APK is made on this computer, without an Expo account:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://192.168.1.9:4000 npm run apk     # use your computer's address
```

It writes `builds/english-coach-1.0.0.apk` (about 80 MB; add `ABIS=arm64-v8a` for a ~45 MB one that fits modern phones only). The
first build downloads Gradle and compiles the native code (10 to 15 minutes); later ones take about a minute.
It needs JDK 17+ and the Android SDK (`ANDROID_HOME`, default `~/Android/Sdk`; platform 36, build-tools 36.0.0,
NDK 27.1.12297006, CMake 3.22.1). `CLEAN=1 npm run apk` regenerates the native `android/` folder after a change to `app.json`
or a plugin. `android/` and `builds/` are generated and not committed; never edit `android/` by hand.

To install: copy the `.apk` to the phone (USB, a cloud drive, or `adb install builds/english-coach-1.0.0.apk`), open it, and
allow "install unknown apps" for the app you opened it from. Play Protect may warn about an app that is not from the Play Store:
choose "Install anyway".

- **The server address.** The build starts with the `EXPO_PUBLIC_API_URL` you gave it. Without one it asks on first start.
  Either way it can be changed on the sign-in screen (Server). The phone must reach the computer (same Wi-Fi, and the computer's
  firewall must allow port 4000).
- **Plain http is allowed** (`usesCleartextTraffic` in `app.json`) because the server on your own network has no certificate.
  For a build that talks only to an https server, set it to `false`.
- **Signed with the debug key**, which is fine for your own phone but not accepted by the Play Store. For the Play Store run
  `npx eas-cli@latest build --platform android --profile production` (an `.aab`, signed by EAS), after an `https` server exists.
  `--profile preview` makes an APK in Expo's cloud instead.
- **Permissions:** internet, microphone (voice input), and the audio-playback and vibration ones Expo's audio and haptics need.
  Storage and "draw over other apps" are blocked.
- Android specifics already handled: the app draws behind the status and navigation bars (padding for both), the keyboard no
  longer covers the field being typed in (`KeyboardAvoidingView` with `padding` everywhere), and the chat follows the newest
  text. Adaptive and themed icons are in `assets/images/android-icon-*.png` (made from the app's chat-bubble logo).

Tested on an Android 17 emulator (x86_64, 16 KB memory pages) against the real server: sign-in over http, Home, the Grammar
lessons and practice with the keyboard open, a streamed chat with corrections, and the word sheet. **Not tested on a physical
phone**: the arm64 and 32-bit libraries are built and 16 KB-aligned but have not run, and neither has real microphone recording,
read-aloud sound, or vibration (the emulator had no audio).

## What is and is not verified

Checked here: type checking, ESLint, 163 unit tests, `expo-doctor` (21/21), a production iOS bundle export, and every screen
in the web build against the real server and real Gemini (chat with streaming and corrections, topics, phrases, review,
progress, placement, grammar, settings).

**Not checked, because this machine has no iPhone, simulator or Xcode:** behaviour on a real device. In particular
microphone recording and upload on iOS, text-to-speech audio (it is silent when the ringer switch is off; the highlighted
word while it reads depends on the voice reporting word boundaries), haptics, the keyboard pushing the chat box up,
notch and home-indicator spacing, VoiceOver, and the build/submit steps above. Expect to fix small things on first run.

## Leftovers you can delete

`assets/images/` still holds the Expo starter's unused pictures (`android-icon-*.png`, `expo-badge*.png`, `expo-logo.png`,
`logo-glow.png`, `react-logo*.png`, `tabIcons/`, `tutorial-web.png`). Only `icon.png`, `splash-icon.png` and `favicon.png` are used.
