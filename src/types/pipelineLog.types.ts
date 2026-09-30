// Pipeline Logs is read-only — SBR_PIPELINE_RUNS (list) and SBR_PIPELINE_STEP_LOG (per-run detail), both owned by the etl-sbr-repo pipeline. See sbr-backend pipeline.controller.ts.
export interface PipelineRun {
  RUN_ID:                   number;
  STARTED_AT:               string | null;
  FINISHED_AT:              string | null;
  STATUS:                   string; // RUNNING | COMPLETED | FAILED
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
  EVENT:     string; // START | END | INFO
  EVENT_AT:  string;
  MESSAGE:   string | null;
}
