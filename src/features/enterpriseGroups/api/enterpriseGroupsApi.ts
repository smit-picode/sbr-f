import { baseApi } from '@/services/api';
import type { ApiResponse, SbrEnterpriseGroup, EnterpriseGroupFilters, EnterpriseGroupDetail } from '@/types';

export interface CreateEnterpriseGroupPayload {
  NAME_ENU?:              string | null;
  NAME_ARA?:              string | null;
  UCI_NAME?:              string | null;
  UCI_TYPE?:              string | null;
  UCI_COUNTRY?:           string | null;
  UCI_IDENTIFIER?:        string | null;
  PRINCIPAL_ISIC_2DIGIT?: string | null;
  HOLDING_COMPANY_FLG?:   string | null;
  STATUS?:                string | null;
  GROUP_START_DATE?:      string | null;
  GROUP_HEAD_ENTERPRISE_ID?: number | null;
  memberEnterpriseIds?:   number[];
  comment?:               string | null;
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
