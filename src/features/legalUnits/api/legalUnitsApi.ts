import { baseApi } from '@/services/api';
import type { ApiResponse, LegalUnit, LegalUnitFilters } from '@/types';

export const legalUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLegalUnitsList: builder.query<ApiResponse<LegalUnit[]>, LegalUnitFilters>({
      query: (params) => ({ url: '/legal-units', params }),
      providesTags: ['LegalUnits'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetLegalUnitsListQuery } = legalUnitsApi;
