import { baseApi } from '@/services/api';
import type {
  ApiResponse, PublishedSample, SamplePublishAccount, SamplingPublishBody, SamplingContactsRequest, SamplingContactTag, SamplingDrawRequest, SamplingDrawResult,
  SamplingEstablishmentsRequest, SamplingField, SamplingFrame, SamplingRow, SamplingStrataRequest, SamplingStrataResult,
  SamplingTableResult, SamplingUnit, SamplingValue,
} from '@/types';
import { cleanParams } from '@/utils/query';

// The draw endpoints are reads (their POSTs carry filter trees and id lists that do not fit a query string); publishing is the only write.
export const samplingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSamplingFrames: builder.query<ApiResponse<SamplingFrame[]>, void>({
      query: () => ({ url: '/sampling/frames' }),
    }),
    getSamplingFields: builder.query<ApiResponse<SamplingField[]>, SamplingUnit>({
      query: (unit) => ({ url: '/sampling/fields', params: { unit } }),
    }),
    getSamplingValues: builder.query<ApiResponse<SamplingValue[]>, { unit: SamplingUnit; column: string; snapshotId: number | null }>({
      query: ({ unit, column, snapshotId }) => ({ url: '/sampling/values', params: cleanParams({ unit, column, snapshotId }) }),
    }),
    getSamplingStrata: builder.query<ApiResponse<SamplingStrataResult>, SamplingStrataRequest>({
      query: (body) => ({ url: '/sampling/strata', method: 'POST', body }),
    }),
    drawSample: builder.query<ApiResponse<SamplingDrawResult>, SamplingDrawRequest>({
      query: (body) => ({ url: '/sampling/draw', method: 'POST', body }),
      keepUnusedDataFor: 30,
    }),
    getSampleEstablishments: builder.query<ApiResponse<SamplingTableResult>, SamplingEstablishmentsRequest>({
      query: (body) => ({ url: '/sampling/establishments', method: 'POST', body }),
      keepUnusedDataFor: 30,
    }),
    getSamplingContactTags: builder.query<ApiResponse<SamplingContactTag[]>, void>({
      query: () => ({ url: '/sampling/contact-tags' }),
    }),
    getSampleContacts: builder.query<ApiResponse<SamplingRow[]>, SamplingContactsRequest>({
      query: (body) => ({ url: '/sampling/contacts', method: 'POST', body }),
      keepUnusedDataFor: 30,
    }),
    getPublishedSamples: builder.query<ApiResponse<PublishedSample[]>, void>({
      query: () => ({ url: '/sampling/published' }),
      providesTags: ['PublishedSamples'],
    }),
    getSamplePublishAccounts: builder.query<ApiResponse<SamplePublishAccount[]>, void>({
      query: () => ({ url: '/sampling/published/accounts' }),
    }),
    publishSample: builder.mutation<ApiResponse<{ id: number }>, SamplingPublishBody>({
      query: (body) => ({ url: '/sampling/published', method: 'POST', body }),
      invalidatesTags: ['PublishedSamples', 'AuditLog'],
    }),
    setPublishedSampleAccounts: builder.mutation<ApiResponse<null>, { id: number; accountIds: number[] }>({
      query: ({ id, accountIds }) => ({ url: `/sampling/published/${id}/accounts`, method: 'PUT', body: { accountIds } }),
      invalidatesTags: ['PublishedSamples', 'AuditLog'],
    }),
    withdrawPublishedSample: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/sampling/published/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PublishedSamples', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSamplingFramesQuery,
  useGetSamplingFieldsQuery,
  useGetSamplingValuesQuery,
  useGetSamplingStrataQuery,
  useLazyDrawSampleQuery,
  useLazyGetSampleEstablishmentsQuery,
  useGetSamplingContactTagsQuery,
  useLazyGetSampleContactsQuery,
  useGetPublishedSamplesQuery,
  useGetSamplePublishAccountsQuery,
  usePublishSampleMutation,
  useSetPublishedSampleAccountsMutation,
  useWithdrawPublishedSampleMutation,
} = samplingApi;
