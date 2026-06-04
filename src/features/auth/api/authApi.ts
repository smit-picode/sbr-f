import { baseApi } from '@/services/api';
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation } = authApi;
