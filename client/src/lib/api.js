import { useAuth } from '../store/auth';

export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Set by App so the API layer can redirect without importing the router.
export const hooks = { onKeyMissing: null };

function friendlyMessage(e, fallback) {
  if (e.code === 'VALIDATION' && Array.isArray(e.issues)) {
    return e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  }
  return e.message ?? fallback;
}

// One place that turns a response into data or an ApiError, for JSON calls and uploads alike.
async function request(path, init, token) {
  let res;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error ?? {};
    const err = new ApiError(res.status, e.code ?? 'UNKNOWN', friendlyMessage(e, res.statusText), e);
    if (res.status === 401 && token) useAuth.getState().logout();
    if (err.code === 'KEY_MISSING') hooks.onKeyMissing?.();
    throw err;
  }
  return data;
}

export function api(path, { method = 'GET', body } = {}) {
  const token = useAuth.getState().token;
  return request(
    path,
    {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    token,
  );
}

// Sends a file (a voice recording) as the raw request body.
export function apiUpload(path, blob) {
  const token = useAuth.getState().token;
  return request(
    path,
    {
      method: 'POST',
      headers: { 'content-type': blob.type || 'application/octet-stream', ...(token && { authorization: `Bearer ${token}` }) },
      body: blob,
    },
    token,
  );
}
