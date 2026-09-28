import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';
import type {
  SurveyId,
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
  }),
  overrideExisting: false,
});

export const { useGetSurveySamplesQuery, useGetSurveyResponsesQuery, useGetSurveyResponseDetailQuery } = surveysApi;
