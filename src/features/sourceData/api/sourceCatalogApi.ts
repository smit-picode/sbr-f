import { baseApi } from '@/services/api';
import type { ApiResponse, SourceCatalogRecord } from '@/types';

export const sourceCatalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // One flat list serves both the catalog and the per-regulator tables page (RTK caches it).
    getSourceCatalog: builder.query<ApiResponse<SourceCatalogRecord[]>, void>({
      query: () => ({ url: '/source-catalog' }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetSourceCatalogQuery } = sourceCatalogApi;
