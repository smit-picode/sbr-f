import { baseApi } from '@/services/api';
import type { ApiResponse, SbrContact, ContactFilters } from '@/types';

const validFromTime = (c: SbrContact): number => (c.VALID_FROM ? new Date(c.VALID_FROM).getTime() : 0);

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContactsList: builder.query<ApiResponse<SbrContact[]>, ContactFilters>({
      query: (params) => ({ url: '/contacts', params }),
      providesTags: ['Contacts'],
    }),
    getContactById: builder.query<ApiResponse<SbrContact>, number>({
      query: (id) => ({ url: `/contacts/${id}` }),
      providesTags: ['Contacts'],
    }),
    getContactHistory: builder.query<ApiResponse<SbrContact[]>, number>({
      query: (id) => ({ url: `/contacts/${id}/history` }),
      // Same-day edits share a VALID_FROM date, so break the tie on ID (a newer version always has a higher ID).
      transformResponse: (res: ApiResponse<SbrContact[]>) => ({
        ...res,
        data: res.data && [...res.data].sort((a, b) => validFromTime(b) - validFromTime(a) || b.ID - a.ID),
      }),
      providesTags: ['Contacts'],
    }),
    updateContact: builder.mutation<ApiResponse<SbrContact>, { id: number; data: Partial<SbrContact> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contacts', 'AuditLog', 'ChangeRequests'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetContactsListQuery, useGetContactByIdQuery, useGetContactHistoryQuery, useUpdateContactMutation } = contactsApi;
