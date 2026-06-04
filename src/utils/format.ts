export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return value;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}

export function nullableText(value: string | null | undefined): string {
  return value?.trim() || '—';
}

export function truncate(value: string, maxLength = 40): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}
