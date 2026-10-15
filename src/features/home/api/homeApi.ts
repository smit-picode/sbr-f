import { baseApi } from '@/services/api';
import type { ApiResponse, ExecutiveSummary, ReviewerSummary, StewardSummary } from '@/types';

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveSummary: builder.query<ApiResponse<ExecutiveSummary>, void>({
      query: () => ({ url: '/home/executive-summary' }),
    }),
    getStewardSummary: builder.query<ApiResponse<StewardSummary>, void>({
      query: () => ({ url: '/home/steward-summary' }),
      providesTags: ['ChangeRequests', 'BulkChange'],
    }),
    getReviewerSummary: builder.query<ApiResponse<ReviewerSummary>, void>({
      query: () => ({ url: '/home/reviewer-summary' }),
      providesTags: ['ChangeRequests', 'BulkChange'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetExecutiveSummaryQuery, useGetStewardSummaryQuery, useGetReviewerSummaryQuery } = homeApi;
