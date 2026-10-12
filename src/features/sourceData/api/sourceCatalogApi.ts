import { baseApi } from '@/services/api';
import type { ApiResponse, SourceCatalogRecord } from '@/types';

export const sourceCatalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSourceCatalog: builder.query<ApiResponse<SourceCatalogRecord[]>, void>({
      query: () => ({ url: '/source-catalog' }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetSourceCatalogQuery } = sourceCatalogApi;
