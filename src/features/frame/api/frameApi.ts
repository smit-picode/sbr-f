import { baseApi } from '@/services/api';
import type { ApiResponse, SbrFrame, FrameFilters } from '@/types';

export const frameApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFrameList: builder.query<ApiResponse<SbrFrame[]>, FrameFilters>({
      query: (params) => ({ url: '/frame', params }),
      providesTags: ['Frame'],
    }),
    getFrameById: builder.query<ApiResponse<SbrFrame & { addresses?: unknown[]; contacts?: unknown[] }>, number>({
      query: (sbrId) => `/frame/${sbrId}`,
      providesTags: ['Frame'],
    }),
    getFrameHistory: builder.query<ApiResponse<SbrFrame[]>, number>({
      query: (sbrId) => `/frame/${sbrId}/history`,
      providesTags: ['Frame'],
    }),
    updateFrame: builder.mutation<ApiResponse<SbrFrame>, { id: number; data: Partial<SbrFrame> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/frame/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Frame', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetFrameListQuery, useGetFrameByIdQuery, useGetFrameHistoryQuery, useUpdateFrameMutation } = frameApi;
