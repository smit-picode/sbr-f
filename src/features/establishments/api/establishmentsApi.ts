import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEstablishment, EstablishmentFilters } from '@/types';

export const establishmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEstablishmentsList: builder.query<ApiResponse<SbrEstablishment[]>, EstablishmentFilters>({
      query: (params) => ({ url: '/establishments', params }),
      providesTags: ['Establishments'],
    }),
    getEstablishmentById: builder.query<ApiResponse<SbrEstablishment & { addresses?: unknown[]; contacts?: unknown[] }>, number>({
      query: (sbrId) => `/establishments/${sbrId}`,
      providesTags: ['Establishments'],
    }),
    getEstablishmentHistory: builder.query<ApiResponse<SbrEstablishment[]>, number>({
      query: (sbrId) => `/establishments/${sbrId}/history`,
      providesTags: ['Establishments'],
    }),
    updateEstablishment: builder.mutation<ApiResponse<SbrEstablishment>, { id: number; data: Partial<SbrEstablishment> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/establishments/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Establishments', 'AuditLog', 'ChangeRequests'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetEstablishmentsListQuery, useGetEstablishmentByIdQuery, useGetEstablishmentHistoryQuery, useUpdateEstablishmentMutation } = establishmentsApi;
