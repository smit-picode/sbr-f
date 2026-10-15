import type { FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue } from '@reduxjs/toolkit/query';
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
import { BULK_VALIDATE_RETRY_DELAYS_MS } from '../constants';
import { gzipJsonBody } from '../utils/gzipJsonBody';
import { isTransientFailure, requestFailureStatus } from '../utils/requestFailure';

import type { BulkChangeExportRecord, BulkChangeListFilters } from '@/features/bulkChange/types';
export const bulkChangeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBulkChangeList: builder.query<ApiResponse<BulkChangeTaskSummary[]>, BulkChangeListFilters>({
      query: (params) => ({ url: '/bulk-change', params }),
      providesTags: ['BulkChange'],
    }),

    getBulkChangeHistory: builder.query<ApiResponse<BulkChangeTaskSummary[]>, BulkChangeListFilters>({
      query: (params) => ({ url: '/bulk-change/history', params }),
      providesTags: ['BulkChange'],
    }),

    getBulkChangeById: builder.query<ApiResponse<BulkChangeTaskDetail>, number>({
      query: (id) => ({ url: `/bulk-change/${id}` }),
      providesTags: ['BulkChange'],
    }),

    getBulkChangeTemplate: builder.query<ApiResponse<BulkChangeTemplate>, BulkChangeEntityType>({
      query: (entityType) => ({ url: `/bulk-change/template/${entityType}` }),
      providesTags: ['BulkChange'],
    }),

    getBulkChangeExport: builder.query<
      ApiResponse<{ records: BulkChangeExportRecord[]; excludedCount: number }>,
      BulkChangeEntityType
    >({
      query: (entityType) => ({ url: `/bulk-change/export/${entityType}` }),
    }),

    validateBulkChange: builder.mutation<
      ApiResponse<BulkChangeValidationResult>,
      { entityType: BulkChangeEntityType; items: BulkChangeItemInput[] }
    >({
      queryFn: async (arg, api, _extra, baseQuery) => {
        const { body, headers } = await gzipJsonBody(arg);
        const send = () => baseQuery({ url: '/bulk-change/validate', method: 'POST', body, headers });
        let result = await send();
        for (const delay of BULK_VALIDATE_RETRY_DELAYS_MS) {
          if (!result.error || !isTransientFailure(requestFailureStatus(result.error)) || api.signal.aborted) break;
          await new Promise((resolve) => setTimeout(resolve, delay));
          result = await send();
        }
        return result as QueryReturnValue<ApiResponse<BulkChangeValidationResult>, FetchBaseQueryError, FetchBaseQueryMeta>;
      },
      extraOptions: { silentErrors: true },
    }),

    submitBulkChange: builder.mutation<
      ApiResponse<BulkChangeSubmitResponse>,
      { entityType: BulkChangeEntityType; items: BulkChangeItemInput[]; reason: string; fileName?: string }
    >({
      queryFn: async (arg, _api, _extra, baseQuery) => {
        const { body, headers } = await gzipJsonBody(arg);
        const result = await baseQuery({ url: '/bulk-change', method: 'POST', body, headers });
        return result as QueryReturnValue<ApiResponse<BulkChangeSubmitResponse>, FetchBaseQueryError, FetchBaseQueryMeta>;
      },
      invalidatesTags: ['BulkChange', 'ChangeRequests', 'AuditLog'],
    }),

    decideBulkChange: builder.mutation<
      ApiResponse<BulkChangeDecideResponse>,
      { id: number; decision: BulkChangeDecision; reason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/bulk-change/${id}/decide`, method: 'POST', body }),
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
