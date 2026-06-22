import { baseApi } from '@/services/api';
import type { ApiResponse, AuditLog, AuditLogFilters } from '@/types';

// _permission is stripped from query params and sent as x-required-permission header instead,
// so the backend enforces the exact permission the frontend is using for each call.
type AuditLogListArg = AuditLogFilters & { _permission?: string };

export const auditLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogList: builder.query<ApiResponse<AuditLog[]>, AuditLogListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/audit-log',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['AuditLog'],
      keepUnusedDataFor: 0,
      // Exclude _permission from the RTK Query cache key so toggling
      // filters on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
    }),
  }),
  overrideExisting: false,
});

export const { useGetAuditLogListQuery } = auditLogApi;
