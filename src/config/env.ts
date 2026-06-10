const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  appEnv: process.env.NEXT_PUBLIC_ENV ?? 'development',
  isDev: process.env.NEXT_PUBLIC_ENV !== 'production',
} as const;

export default env;
 