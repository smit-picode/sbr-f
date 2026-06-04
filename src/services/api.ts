import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import env from '@/config/env';
import { toast } from '@/utils/toast';

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

// Wraps rawBaseQuery to show a toast on any API error.
// Skips 400 (validation — handled per-page) and 401 (auth — axios interceptor redirects).
const baseQueryWithErrorToast: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;

    // 400 = validation error (handled silently per-page via is400())
    // 401 = unauthenticated (axios interceptor redirects to /login)
    if (status !== 400 && status !== 401) {
      const data = result.error.data as { message?: string } | undefined;
      const message = data?.message ?? 'Something went wrong. Please try again.';
      toast.error(message);
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
