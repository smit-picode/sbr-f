import { nullableText } from '@/utils/format';
import type { SourceColumnKind } from '@/types';

const DATE_ONLY: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' };
const TIME_PART: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };

// Source dates are stored as wall-clock values, so they are shown in UTC to match what is stored.
const formatStoredDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString('en-GB', DATE_ONLY);
  const hasTime = d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0;
  return hasTime ? `${date}, ${d.toLocaleTimeString('en-GB', TIME_PART)}` : date;
};

export const formatSourceValue = (value: string | number | null | undefined, kind: SourceColumnKind): string => {
  if (value === null || value === undefined || value === '') return nullableText(null);
  if (kind === 'date') return formatStoredDate(String(value));
  return String(value);
};
