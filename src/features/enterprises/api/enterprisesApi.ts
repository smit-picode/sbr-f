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

export const enterprisesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnterprisesList: builder.query<ApiResponse<SbrEnterprise[]>, EnterpriseFilters>({
      query: (params) => ({ url: '/enterprises', params }),
      providesTags: ['Enterprises'],
    }),
    getEnterpriseById: builder.query<ApiResponse<EnterpriseDetail>, number>({
      query: (enterpriseId) => ({ url: `/enterprises/${enterpriseId}` }),
      providesTags: ['Enterprises'],
    }),
    updateEnterprise: builder.mutation<ApiResponse<SbrEnterprise>, { enterpriseId: number; data: UpdateEnterprisePayload }>({
      query: ({ enterpriseId, data }) => ({ url: `/enterprises/${enterpriseId}`, method: 'PUT', body: data }),
      invalidatesTags: ['Enterprises', 'Establishments', 'AuditLog', 'ChangeRequests'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetEnterprisesListQuery, useGetEnterpriseByIdQuery, useUpdateEnterpriseMutation } = enterprisesApi;
