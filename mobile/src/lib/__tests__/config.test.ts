import { normalizeServer } from '../config';

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
