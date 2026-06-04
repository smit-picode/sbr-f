const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://8h00whv4-4000.inc1.devtunnels.ms',
  appEnv: process.env.NEXT_PUBLIC_ENV ?? 'development',
  isDev: process.env.NEXT_PUBLIC_ENV !== 'production',
} as const;

export default env;
