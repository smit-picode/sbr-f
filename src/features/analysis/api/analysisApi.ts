import { baseApi } from '@/services/api';
import { withKnownFields } from '../utils/blocks';
import type { Analysis, AnalysisDefinition, AnalysisExportLog, AnalysisFrame, AnalysisListParams, AnalysisRequest, AnalysisResult, AnalysisShare, AnalysisShareDirectoryEntry, ApiResponse, SaveAnalysisBody } from '@/types';

export const analysisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // A new snapshot adds a frame, so frames follow the Snapshots tag.
    getAnalysisFrames: builder.query<ApiResponse<AnalysisFrame[]>, void>({
      query: () => ({ url: '/analysis/frames' }),
      providesTags: ['Snapshots'],
    }),
    // A POST that only reads; blocks render their own error state, so no global toast.
    runAnalysisQuery: builder.query<ApiResponse<AnalysisResult>, AnalysisRequest>({
      query: (body) => ({ url: '/analysis/query', method: 'POST', body }),
      extraOptions: { silentErrors: true },
      keepUnusedDataFor: 300,
    }),
    getAnalysisShareDirectory: builder.query<ApiResponse<AnalysisShareDirectoryEntry[]>, string>({
      query: (search) => ({ url: '/analysis/share-directory', params: search ? { search } : undefined }),
    }),
    logAnalysisExport: builder.mutation<ApiResponse<null>, AnalysisExportLog>({
      query: (body) => ({ url: '/analysis/exports', method: 'POST', body }),
      extraOptions: { silentErrors: true },
      invalidatesTags: ['AuditLog'],
    }),

    getAnalyses: builder.query<ApiResponse<Analysis[]>, AnalysisListParams>({
      query: (params) => ({ url: '/analyses', params }),
      providesTags: [{ type: 'Analyses', id: 'LIST' }],
    }),
    getAnalysis: builder.query<ApiResponse<Analysis>, string>({
      query: (id) => ({ url: `/analyses/${id}` }),
      transformResponse: (res: ApiResponse<Analysis>) => (res.data ? { ...res, data: withKnownFields(res.data) } : res),
      extraOptions: { silentErrors: true },
      providesTags: (_r, _e, id) => [{ type: 'Analyses', id }],
    }),
    createAnalysis: builder.mutation<ApiResponse<Analysis>, SaveAnalysisBody>({
      query: (body) => ({ url: '/analyses', method: 'POST', body }),
      invalidatesTags: [{ type: 'Analyses', id: 'LIST' }, 'AuditLog'],
    }),
    // Autosave target; the report page handles a 409 (stale rowVersion) itself.
    updateAnalysis: builder.mutation<ApiResponse<Analysis>, { id: string; body: SaveAnalysisBody & { rowVersion: number } }>({
      query: ({ id, body }) => ({ url: `/analyses/${id}`, method: 'PUT', body }),
      extraOptions: { silentErrors: true },
      invalidatesTags: [{ type: 'Analyses', id: 'LIST' }, 'AuditLog'],
    }),
    deleteAnalysis: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/analyses/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Analyses', id: 'LIST' }, { type: 'Analyses', id }, 'AuditLog'],
    }),
    duplicateAnalysis: builder.mutation<ApiResponse<Analysis>, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/analyses/${id}/duplicate`, method: 'POST', body: { name } }),
      invalidatesTags: [{ type: 'Analyses', id: 'LIST' }, 'AuditLog'],
    }),
    setAnalysisShares: builder.mutation<ApiResponse<Analysis>, { id: string; shares: AnalysisShare[] }>({
      query: ({ id, shares }) => ({
        url: `/analyses/${id}/shares`,
        method: 'PUT',
        body: { shares: shares.map((s) => ({ principalType: s.kind.toUpperCase(), principalId: Number(s.id), access: s.access.toUpperCase() })) },
      }),
      invalidatesTags: [{ type: 'Analyses', id: 'LIST' }, 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnalysisFramesQuery,
  useRunAnalysisQueryQuery,
  useGetAnalysisShareDirectoryQuery,
  useLogAnalysisExportMutation,
  useGetAnalysesQuery,
  useGetAnalysisQuery,
  useCreateAnalysisMutation,
  useUpdateAnalysisMutation,
  useDeleteAnalysisMutation,
  useDuplicateAnalysisMutation,
  useSetAnalysisSharesMutation,
} = analysisApi;

export const toDefinition = (a: Pick<Analysis, 'frame' | 'compareTo' | 'filters' | 'blocks'>): AnalysisDefinition => ({
  frame: a.frame,
  compareTo: a.compareTo,
  filters: a.filters,
  blocks: a.blocks,
});
