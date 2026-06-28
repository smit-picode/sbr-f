import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface ChangeRequestListItem {
  ID: number;
  REQUEST_CODE: string;
  TABLE_NAME: string;
  ROW_ID: number | null;
  ENTITY: string | null;
  CHANGE_COUNT: number;
  REQUESTED_BY: string | null;
  CREATED_AT: string;
  STATUS: string;
}

export interface ChangeRequestField {
  field: string;
  old: unknown;
  new: unknown;
}

export interface ChangeRequestDetail {
  ID: number;
  REQUEST_CODE: string;
  TABLE_NAME: string;
  ROW_ID: number | null;
  ENTITY: string | null;
  STATUS: string;
  CHANGE_REASON: string | null;
  APPROVAL_REASON: string | null;
  REQUESTED_BY: string | null;
  APPROVED_BY: string | null;
  CREATED_AT: string;
  APPROVAL_DATE: string | null;
  fields: ChangeRequestField[];
  addEstablishmentSbrIds: number[];
  removeEstablishmentSbrIds: number[];
  record: Record<string, unknown> | null;
}

export interface ChangeRequestFilters {
  page?: number;
  limit?: number;
  tableName?: string;
  status?: string;
}

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
      invalidatesTags: ['ChangeRequests', 'Establishments', 'Enterprises', 'Contacts', 'Addresses', 'AuditLog'],
    }),
    rejectChangeRequest: builder.mutation<ApiResponse<null>, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/change-requests/${id}/reject`, method: 'POST', body: { reason } }),
      // Reject clears the row's pending state, so refresh the entity lists/detail badges too (mirrors approve).
      invalidatesTags: ['ChangeRequests', 'Establishments', 'Enterprises', 'Contacts', 'Addresses', 'AuditLog'],
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
