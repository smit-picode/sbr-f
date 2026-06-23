import { baseApi } from '@/services/api';
import type { ApiResponse, SbrContact, ContactFilters } from '@/types';

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContactsList: builder.query<ApiResponse<SbrContact[]>, ContactFilters>({
      query: (params) => ({ url: '/contacts', params }),
      providesTags: ['Contacts'],
    }),
    updateContact: builder.mutation<ApiResponse<SbrContact>, { id: number; data: Partial<SbrContact> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contacts', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetContactsListQuery, useUpdateContactMutation } = contactsApi;
