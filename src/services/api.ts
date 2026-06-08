import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import env from '@/config/env';
import { toast } from '@/utils/toast';
import { logout } from '@/features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${env.apiUrl}/api/v1`,
  prepareHeaders: (headers) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sbr_token');
      if (token) headers.set('x-auth-token', token);
    }
    return headers;
  },
});

const baseQueryWithErrorToast: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;

    if (status === 401) {
      // Token expired or invalid — clear session and redirect to login
      api.dispatch(logout());
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return result;
    }

    // 400 = validation error — handled silently per-page
    if (status !== 400) {
      const data = result.error.data as { message?: string } | undefined;
      const msg = data?.message ?? 'Something went wrong. Please try again.';
      toast.error(msg);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithErrorToast,
  tagTypes: ['Frame', 'Contacts', 'Addresses', 'Auth', 'AuditLog'],
  endpoints: () => ({}),
});
