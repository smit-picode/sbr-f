import { baseApi } from '@/services/api';
import type { ApiResponse, LookupValue, MainBranchEstablishment } from '@/types';

// Static reference lookups (SBR_LOOKUPS_API). Its own feature slice rather than part of
// establishments: the backing package is shared infrastructure for lookup lists that belong to
// no single entity, and a second consumer (the ISIC dropdown) is already specced.
//
// No mutation anywhere in the app invalidates 'Lookups' — these tables are seeded by DB
// migration and are never portal-editable — so the cache only refreshes on the baseApi-wide
// remount/focus/reconnect defaults. `keepUnusedDataFor` is raised well above the 60s default so
// opening the edit modal repeatedly in one session serves the 11 rows from cache.
export const lookupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The Inactive-meaning EST_STATUS_CATEGORY values. Unpaginated and unfiltered by
    // design — the procedure returns all 11 rows and the UI filters nothing.
    getEstStatusCategories: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/est-status-categories',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // The full ~437-row ISIC classification list. Fetched whole exactly once and
    // filtered client-side as the user types — the procedure takes no search or paging
    // parameters, and the list is small enough that a round trip per keystroke would be
    // slower and noisier than one up-front load.
    getIsicValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/isic',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // The distinct 2-digit ISIC division list, for the Enterprise Groups tab's
    // PRINCIPAL_ISIC_2DIGIT dropdown. Same load-once, filter-client-side design as ISIC above —
    // just the coarser ~87-row division level instead of the 4-digit classification.
    getIsic2DigitValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/isic-2digit',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // The full SBR_LEGAL_TYPE_LKP list, for the Establishments tab's Legal Type
    // dropdown. Same load-once design as the other lookups here — ~8-23 rows, small enough that
    // this doesn't need the search panel the ISIC list uses, matching EST_STATUS_CATEGORY's plain
    // <Select> precedent for a similarly-sized list.
    getLegalTypeValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/legal-types',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // The full SBR_SECTOR_TYPE_LKP list, for the Establishments tab's Sector dropdown.
    // Replaces a hardcoded frontend list — the same class of drift that caused the earlier
    // 'Mixed-Government' vs 'State Owned' rename bug. Small list, plain <Select>, same as Legal Type.
    getSectorTypeValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/sector-types',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    // Every active main-branch establishment. Same load-once, filter-client-side
    // design as ISIC — the procedure exposes no search or paging parameter, and the list is
    // small (dozens of rows, same order of magnitude as the other two lookups).
    getMainBranchValues: builder.query<ApiResponse<MainBranchEstablishment[]>, void>({
      query: () => '/lookups/main-branches',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEstStatusCategoriesQuery,
  useGetIsicValuesQuery,
  useGetIsic2DigitValuesQuery,
  useGetLegalTypeValuesQuery,
  useGetSectorTypeValuesQuery,
  useGetMainBranchValuesQuery,
} = lookupsApi;
