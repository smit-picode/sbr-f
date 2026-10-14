import { baseApi } from '@/services/api';
import type { ApiResponse, SourceCatalogCounts, SourceCatalogRecord, SourceTableColumn, SourceTableParams, SourceTableRow } from '@/types';

export const sourceCatalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // One flat list serves both the catalog and the per-regulator tables page (RTK caches it).
    getSourceCatalog: builder.query<ApiResponse<SourceCatalogRecord[]>, void>({
      query: () => ({ url: '/source-catalog' }),
    }),
    // Stored counts, refreshed on request in the database; the pages show "not counted yet" for null.
    getSourceCatalogCounts: builder.query<ApiResponse<SourceCatalogCounts>, void>({
      query: () => ({ url: '/source-catalog/counts' }),
    }),
    getSourceTableColumns: builder.query<ApiResponse<SourceTableColumn[]>, string>({
      query: (table) => ({ url: `/source-catalog/tables/${encodeURIComponent(table)}/columns` }),
    }),
    getSourceTable: builder.query<ApiResponse<SourceTableRow[]>, SourceTableParams>({
      query: ({ table, ...params }) => ({ url: `/source-catalog/tables/${encodeURIComponent(table)}`, params }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetSourceCatalogQuery, useGetSourceCatalogCountsQuery, useGetSourceTableColumnsQuery, useGetSourceTableQuery } = sourceCatalogApi;
