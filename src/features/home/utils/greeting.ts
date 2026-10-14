// The greeting's first name, read from the email (first.last@… → First).
export function firstNameOf(email: string | undefined, fallback: string): string {
  if (!email) return fallback;
  const local = email.split('@')[0] ?? '';
  const first = local.split(/[._-]/)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Whole days between a timestamp and now, never negative.
export function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  return Number.isNaN(ms) ? null : Math.max(0, Math.floor(ms / 86_400_000));
}
