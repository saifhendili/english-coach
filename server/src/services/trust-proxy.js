// How many reverse proxies stand between the internet and this server (TRUST_PROXY in the environment).
//
// On Render (and most hosts) every request arrives through the host's proxy, so the "client address" Express sees is the proxy's, the
// same for everybody, and the login rate limit would count all users as one person. Setting TRUST_PROXY=1 makes Express read the real
// address from the X-Forwarded-For header that the one proxy adds. Only a number of proxies is accepted: "true" would believe
// whatever header a client sends, which lets anyone dodge the limit by lying.
export function parseTrustProxy(value) {
  if (value === undefined || value === null || String(value).trim() === '') return false;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`TRUST_PROXY must be a number of proxies (0, or 1 on Render), got "${text}"`);
  }
  const hops = Number(text);
  return hops === 0 ? false : hops;
}
