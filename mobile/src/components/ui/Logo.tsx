import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// The speech-bubble mark, same as the app icon.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="English Coach">
      <Defs>
        <LinearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6366f1" />
          <Stop offset="0.52" stopColor="#8b5cf6" />
          <Stop offset="1" stopColor="#d946ef" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="16" fill="url(#logo-g)" />
      <Path d="M14 20a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H31l-9 8v-8a8 8 0 0 1-8-8z" fill="#fff" />
      <Circle cx="24" cy="26.5" r="3" fill="#7c3aed" />
      <Circle cx="32" cy="26.5" r="3" fill="#7c3aed" />
      <Circle cx="40" cy="26.5" r="3" fill="#7c3aed" />
    </Svg>
  );
}
