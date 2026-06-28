import { baseApi } from '@/services/api';
import type { ApiResponse, SbrAddress, AddressFilters } from '@/types';

export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddressesList: builder.query<ApiResponse<SbrAddress[]>, AddressFilters>({
      query: (params) => ({ url: '/addresses', params }),
      providesTags: ['Addresses'],
    }),
    getAddressesBySbrId: builder.query<ApiResponse<SbrAddress[]>, number>({
      query: (sbrId) => `/addresses/${sbrId}`,
      providesTags: ['Addresses'],
    }),
    getAddressById: builder.query<ApiResponse<SbrAddress>, number>({
      query: (id) => ({ url: `/addresses/record/${id}` }),
      providesTags: ['Addresses'],
    }),
    getAddressHistory: builder.query<ApiResponse<SbrAddress[]>, number>({
      query: (id) => ({ url: `/addresses/record/${id}/history` }),
      providesTags: ['Addresses'],
    }),
    updateAddress: builder.mutation<ApiResponse<SbrAddress>, { id: number; data: Partial<SbrAddress> & { comment?: string } }>({
      query: ({ id, data }) => ({ url: `/addresses/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Addresses', 'AuditLog', 'ChangeRequests'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAddressesListQuery, useGetAddressesBySbrIdQuery, useGetAddressByIdQuery, useGetAddressHistoryQuery, useUpdateAddressMutation } = addressesApi;
