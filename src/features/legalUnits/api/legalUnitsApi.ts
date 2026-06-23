import { baseApi } from '@/services/api';
import type { ApiResponse, SbrLegalUnit, LegalUnitFilters } from '@/types';

export const legalUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLegalUnitsList: builder.query<ApiResponse<SbrLegalUnit[]>, LegalUnitFilters>({
      query: (params) => ({ url: '/legal-units', params }),
      providesTags: ['LegalUnits'],
    }),
    getLegalUnitById: builder.query<ApiResponse<SbrLegalUnit & { addresses?: unknown[]; contacts?: unknown[] }>, number>({
      query: (sbrId) => `/legal-units/${sbrId}`,
      providesTags: ['LegalUnits'],
    }),
    getLegalUnitHistory: builder.query<ApiResponse<SbrLegalUnit[]>, number>({
      query: (sbrId) => `/legal-units/${sbrId}/history`,
      providesTags: ['LegalUnits'],
    }),
    updateLegalUnit: builder.mutation<ApiResponse<SbrLegalUnit>, { id: number; data: Partial<SbrLegalUnit> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/legal-units/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['LegalUnits', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetLegalUnitsListQuery, useGetLegalUnitByIdQuery, useGetLegalUnitHistoryQuery, useUpdateLegalUnitMutation } = legalUnitsApi;
