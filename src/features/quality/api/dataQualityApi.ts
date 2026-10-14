import { baseApi } from '@/services/api';
import type { ApiResponse, DqSummary, NpcCorrection, NpcCorrectionsParams, NpcCorrectionsSummary } from '@/types';

export const dataQualityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Read-only: the register is re-scored by the database, never from the portal.
    getDataQualitySummary: builder.query<ApiResponse<DqSummary>, void>({
      query: () => ({ url: '/data-quality/summary' }),
    }),
    getNpcCorrectionsSummary: builder.query<ApiResponse<NpcCorrectionsSummary>, void>({
      query: () => ({ url: '/data-quality/corrections/summary' }),
    }),
    getNpcCorrections: builder.query<ApiResponse<NpcCorrection[]>, NpcCorrectionsParams>({
      query: (params) => ({ url: '/data-quality/corrections', params }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetDataQualitySummaryQuery, useGetNpcCorrectionsSummaryQuery, useGetNpcCorrectionsQuery } = dataQualityApi;
