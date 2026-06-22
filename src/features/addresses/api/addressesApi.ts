import { baseApi } from '@/services/api';
import type { ApiResponse, SbrAddress, AddressFilters } from '@/types';

// _permission is stripped from query params and sent as x-required-permission header instead.
// This lets the backend enforce the exact permission the frontend is using for each call.
type AddressesListArg = AddressFilters & { _permission?: string };

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddressesList: builder.query<ApiResponse<SbrAddress[]>, AddressesListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/addresses',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['Addresses'],
      // Exclude _permission from the RTK Query cache key so toggling
      // search on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
    }),
    getAddressesBySbrId: builder.query<ApiResponse<SbrAddress[]>, number>({
      query: (sbrId) => `/addresses/${sbrId}`,
      providesTags: ['Addresses'],
    }),
    updateAddress: builder.mutation<ApiResponse<SbrAddress>, { id: number; data: Partial<SbrAddress> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/addresses/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Addresses', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAddressesListQuery, useGetAddressesBySbrIdQuery, useUpdateAddressMutation } = addressesApi;
