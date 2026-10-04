import { baseApi } from '@/services/api';
import type {
  ApiResponse,
  CreateSnapshotBody,
  SnapshotListParams,
  SnapshotLiveCounts,
  SnapshotRow,
  SnapshotSummary,
  SnapshotTableParams,
} from '@/types';

export const snapshotsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSnapshotLiveCounts: builder.query<ApiResponse<SnapshotLiveCounts | null>, void>({
      query: () => ({ url: '/snapshots/live-counts' }),
      providesTags: ['Snapshots'],
    }),
    getSnapshots: builder.query<ApiResponse<SnapshotSummary[]>, SnapshotListParams>({
      query: (params) => ({ url: '/snapshots', params }),
      providesTags: ['Snapshots'],
    }),
    getSnapshotTable: builder.query<ApiResponse<SnapshotRow[]>, SnapshotTableParams>({
      query: ({ id, entity, ...params }) => ({ url: `/snapshots/${id}/${entity}`, params }),
      // Frozen rows never change, so there is nothing to invalidate.
      keepUnusedDataFor: 300,
    }),
    // The request returns only after all five tables are copied — seconds on the full register.
    createSnapshot: builder.mutation<ApiResponse<{ SNAPSHOT_ID: number }>, CreateSnapshotBody>({
      query: (body) => ({ url: '/snapshots', method: 'POST', body }),
      invalidatesTags: ['Snapshots', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSnapshotLiveCountsQuery,
  useGetSnapshotsQuery,
  useGetSnapshotTableQuery,
  useCreateSnapshotMutation,
} = snapshotsApi;
