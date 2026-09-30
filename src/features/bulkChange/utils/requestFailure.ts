import { BULK_TRANSIENT_FAILURE_STATUSES } from '../constants';

// RTK Query's failed-request shape; a proxy's HTML error page arrives as PARSING_ERROR carrying originalStatus.
export const requestFailureStatus = (error: unknown): string | number | null => {
  if (!error || typeof error !== 'object') return null;
  const obj = error as { status?: unknown; originalStatus?: unknown };
  const status = obj.originalStatus ?? obj.status;
  return typeof status === 'number' || typeof status === 'string' ? status : null;
};

export const isTransientFailure = (status: string | number | null): boolean =>
  status !== null && BULK_TRANSIENT_FAILURE_STATUSES.includes(status);
