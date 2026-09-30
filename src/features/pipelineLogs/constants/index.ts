export const PIPELINE_RUNS_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
} as const;

// Real SBR.SBR_PIPELINE_RUNS.STATUS values (backend PIPELINE_RUN_STATUS enum) — not the SBR-design mockup's SUCCESS/PARTIAL wording.
export const PIPELINE_RUN_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

// Badge variant per real STATUS/EVENT value — mirrors the Badge component's variant palette.
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
