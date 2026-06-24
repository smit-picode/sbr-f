import { baseApi } from '@/services/api';
import type { ApiResponse, SbrContact, ContactFilters } from '@/types';

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
      providesTags: ['Contacts'],
    }),
    updateContact: builder.mutation<ApiResponse<SbrContact>, { id: number; data: Partial<SbrContact> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contacts', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetContactsListQuery, useGetContactByIdQuery, useGetContactHistoryQuery, useUpdateContactMutation } = contactsApi;
