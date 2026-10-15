import { baseApi } from '@/services/api';
import type { ApiResponse, ChangeRequestDetail, ChangeRequestFilters, ChangeRequestListItem } from '@/types';

export const changeRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChangeRequests: builder.query<ApiResponse<ChangeRequestListItem[]>, ChangeRequestFilters>({
      query: (params) => ({ url: '/change-requests', params }),
      providesTags: ['ChangeRequests'],
    }),
    getChangeRequestCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => ({ url: '/change-requests/count' }),
      providesTags: ['ChangeRequests'],
    }),
    getChangeRequestById: builder.query<ApiResponse<ChangeRequestDetail>, number>({
      query: (id) => ({ url: `/change-requests/${id}` }),
      providesTags: ['ChangeRequests'],
    }),
    approveChangeRequest: builder.mutation<ApiResponse<null>, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/change-requests/${id}/approve`, method: 'POST', body: { reason } }),
      invalidatesTags: ['ChangeRequests', 'BulkChange', 'Establishments', 'Enterprises', 'Contacts', 'Addresses', 'AuditLog'],
    }),
    rejectChangeRequest: builder.mutation<ApiResponse<null>, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/change-requests/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: ['ChangeRequests', 'BulkChange', 'Establishments', 'Enterprises', 'Contacts', 'Addresses', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetChangeRequestsQuery,
  useGetChangeRequestCountQuery,
  useGetChangeRequestByIdQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
} = changeRequestsApi;
