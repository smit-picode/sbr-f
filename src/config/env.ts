// An explicit URL wins; otherwise local dev reaches the backend directly and any other host calls its own /api (reverse proxy).
function resolveApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (configured) return configured;
  const local = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return local ? 'http://localhost:4000' : '';
}

const env = {
  apiUrl: resolveApiUrl(),
  appEnv: process.env.NEXT_PUBLIC_ENV ?? 'development',
  isDev: process.env.NEXT_PUBLIC_ENV !== 'production',
  // Show the inline "Actions" (edit) column in list tables. Editing is done from the
  // detail page, so this is off. Flip to `true` to bring the column back everywhere.
  showActionsColumn: false,
} as const;

export default env;
