const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  appEnv: process.env.NEXT_PUBLIC_ENV ?? 'development',
  isDev: process.env.NEXT_PUBLIC_ENV !== 'production',
  // Show the inline "Actions" (edit) column in list tables. Editing is done from the
  // detail page, so this is off. Flip to `true` to bring the column back everywhere.
  showActionsColumn: false,
} as const;

export default env;
