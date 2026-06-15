import { baseApi } from '@/services/api';
import type { ApiResponse, LoginRequest, LoginResponse, UserPermission } from '@/types';

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
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useSwitchRoleMutation, useGetMyPermissionsQuery } = authApi;
