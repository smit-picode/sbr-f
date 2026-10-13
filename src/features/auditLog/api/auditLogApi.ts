import { baseApi } from '@/services/api';
import type { ApiResponse, AuditLog, AuditLogActorOption, AuditLogFilters } from '@/types';

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogList: builder.query<ApiResponse<AuditLog[]>, AuditLogFilters>({
      query: (params) => ({ url: '/audit-log', params }),
      providesTags: ['AuditLog'],
      keepUnusedDataFor: 0,
    }),
    getAuditLogUsers: builder.query<ApiResponse<AuditLogActorOption[]>, void>({
      query: () => ({ url: '/audit-log/users' }),
      providesTags: ['AuditLog'],
    }),
    getAuditLogApprovers: builder.query<ApiResponse<AuditLogActorOption[]>, void>({
      query: () => ({ url: '/audit-log/approvers' }),
      providesTags: ['AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAuditLogListQuery, useGetAuditLogUsersQuery, useGetAuditLogApproversQuery } = auditLogApi;
