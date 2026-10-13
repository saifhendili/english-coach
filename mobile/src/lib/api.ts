import { getServer, useAuth } from '@/store/auth';

export class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Set by the app so the API layer can react without importing the router.
export const hooks: { onKeyMissing: (() => void) | null } = { onKeyMissing: null };

type ErrorBody = { code?: string; message?: string; issues?: { path: (string | number)[]; message: string }[] } & Record<string, unknown>;

function friendlyMessage(e: ErrorBody, fallback: string): string {
  if (e.code === 'VALIDATION' && Array.isArray(e.issues)) {
    return e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  }
  return e.message ?? fallback;
}

export const apiUrl = (path: string) => `${getServer()}/api${path}`;

export function networkError(): ApiError {
  const server = getServer();
  return new ApiError(
    0,
    'NETWORK',
    server
      ? `Cannot reach the server at ${server}. Is it running, and is your phone on the same Wi-Fi?`
      : 'No server address is set. Open Server settings on the sign-in screen and enter your computer’s address.',
  );
}

// Turns an error response into an ApiError, and reacts to the two answers every screen cares about.
export function errorFrom(status: number, statusText: string, data: { error?: ErrorBody } | null, hadToken: boolean): ApiError {
  const e = data?.error ?? {};
  const err = new ApiError(status, e.code ?? 'UNKNOWN', friendlyMessage(e, statusText), e);
  if (status === 401 && hadToken) void useAuth.getState().logout();
  if (err.code === 'KEY_MISSING') hooks.onKeyMissing?.();
  return err;
}

async function request<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), init);
  } catch {
    throw networkError();
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw errorFrom(res.status, res.statusText, data, Boolean(token));
  return data as T;
}

export function api<T = unknown>(path: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = useAuth.getState().token;
  return request<T>(
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
export function apiUpload<T = unknown>(path: string, file: Blob, contentType: string): Promise<T> {
  const token = useAuth.getState().token;
  return request<T>(
    path,
    { method: 'POST', headers: { 'content-type': contentType, ...(token && { authorization: `Bearer ${token}` }) }, body: file },
    token,
  );
}
