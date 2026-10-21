import { baseApi } from '@/services/api';
import type { ApiResponse, ChangePasswordRequest, LoginRequest, LoginResponse, PasswordLinkInfo, UserPermission } from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    switchRole: builder.mutation<ApiResponse<LoginResponse>, { roleId: number }>({
      query: (body) => ({ url: '/auth/switch-role', method: 'POST', body }),
    }),
    getMyPermissions: builder.query<ApiResponse<UserPermission[]>, void>({
      query: () => ({ url: '/auth/my-permissions' }),
      providesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<ApiResponse<void>, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
      extraOptions: { silentErrors: true },
      invalidatesTags: ['AuditLog'],
    }),
    checkPasswordLink: builder.query<ApiResponse<PasswordLinkInfo>, string>({
      query: (token) => ({ url: `/auth/password-links/${encodeURIComponent(token)}` }),
      extraOptions: { silentErrors: true },
    }),
    redeemPasswordLink: builder.mutation<ApiResponse<{ email: string }>, { token: string; password: string }>({
      query: ({ token, password }) => ({ url: `/auth/password-links/${encodeURIComponent(token)}`, method: 'POST', body: { password } }),
      extraOptions: { silentErrors: true },
      invalidatesTags: ['AuditLog'],
    }),
    changePassword: builder.mutation<ApiResponse<{ token: string }>, ChangePasswordRequest>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      extraOptions: { silentErrors: true },
      invalidatesTags: ['AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation, useSwitchRoleMutation, useGetMyPermissionsQuery, useForgotPasswordMutation, useCheckPasswordLinkQuery,
  useRedeemPasswordLinkMutation, useChangePasswordMutation,
} = authApi;
