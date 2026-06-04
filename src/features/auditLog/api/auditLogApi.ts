import { baseApi } from '@/services/api';
import type { ApiResponse, AuditLog, AuditLogFilters } from '@/types';

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogList: builder.query<ApiResponse<AuditLog[]>, AuditLogFilters>({
      query: (params) => ({ url: '/audit-log', params }),
      providesTags: ['AuditLog'],
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

export const { useGetAuditLogListQuery } = auditLogApi;
