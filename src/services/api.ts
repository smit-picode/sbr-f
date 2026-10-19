import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import env from '@/config/env';
import { toast } from '@/utils/toast';
import { logout } from '@/features/auth/authSlice';
import i18n from '@/i18n/config';
import { withBasePath } from '@/utils/basePath';

// Prevents duplicate toasts when multiple concurrent requests all fail with 401
let sessionExpiredInProgress = false;
// When each refusal message was last shown, so a refetch (tab focus, remount) does not repeat it.
const refusalShownAt = new Map<string, number>();
const REFUSAL_QUIET_MS = 10_000;

// With no configured URL the API is same-origin, behind the same /sbr base path as the app.
export const API_BASE_URL = env.apiUrl ? `${env.apiUrl}/api/v1` : withBasePath('/api/v1');

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
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
          setTimeout(() => { window.location.href = withBasePath('/login'); }, 2000);
        }
      }
      return result;
    }

    // A 403 refuses one request without ending the session: one notification, then refresh permissions.
    if (status === 403) {
      const silent403 = (extraOptions as { silentErrors?: boolean } | undefined)?.silentErrors === true;
      const errData = result.error.data as { message?: string } | undefined;
      const msg = errData?.message ?? i18n.t('common.accessDenied', { defaultValue: 'You do not have permission to see this.' });
      const now = Date.now();
      if (!silent403 && now - (refusalShownAt.get(msg) ?? 0) > REFUSAL_QUIET_MS) {
        refusalShownAt.set(msg, now);
        toast.warning(msg);
      }
      if (url !== '/auth/my-permissions') api.dispatch(baseApi.util.invalidateTags(['Auth']));
      return result;
    }

    const silentErrors = (extraOptions as { silentErrors?: boolean } | undefined)?.silentErrors === true;
    if (status !== 400 && !silentErrors && !sessionExpiredInProgress) {
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
  tagTypes: ['Establishments', 'Enterprises', 'EnterpriseGroups', 'Contacts', 'Addresses', 'Auth', 'AuditLog', 'Admin', 'ChangeRequests', 'LegalUnits', 'BulkChange', 'Lookups', 'Surveys', 'PipelineLogs', 'Snapshots', 'ContactTags', 'Analyses', 'PublishedSamples'],
  // Refetch on remount, focus and reconnect, because other users' edits reach the DB unseen.
  refetchOnMountOrArgChange: true,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
