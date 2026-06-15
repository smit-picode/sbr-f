export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
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
  return value.toLocaleString('en-GB');
}

export function nullableText(value: string | null | undefined): string {
  return value?.trim() || '—';
}

export function truncate(value: string, maxLength = 40): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

export function formatRole(role: string | null | undefined): string {
  if (!role) return 'Guest';
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatPermissionName(name: string | null | undefined): string {
  if (!name) return '—';
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
