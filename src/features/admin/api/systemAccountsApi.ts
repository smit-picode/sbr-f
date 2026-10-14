import { baseApi } from '@/services/api';
import type { ApiResponse, IssuedSecret, SystemAccount, SystemAccountDetail, SystemAccountInput, SystemAccountRole } from '@/types';

export const systemAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSystemAccounts: builder.query<ApiResponse<SystemAccount[]>, void>({
      query: () => ({ url: '/admin/system-accounts' }),
      providesTags: ['Admin'],
    }),
    getSystemAccount: builder.query<ApiResponse<SystemAccountDetail>, number>({
      query: (id) => ({ url: `/admin/system-accounts/${id}` }),
      providesTags: ['Admin'],
    }),
    getSystemAccountRoles: builder.query<ApiResponse<SystemAccountRole[]>, void>({
      query: () => ({ url: '/admin/system-accounts/roles' }),
      providesTags: ['Admin'],
    }),
    createSystemAccount: builder.mutation<ApiResponse<{ ID: number; CLIENT_ID: string }>, SystemAccountInput>({
      query: (body) => ({ url: '/admin/system-accounts', method: 'POST', body }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    updateSystemAccount: builder.mutation<ApiResponse<void>, { id: number; data: SystemAccountInput }>({
      query: ({ id, data }) => ({ url: `/admin/system-accounts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    issueSystemAccountSecret: builder.mutation<ApiResponse<IssuedSecret>, { id: number; expiresAt: string | null }>({
      query: ({ id, expiresAt }) => ({ url: `/admin/system-accounts/${id}/credentials`, method: 'POST', body: { expiresAt } }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
    revokeSystemAccountSecret: builder.mutation<ApiResponse<void>, { id: number; credentialId: number }>({
      query: ({ id, credentialId }) => ({ url: `/admin/system-accounts/${id}/credentials/${credentialId}`, method: 'DELETE' }),
      invalidatesTags: ['Admin', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSystemAccountsQuery,
  useGetSystemAccountQuery,
  useGetSystemAccountRolesQuery,
  useCreateSystemAccountMutation,
  useUpdateSystemAccountMutation,
  useIssueSystemAccountSecretMutation,
  useRevokeSystemAccountSecretMutation,
} = systemAccountsApi;
