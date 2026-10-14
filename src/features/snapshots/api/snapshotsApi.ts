import { API_BASE_URL, baseApi } from '@/services/api';
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
      keepUnusedDataFor: 300,
    }),
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
  useLazyGetSnapshotTableQuery,
  useCreateSnapshotMutation,
} = snapshotsApi;

export interface SnapshotExportRequest {
  path: string;
  params?: Record<string, string | undefined>;
  fileName: string;
}

// Exports are binary streams of up to hundreds of MB, so they bypass RTK Query's cache; progress is bytes received.
export async function downloadSnapshotExport(
  { path, params, fileName }: SnapshotExportRequest,
  onProgress?: (bytes: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(params ?? {})) if (v) url.searchParams.set(k, v);
  const token = localStorage.getItem('sbr_token');
  const res = await fetch(url, { headers: token ? { 'x-auth-token': token } : {}, signal });
  if (!res.ok || !res.body) {
    let msg: string | undefined;
    try { msg = (await res.json())?.message; } catch { msg = undefined; }
    throw new Error(msg || `Export failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    bytes += value.byteLength;
    onProgress?.(bytes);
  }
  const href = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('Content-Type') ?? 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = href;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
