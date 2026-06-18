import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import env from '@/config/env';
import { toast } from '@/utils/toast';
import { logout } from '@/features/auth/authSlice';

// Prevents multiple 403 errors from stacking duplicate toasts and redirects
let permissionRedirectInProgress = false;
// Prevents duplicate toasts when multiple concurrent requests all fail with 401
let sessionExpiredInProgress = false;

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
    const url = typeof args === 'string' ? args : args.url;

    // Login failures are handled inline on the login page — a 401/400 here means
    // wrong credentials, NOT an expired session. Skip all global handling so the
    // session-expired toast and the delayed redirect/reload never fire.
    if (url === '/auth/login') {
      return result;
    }

    if (status === 401) {
      if (!sessionExpiredInProgress) {
        sessionExpiredInProgress = true;
        api.dispatch(logout());
        toast.warning('Your session has expired. Please log in again.');
        if (typeof window !== 'undefined') {
          setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
      }
      return result;
    }

    if (status === 403) {
      if (!permissionRedirectInProgress && typeof window !== 'undefined') {
        permissionRedirectInProgress = true;
        const errData = result.error.data as { message?: string } | undefined;
        const msg = errData?.message ?? 'Your access to this section has been revoked.';
        // Show the toast BEFORE modifying Redux/localStorage — prevents AdminPage's
        // permission useEffect from racing to navigate first.
        toast.error(msg);
        setTimeout(() => {
          api.dispatch(logout());
          localStorage.removeItem('sbr_token');
          localStorage.removeItem('sbr_user');
          localStorage.removeItem('sbr_permissions');
          window.location.href = '/login';
        }, 3000);
      }
      return result;
    }

    // 400 = validation error — handled per-component
    // suppress generic toasts while a session-expiry or permission redirect is already in progress
    if (status !== 400 && !sessionExpiredInProgress && !permissionRedirectInProgress) {
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
  tagTypes: ['LegalUnits', 'Enterprises', 'Contacts', 'Addresses', 'Auth', 'AuditLog', 'Admin'],
  endpoints: () => ({}),
});
