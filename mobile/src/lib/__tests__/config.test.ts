import { defaultServer, normalizeServer } from '../config';

let mockHostUri: string | undefined;
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return { hostUri: mockHostUri }; } } }));

describe('normalizeServer', () => {
  it('adds http and the API port to a bare address', () => {
    expect(normalizeServer('192.168.1.9')).toBe('http://192.168.1.9:4000');
    expect(normalizeServer('  my-mac.local  ')).toBe('http://my-mac.local:4000');
  });

  it('keeps a port that was typed, and drops a trailing /api or slash', () => {
    expect(normalizeServer('192.168.1.9:4010')).toBe('http://192.168.1.9:4010');
    expect(normalizeServer('http://192.168.1.9:4000/api')).toBe('http://192.168.1.9:4000');
    expect(normalizeServer('http://192.168.1.9:4000/')).toBe('http://192.168.1.9:4000');
  });

  it('leaves https sites on their own port (443)', () => {
    expect(normalizeServer('https://coach.example.com/')).toBe('https://coach.example.com');
    expect(normalizeServer('https://coach.example.com:8443')).toBe('https://coach.example.com:8443');
  });

  it('rejects things that cannot be an address', () => {
    expect(normalizeServer('')).toBeNull();
    expect(normalizeServer('   ')).toBeNull();
    expect(normalizeServer('http://')).toBeNull();
    expect(normalizeServer('not a host')).toBeNull();
  });
});

describe('defaultServer', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    mockHostUri = undefined;
    if (original === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('takes the computer’s address from the Expo address, with the API port', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    mockHostUri = '192.168.1.9:8081';
    expect(defaultServer()).toBe('http://192.168.1.9:4000');
  });

  it('cannot tell through an Expo tunnel, or with no Expo address (a standalone build)', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    mockHostUri = 'abc-123.exp.direct:80';
    expect(defaultServer()).toBe('');
    mockHostUri = undefined;
    expect(defaultServer()).toBe('');
  });

  it('prefers an address baked into the build, and tidies it', () => {
    mockHostUri = '192.168.1.9:8081';
    process.env.EXPO_PUBLIC_API_URL = '10.0.0.5';
    expect(defaultServer()).toBe('http://10.0.0.5:4000');
    process.env.EXPO_PUBLIC_API_URL = 'https://coach.example.com/api';
    expect(defaultServer()).toBe('https://coach.example.com');
  });

  it('ignores a baked-in value that is not an address', () => {
    mockHostUri = '192.168.1.9:8081';
    process.env.EXPO_PUBLIC_API_URL = '   ';
    expect(defaultServer()).toBe('http://192.168.1.9:4000');
  });
});
