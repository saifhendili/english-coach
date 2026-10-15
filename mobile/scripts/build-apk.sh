#!/usr/bin/env bash
# Builds an installable Android APK of English Coach on this computer (no Expo account needed).
#
#   EXPO_PUBLIC_API_URL=http://192.168.1.9:4000 npm run apk
#
# EXPO_PUBLIC_API_URL is only the address the app starts with; it can be changed on the sign-in screen. Leave it out and the
# app asks for the address on first start.
# Needs JDK 17 or newer and the Android SDK (platform 36, build-tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1: Gradle fetches
# any that are missing when the SDK licences are accepted). ANDROID_HOME defaults to ~/Android/Sdk.
#   CLEAN=1   regenerate the native android/ folder first (after changing app.json or a plugin)
#   ABIS=...  CPU types to include (default arm64-v8a,armeabi-v7a,x86_64; "arm64-v8a" alone gives a much smaller APK)
set -euo pipefail
cd "$(dirname "$0")/.."

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
[ -d "$ANDROID_HOME" ] || { echo "Android SDK not found at $ANDROID_HOME. Set ANDROID_HOME." >&2; exit 1; }
command -v java >/dev/null || { echo "Java (JDK 17 or newer) is not installed." >&2; exit 1; }

if [ ! -d android ] || [ "${CLEAN:-}" = "1" ]; then
  # android/ is generated from app.json (never edit it by hand). Prebuild also rewrites the "ios" script, which cannot run on
  # Linux, so that line is put back.
  npx expo prebuild --platform android --no-install --clean
  sed -i 's#"ios": "expo run:ios"#"ios": "expo start --ios"#' package.json
fi

# EXPO_PUBLIC_API_URL is written into the JavaScript bundle, but neither Gradle nor Metro treat the variable as an input, so both
# would reuse an old bundle (and so the old address). Deleting the bundle makes Gradle build it again, and a private temporary
# folder gives Metro an empty cache (it keeps its cache in the temp folder; the cache of a running `expo start` is left alone).
rm -rf android/app/build/generated/assets/react
export TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

(cd android && CI=1 ./gradlew assembleRelease \
  -PreactNativeArchitectures="${ABIS:-arm64-v8a,armeabi-v7a,x86_64}" \
  -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=768m" --console=plain)

mkdir -p builds
out="builds/english-coach-$(node -p "require('./app.json').expo.version").apk"
cp android/app/build/outputs/apk/release/app-release.apk "$out"
echo
echo "APK ready: $out ($(du -h "$out" | cut -f1))"
