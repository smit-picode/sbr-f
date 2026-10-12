import { baseApi } from '@/services/api';
import type { ApiResponse, LookupValue, MainBranchEstablishment } from '@/types';

export const lookupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEstStatusCategories: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/est-status-categories',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    getIsicValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/isic',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    getIsic2DigitValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/isic-2digit',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    getLegalTypeValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/legal-types',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
    getSectorTypeValues: builder.query<ApiResponse<LookupValue[]>, void>({
      query: () => '/lookups/sector-types',
      providesTags: ['Lookups'],
      keepUnusedDataFor: 3600,
    }),
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
