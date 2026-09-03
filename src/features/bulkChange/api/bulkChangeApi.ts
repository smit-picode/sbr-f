import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';
import type {
  BulkChangeDecideResponse,
  BulkChangeDecision,
  BulkChangeEntityType,
  BulkChangeItemInput,
  BulkChangeSubmitResponse,
  BulkChangeTaskDetail,
  BulkChangeTaskSummary,
  BulkChangeTemplate,
  BulkChangeValidationResult,
} from '../types';

// One current record for the export-and-prefill flow — the row's own ID plus
// SBR_ID plus every column the template offers, keyed generically since the field set differs
// per entity. Same value shapes parseWorkbook.ts already works with.
export type BulkChangeExportRecord = Record<string, string | number | null>;

export interface BulkChangeListFilters {
  page?: number;
  limit?: number;
  entityType?: BulkChangeEntityType;
}

export const bulkChangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Pending queue.
    getBulkChangeList: builder.query<ApiResponse<BulkChangeTaskSummary[]>, BulkChangeListFilters>({
      query: (params) => ({ url: '/bulk-change', params }),
      providesTags: ['BulkChange'],
    }),

    // Decided batches.
    getBulkChangeHistory: builder.query<ApiResponse<BulkChangeTaskSummary[]>, BulkChangeListFilters>({
      query: (params) => ({ url: '/bulk-change/history', params }),
      providesTags: ['BulkChange'],
    }),

    getBulkChangeById: builder.query<ApiResponse<BulkChangeTaskDetail>, number>({
      query: (id) => ({ url: `/bulk-change/${id}` }),
      providesTags: ['BulkChange'],
    }),

    // Column dictionary — the editable columns come from the backend so the template and the
    // validator can never disagree about what a bulk upload may change.
    getBulkChangeTemplate: builder.query<ApiResponse<BulkChangeTemplate>, BulkChangeEntityType>({
      query: (entityType) => ({ url: `/bulk-change/template/${entityType}` }),
      providesTags: ['BulkChange'],
    }),

    // The operator's actual current records, for "Download template" to pre-fill instead of
    // handing back an empty sheet. A lazy query: fetched only on demand (the button click), never
    // on mount. excludedCount is kept in the response shape for stability but currently unused.
    getBulkChangeExport: builder.query<
      ApiResponse<{ records: BulkChangeExportRecord[]; excludedCount: number }>,
      BulkChangeEntityType
    >({
      query: (entityType) => ({ url: `/bulk-change/export/${entityType}` }),
    }),

    // Dry run: checks the parsed rows against live data and returns the real old/new diff.
    // A mutation rather than a query because the payload is a whole workbook, and because the
    // result must never be served from cache.
    validateBulkChange: builder.mutation<
      ApiResponse<BulkChangeValidationResult>,
      { entityType: BulkChangeEntityType; items: BulkChangeItemInput[] }
    >({
      query: (body) => ({ url: '/bulk-change/validate', method: 'POST', body }),
    }),

    submitBulkChange: builder.mutation<
      ApiResponse<BulkChangeSubmitResponse>,
      { entityType: BulkChangeEntityType; items: BulkChangeItemInput[]; reason: string; fileName?: string }
    >({
      query: (body) => ({ url: '/bulk-change', method: 'POST', body }),
      // A bulk submit creates N pending change requests, so the approvals queue and its
      // sidebar count go stale too, not just the bulk list.
      invalidatesTags: ['BulkChange', 'ChangeRequests', 'AuditLog'],
    }),

    decideBulkChange: builder.mutation<
      ApiResponse<BulkChangeDecideResponse>,
      { id: number; decision: BulkChangeDecision; reason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/bulk-change/${id}/decide`, method: 'POST', body }),
      // Approving applies SCD2 changes to the underlying register rows, so every list that
      // could be showing one of them is invalidated alongside the queue.
      invalidatesTags: [
        'BulkChange', 'ChangeRequests', 'AuditLog',
        'Establishments', 'Contacts', 'Addresses',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBulkChangeListQuery,
  useGetBulkChangeHistoryQuery,
  useGetBulkChangeByIdQuery,
  useGetBulkChangeTemplateQuery,
  useLazyGetBulkChangeExportQuery,
  useValidateBulkChangeMutation,
  useSubmitBulkChangeMutation,
  useDecideBulkChangeMutation,
} = bulkChangeApi;
