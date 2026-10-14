import { baseApi } from '@/services/api';
import type {
  ApiResponse, BulkTagResult, BulkTagRow, ContactTag, ContactTagHistoryRow, EstablishmentContactsData, SaveContactTagInput, TagContactResult,
} from '@/types';

// NPC-330 contact tags. Writes need no approval: they apply immediately, so each one
// refreshes every view that shows contacts or tags.
export const contactTagsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContactTags: builder.query<ApiResponse<ContactTag[]>, { includeInactive?: boolean } | void>({
      query: (params) => ({ url: '/contact-tags/registry', params: params ?? undefined }),
      providesTags: ['ContactTags'],
    }),
    saveContactTag: builder.mutation<ApiResponse<{ ID: number; CODE: string; ACTION: string }>, SaveContactTagInput>({
      query: (body) => ({ url: '/contact-tags/registry', method: 'POST', body }),
      invalidatesTags: ['ContactTags', 'Contacts'],
    }),
    getEstablishmentContacts: builder.query<ApiResponse<EstablishmentContactsData>, number>({
      query: (sbrId) => ({ url: `/establishments/${sbrId}/contact-tags` }),
      providesTags: ['ContactTags', 'Contacts'],
    }),
    getContactTagHistory: builder.query<ApiResponse<ContactTagHistoryRow[]>, number>({
      query: (sbrId) => ({ url: `/establishments/${sbrId}/contact-tags/history` }),
      providesTags: ['ContactTags'],
    }),
    tagContact: builder.mutation<ApiResponse<TagContactResult>, { sbrId: number; contactId: number; tagCode: string; reason?: string }>({
      query: ({ sbrId, contactId, tagCode, reason }) => ({
        url: `/establishments/${sbrId}/contacts/${contactId}/tags/${encodeURIComponent(tagCode)}`,
        method: 'PUT',
        body: { reason: reason || null },
      }),
      invalidatesTags: ['ContactTags', 'Contacts', 'AuditLog'],
    }),
    untagContact: builder.mutation<ApiResponse<{ AUDIT_LOG_ID: number }>, { sbrId: number; contactId: number; tagCode: string; reason?: string }>({
      query: ({ sbrId, contactId, tagCode, reason }) => ({
        url: `/establishments/${sbrId}/contacts/${contactId}/tags/${encodeURIComponent(tagCode)}`,
        method: 'DELETE',
        body: { reason: reason || null },
      }),
      invalidatesTags: ['ContactTags', 'Contacts', 'AuditLog'],
    }),
    bulkTag: builder.mutation<ApiResponse<BulkTagResult>, { rows: BulkTagRow[]; dryRun: boolean; reason?: string }>({
      query: (body) => ({ url: '/contact-tags/bulk', method: 'POST', body }),
      // A dry run writes nothing, but invalidating is harmless and keeps one code path.
      invalidatesTags: ['ContactTags', 'Contacts', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetContactTagsQuery, useSaveContactTagMutation, useGetEstablishmentContactsQuery, useGetContactTagHistoryQuery,
  useTagContactMutation, useUntagContactMutation, useBulkTagMutation,
} = contactTagsApi;
