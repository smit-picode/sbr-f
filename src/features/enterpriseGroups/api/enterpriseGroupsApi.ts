import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEnterpriseGroup, EnterpriseGroupFilters, EnterpriseGroupDetail } from '@/types';

export interface CreateEnterpriseGroupPayload {
  NAME_ENU?:            string | null;
  NAME_ARA?:            string | null;
  UCI_NAME?:            string | null;
  UCI_TYPE?:            string | null;
  UCI_COUNTRY?:         string | null;
  UCI_ID?:              string | null;
  ISIC_CODE?:           string | null;
  ISIC_DESCRIPTION?:    string | null;
  HOLDING_COMPANY_FLG?: string | null;
  STATUS?:              string | null;
  GROUP_START_DATE?:    string | null;
  memberEnterpriseIds?: number[];
  comment?:             string | null;
}

export interface UpdateEnterpriseGroupPayload extends CreateEnterpriseGroupPayload {
  addMemberEnterpriseIds?:    number[];
  removeMemberEnterpriseIds?: number[];
}

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
  useCreateEnterpriseGroupMutation,
  useUpdateEnterpriseGroupMutation,
} = enterpriseGroupsApi;
