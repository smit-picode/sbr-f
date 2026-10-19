import type { TFunction } from 'i18next';

const PENDING_CHANGE_PREFIX = 'PENDING_CHANGE:';

const columnLabel = (column: string): string => column.replace(/_/g, ' ').toLowerCase();

// Turns the database's PENDING_CHANGE text into a plain sentence; null for any other message.
export const pendingChangeText = (raw: string | undefined | null, t: TFunction): string | null => {
  if (!raw) return null;
  const start = raw.indexOf(PENDING_CHANGE_PREFIX);
  if (start === -1) return null;
  let columns: string[] = [];
  try {
    const parsed = JSON.parse(raw.slice(start + PENDING_CHANGE_PREFIX.length).trim()) as { columns?: unknown };
    if (Array.isArray(parsed.columns)) columns = parsed.columns.filter((c): c is string => typeof c === 'string');
  } catch {
    columns = [];
  }
  if (columns.length === 0) {
    return t('common.pendingChangeBlockedGeneric', { defaultValue: "A change to this record is already waiting for approval. Changes can't be submitted until it is decided." });
  }
  const fields = columns.map(columnLabel).join(', ');
  return t('common.pendingChangeBlocked', { fields, defaultValue: "These fields are waiting for approval: {{fields}}. Changes can't be submitted until it is decided." });
};
