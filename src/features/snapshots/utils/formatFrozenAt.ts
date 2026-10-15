// "05 Oct 2026, 8:30:00 AM" — the frozen-on stamp with its 12-hour period, as the design shows it.
export function formatFrozenAt(value: string | null | undefined, locale = 'en-GB'): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' });
  const time = d
    .toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
  return `${date}, ${time}`;
}
