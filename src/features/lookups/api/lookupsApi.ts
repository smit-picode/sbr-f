import { baseApi } from '@/services/api';
import type { ApiResponse, LookupValue } from '@/types';

// Static reference lookups (SBR_LOOKUPS_API). Its own feature slice rather than part of
// establishments: the backing package is shared infrastructure for lookup lists that belong to
// no single entity, and a second consumer (the ISIC dropdown, NPC-220) is already specced.
//
// No mutation anywhere in the app invalidates 'Lookups' — these tables are seeded by DB
// migration and are never portal-editable — so the cache only refreshes on the baseApi-wide
// remount/focus/reconnect defaults. `keepUnusedDataFor` is raised well above the 60s default so
// opening the edit modal repeatedly in one session serves the 11 rows from cache.
export const lookupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The Inactive-meaning EST_STATUS_CATEGORY values (NPC-221). Unpaginated and unfiltered by
    // design — the procedure returns all 11 rows and the UI filters nothing.
    getEstStatusCategories: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/est-status-categories',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // The full ~437-row ISIC classification list (NPC-220). Fetched whole exactly once and
    // filtered client-side as the user types — the procedure takes no search or paging
    // parameters, and the list is small enough that a round trip per keystroke would be
    // slower and noisier than one up-front load.
    getIsicValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/isic',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
  }),
  overrideExisting: false,
});

export const { useGetEstStatusCategoriesQuery, useGetIsicValuesQuery } = lookupsApi;
