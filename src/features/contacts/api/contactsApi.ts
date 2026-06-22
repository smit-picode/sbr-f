import { baseApi } from '@/services/api';
import type { ApiResponse, SbrContact, ContactFilters } from '@/types';

// _permission is stripped from query params and sent as x-required-permission header instead.
// This lets the backend enforce the exact permission the frontend is using for each call.
type ContactsListArg = ContactFilters & { _permission?: string };

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContactsList: builder.query<ApiResponse<SbrContact[]>, ContactsListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/contacts',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['Contacts'],
      // Exclude _permission from the RTK Query cache key so toggling
      // search on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
    }),
    updateContact: builder.mutation<ApiResponse<SbrContact>, { id: number; data: Partial<SbrContact> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Contacts', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetContactsListQuery, useUpdateContactMutation } = contactsApi;
