import { baseApi } from '@/services/api';
import type { ApiResponse, SbrContact, ContactFilters, CreateContactInput, CreateContactResult } from '@/types';

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
    // NPC-330: created immediately (no approval), so every contact view refreshes at once.
    createContact: builder.mutation<ApiResponse<CreateContactResult>, CreateContactInput>({
      query: (body) => ({ url: '/contacts', method: 'POST', body }),
      invalidatesTags: ['Contacts', 'ContactTags', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetContactsListQuery, useGetContactByIdQuery, useGetContactHistoryQuery, useUpdateContactMutation,
  useCreateContactMutation,
} = contactsApi;
