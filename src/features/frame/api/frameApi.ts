import { baseApi } from '@/services/api';
import type { ApiResponse, SbrFrame, FrameFilters } from '@/types';

// _permission is stripped from query params and sent as x-required-permission header instead.
// This lets the backend enforce the exact permission the frontend is using for each call.
type FrameListArg = FrameFilters & { _permission?: string };

export const frameApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFrameList: builder.query<ApiResponse<SbrFrame[]>, FrameListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/frame',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['Frame'],
      // Exclude _permission from the RTK Query cache key so toggling
      // search on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
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
