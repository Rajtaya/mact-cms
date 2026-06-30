import axios, { AxiosError } from 'axios';

/**
 * API client. Talks to the NestJS backend via the Next.js /api proxy.
 *
 * Security model: the access token lives only in memory (never persisted).
 * The refresh token is an httpOnly, Secure cookie set by the server — it is
 * never readable by JavaScript, so XSS cannot exfiltrate it. On a 401 we call
 * /auth/refresh (the browser sends the cookie automatically) and retry once.
 */
export const api = axios.create({ baseURL: '/api', withCredentials: true });

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  try {
    // Refresh token travels in the httpOnly cookie; no body needed.
    const { data } = await axios.post(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    );
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccess();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
