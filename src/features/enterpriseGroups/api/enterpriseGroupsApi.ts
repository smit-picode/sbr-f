import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEnterpriseGroup, EnterpriseGroupFilters, EnterpriseGroupDetail, CreateEnterpriseGroupPayload, UpdateEnterpriseGroupPayload } from '@/types';

export const enterpriseGroupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnterpriseGroupsList: builder.query<ApiResponse<SbrEnterpriseGroup[]>, EnterpriseGroupFilters>({
      query: (params) => ({ url: '/enterprise-groups', params }),
      providesTags: ['EnterpriseGroups'],
    }),
    getEnterpriseGroupById: builder.query<ApiResponse<EnterpriseGroupDetail>, number>({
      query: (id) => ({ url: `/enterprise-groups/${id}` }),
      providesTags: ['EnterpriseGroups'],
    }),
    getEnterpriseGroupHistory: builder.query<ApiResponse<SbrEnterpriseGroup[]>, number>({
      query: (id) => ({ url: `/enterprise-groups/${id}/history` }),
      providesTags: ['EnterpriseGroups'],
    }),
    createEnterpriseGroup: builder.mutation<ApiResponse<SbrEnterpriseGroup>, CreateEnterpriseGroupPayload>({
      query: (data) => ({ url: '/enterprise-groups', method: 'POST', body: data }),
      invalidatesTags: ['EnterpriseGroups', 'Enterprises', 'AuditLog', 'ChangeRequests'],
    }),
    updateEnterpriseGroup: builder.mutation<ApiResponse<SbrEnterpriseGroup>, { id: number; data: UpdateEnterpriseGroupPayload }>({
      query: ({ id, data }) => ({ url: `/enterprise-groups/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['EnterpriseGroups', 'Enterprises', 'AuditLog', 'ChangeRequests'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEnterpriseGroupsListQuery,
  useGetEnterpriseGroupByIdQuery,
  useGetEnterpriseGroupHistoryQuery,
  useCreateEnterpriseGroupMutation,
  useUpdateEnterpriseGroupMutation,
} = enterpriseGroupsApi;
