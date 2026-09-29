import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';
import type {
  SurveyGdpApi,
  SurveyId,
  SurveyParticipationApiRow,
  SurveyResponseApiRow,
  SurveyResponseDetailApi,
  SurveyResponsesFilter,
  SurveySampleApiRow,
} from '../types';

export const surveysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // One row per survey period.
    getSurveySamples: builder.query<ApiResponse<SurveySampleApiRow[]>, void>({
      query: () => ({ url: '/surveys/samples' }),
      providesTags: ['Surveys'],
    }),
    // Sampled establishments, optionally narrowed to one survey or one survey period.
    getSurveyResponses: builder.query<ApiResponse<SurveyResponseApiRow[]>, SurveyResponsesFilter>({
      query: (params) => ({ url: '/surveys/responses', params }),
      providesTags: ['Surveys'],
    }),
    // One establishment's membership in a survey period, plus its answers.
    getSurveyResponseDetail: builder.query<ApiResponse<SurveyResponseDetailApi>, { sbrId: number; surveyId: SurveyId; period: string }>({
      query: ({ sbrId, surveyId, period }) => ({ url: `/surveys/responses/${sbrId}`, params: { surveyId, period } }),
      providesTags: ['Surveys'],
    }),
    // Establishment detail: every survey period it was sampled in.
    getSurveyParticipation: builder.query<ApiResponse<SurveyParticipationApiRow[]>, number>({
      query: (sbrId) => ({ url: `/surveys/establishments/${sbrId}/participation` }),
      providesTags: ['Surveys'],
    }),
    // Establishment detail: its AES accounts and the national totals behind its GDP contribution.
    getSurveyGdp: builder.query<ApiResponse<SurveyGdpApi>, number>({
      query: (sbrId) => ({ url: `/surveys/establishments/${sbrId}/gdp` }),
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
  useGetSurveyGdpQuery,
} = surveysApi;
