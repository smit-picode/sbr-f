import { baseApi } from '@/services/api';
import type {
  ApiResponse,
  SourceCatalogRecord,
  SourceCatalogSummaryRecord,
  SourceCatalogDetailRecord,
  SourceTableColumn,
  SourceTableRow,
  SourceTableFilters,
} from '@/types';

export const sourceCatalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSourceCatalog: builder.query<ApiResponse<SourceCatalogRecord[]>, void>({
      query: () => ({ url: '/source-catalog' }),
    }),
    getSourceCatalogSummary: builder.query<ApiResponse<SourceCatalogSummaryRecord[]>, void>({
      query: () => ({ url: '/source-catalog/summary' }),
    }),
    getSourceCatalogDetail: builder.query<ApiResponse<SourceCatalogDetailRecord[]>, string>({
      query: (source) => ({ url: `/source-catalog/${encodeURIComponent(source)}` }),
    }),
    getSourceTableColumns: builder.query<ApiResponse<SourceTableColumn[]>, string>({
      query: (table) => ({ url: `/source-catalog/tables/${encodeURIComponent(table)}/columns` }),
    }),
    getSourceTableRows: builder.query<ApiResponse<SourceTableRow[]>, { table: string } & SourceTableFilters>({
      query: ({ table, ...params }) => ({ url: `/source-catalog/tables/${encodeURIComponent(table)}`, params }),
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSourceCatalogQuery,
  useGetSourceCatalogSummaryQuery,
  useGetSourceCatalogDetailQuery,
  useGetSourceTableColumnsQuery,
  useGetSourceTableRowsQuery,
} = sourceCatalogApi;
