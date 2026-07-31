import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEstablishment, EstablishmentFilters, AttachableEstablishment } from '@/types';

export const establishmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEstablishmentsList: builder.query<ApiResponse<SbrEstablishment[]>, EstablishmentFilters>({
      query: (params) => ({ url: '/establishments', params }),
      providesTags: ['Establishments'],
    }),
    // Only establishments not already attached to an enterprise — for the Enterprise-edit picker.
    getAttachableEstablishments: builder.query<ApiResponse<AttachableEstablishment[]>, { search?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/establishments/attachable', params }),
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

export const {
  useGetEstablishmentsListQuery,
  useGetAttachableEstablishmentsQuery,
  useGetEstablishmentByIdQuery,
  useGetEstablishmentHistoryQuery,
  useUpdateEstablishmentMutation,
} = establishmentsApi;
