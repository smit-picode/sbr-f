import { baseApi } from '@/services/api';
import type { ApiResponse, FilterValue } from '@/types';

// One endpoint shape for every table's column filters: the url plus ?column=.
export const filterValuesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFilterValues: builder.query<ApiResponse<FilterValue[]>, { url: string; column: string }>({
      query: ({ url, column }) => ({ url, params: { column } }),
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetFilterValuesQuery } = filterValuesApi;
