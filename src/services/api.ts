import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import env from '@/config/env';
import { toast } from '@/utils/toast';
import { logout } from '@/features/auth/authSlice';
import i18n from '@/i18n/config';

let permissionRedirectInProgress = false;
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

  if (api.signal.aborted) return result;

  if (result.error) {
    const status = result.error.status;
    const url = typeof args === 'string' ? args : args.url;

    if (url === '/auth/login') {
      return result;
    }

    if (status === 401) {
      if (!sessionExpiredInProgress) {
        sessionExpiredInProgress = true;
        api.dispatch(logout());
        toast.warning(i18n.t('common.sessionExpired', { defaultValue: 'Your session has expired. Please log in again.' }));
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
        const msg = errData?.message ?? i18n.t('common.accessRevoked', { defaultValue: 'Your access to this section has been revoked.' });
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

    const silentErrors = (extraOptions as { silentErrors?: boolean } | undefined)?.silentErrors === true;
    if (status !== 400 && !silentErrors && !sessionExpiredInProgress && !permissionRedirectInProgress) {
      const data = result.error.data as { message?: string } | undefined;
      const msg = data?.message ?? i18n.t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' });
      toast.error(msg);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithErrorToast,
  tagTypes: ['Establishments', 'Enterprises', 'EnterpriseGroups', 'Contacts', 'Addresses', 'Auth', 'AuditLog', 'Admin', 'ChangeRequests', 'LegalUnits', 'BulkChange', 'Lookups', 'Surveys', 'PipelineLogs', 'Snapshots'],
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
