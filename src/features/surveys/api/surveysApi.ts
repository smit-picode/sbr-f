import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';
import type {
  SurveyGvaApi,
  SurveyId,
  SurveyParticipationApiRow,
  SurveyResponseApiRow,
  SurveyResponseDetailApi,
  SurveyResponsesFilter,
  SurveySampleApiRow,
} from '../types';

export const surveysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurveySamples: builder.query<ApiResponse<SurveySampleApiRow[]>, void>({
      query: () => ({ url: '/surveys/samples' }),
      providesTags: ['Surveys'],
    }),
    getSurveyResponses: builder.query<ApiResponse<SurveyResponseApiRow[]>, SurveyResponsesFilter>({
      query: (params) => ({ url: '/surveys/responses', params }),
      providesTags: ['Surveys'],
    }),
    getSurveyResponseDetail: builder.query<ApiResponse<SurveyResponseDetailApi>, { sbrId: number; surveyId: SurveyId; period: string }>({
      query: ({ sbrId, surveyId, period }) => ({ url: `/surveys/responses/${sbrId}`, params: { surveyId, period } }),
      providesTags: ['Surveys'],
    }),
    getSurveyParticipation: builder.query<ApiResponse<SurveyParticipationApiRow[]>, number>({
      query: (sbrId) => ({ url: `/surveys/establishments/${sbrId}/participation` }),
      providesTags: ['Surveys'],
    }),
    // Establishment detail: its AES accounts and the national totals behind its GVA contribution.
    getSurveyGva: builder.query<ApiResponse<SurveyGvaApi>, number>({
      query: (sbrId) => ({ url: `/surveys/establishments/${sbrId}/gva` }),
      providesTags: ['Surveys'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSurveySamplesQuery,
  useGetSurveyResponsesQuery,
  useGetSurveyResponseDetailQuery,
  useGetSurveyParticipationQuery,
  useGetSurveyGvaQuery,
} = surveysApi;
