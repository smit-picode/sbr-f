// Pipeline Logs is read-only
export interface PipelineRun {
  RUN_ID:                   number;
  STARTED_AT:               string | null;
  FINISHED_AT:              string | null;
  STATUS:                   string;
  FAILED_STEP:              string | null;
  ERROR_MESSAGE:            string | null;
  NOTES:                    string | null;
  CURRENT_STEP:             string | null;
  CURRENT_STEP_STARTED_AT:  string | null;
}

export interface PipelineRunFilters {
  page?:   number;
  limit?:  number;
  status?: string;
  search?: string;
}

export interface PipelineStepLog {
  RUN_ID:    number;
  STEP_NAME: string;
  EVENT:     string;
  EVENT_AT:  string;
  MESSAGE:   string | null;
}
