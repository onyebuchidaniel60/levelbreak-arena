/**
 * Same-origin API client.
 *
 * In production the frontend talks to its own origin and Vercel rewrites
 * /api/* and /health/* to the Render backend. Keeping VITE_API_BASE_URL empty
 * keeps the session cookie on levelbreak-arena.vercel.app and preserves
 * SameSite=Lax. Local development may set an absolute backend URL.
 */
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

export function resolveApiBaseUrl(
  value: string | undefined = configuredBaseUrl,
): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export function apiUrl(
  path: string,
  baseUrl: string = resolveApiBaseUrl(),
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function apiFetch(
  path: string,
  init: RequestInit = {},
  baseUrl: string = resolveApiBaseUrl(),
): Promise<Response> {
  return fetch(apiUrl(path, baseUrl), {
    ...init,
    credentials: init.credentials ?? "include",
  });
}
