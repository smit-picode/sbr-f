export const PIPELINE_RUNS_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
} as const;

export const PIPELINE_RUN_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export const PIPELINE_STATUS_BADGE: Record<string, 'info' | 'success' | 'destructive'> = {
  RUNNING: 'info',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

export const PIPELINE_STEP_EVENT_BADGE: Record<string, 'info' | 'success' | 'secondary'> = {
  START: 'info',
  END: 'success',
  INFO: 'secondary',
};
