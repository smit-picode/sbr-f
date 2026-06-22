import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEnterprise, EnterpriseFilters, EnterpriseDetail } from '@/types';

export interface UpdateEnterprisePayload {
  NAME_ENU?: string;
  SECTOR_ID?: string;
  STATUS?: string;
  addEstablishmentSbrIds?: number[];
  removeEstablishmentSbrIds?: number[];
  comment?: string;
}

// _permission is stripped from query params and sent as x-required-permission header instead,
// so the backend enforces the exact permission the frontend is using for each call.
type EnterprisesListArg = EnterpriseFilters & { _permission?: string };

export const enterprisesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnterprisesList: builder.query<ApiResponse<SbrEnterprise[]>, EnterprisesListArg>({
      query: ({ _permission, ...params }) => ({
        url: '/enterprises',
        params,
        headers: _permission ? { 'x-required-permission': _permission } : {},
      }),
      providesTags: ['Enterprises'],
      // Exclude _permission from the RTK Query cache key so toggling
      // search on/off doesn't create duplicate cache entries.
      serializeQueryArgs: ({ queryArgs: { _permission: _p, ...rest } }) => rest,
    }),
    getEnterpriseById: builder.query<ApiResponse<EnterpriseDetail>, number>({
      query: (enterpriseId) => ({ url: `/enterprises/${enterpriseId}` }),
      providesTags: ['Enterprises'],
    }),
    updateEnterprise: builder.mutation<ApiResponse<SbrEnterprise>, { enterpriseId: number; data: UpdateEnterprisePayload }>({
      query: ({ enterpriseId, data }) => ({ url: `/enterprises/${enterpriseId}`, method: 'PUT', body: data }),
      invalidatesTags: ['Enterprises', 'LegalUnits', 'AuditLog'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetEnterprisesListQuery, useGetEnterpriseByIdQuery, useUpdateEnterpriseMutation } = enterprisesApi;
