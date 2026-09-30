import { baseApi } from '@/services/api';
import type { ApiResponse, PipelineRun, PipelineRunFilters, PipelineStepLog } from '@/types';

export const pipelineLogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPipelineRuns: builder.query<ApiResponse<PipelineRun[]>, PipelineRunFilters>({
      query: (params) => ({ url: '/pipeline-logs', params }),
      providesTags: ['PipelineLogs'],
    }),
    getPipelineStepLog: builder.query<ApiResponse<PipelineStepLog[]>, number>({
      query: (runId) => ({ url: `/pipeline-logs/${runId}` }),
      providesTags: ['PipelineLogs'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPipelineRunsQuery, useGetPipelineStepLogQuery } = pipelineLogsApi;
