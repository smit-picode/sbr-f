import { baseApi } from '@/services/api';
import type { ApiResponse, SbrLegalUnit, LegalUnitFilters } from '@/types';

// _permission is stripped from query params and sent as x-required-permission header instead.
// This lets the backend enforce the exact permission the frontend is using for each call.
type LegalUnitsListArg = LegalUnitFilters & { _permission?: string };

export const legalUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLegalUnitsList: builder.query<ApiResponse<SbrLegalUnit[]>, LegalUnitsListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/legal-units',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['LegalUnits'],
      // Exclude _permission from the RTK Query cache key so toggling
      // search on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
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
