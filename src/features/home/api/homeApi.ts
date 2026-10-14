import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';

// Mirrors sbr-backend's TEMPORARY raw-SQL home controller (src/controllers/home/home.controller.ts)
export interface ExecutiveSummary {
  sizeClass: { category: string | null; count: number }[];
  registerGrowthByMonth: { year: number; month: number; count: number }[];
  registerGrowthBySource: { year: number; month: number; dimension: string | null; count: number }[];
  registerGrowthBySector: { year: number; month: number; dimension: string | null; count: number }[];
  growthPct: number | null;
  frameGrowth: { startCount: number; endCount: number; net: number; pct: number | null } | null;
  activeEstablishmentCount: number;
  totalEstablishmentCount: number;
  enterpriseCount: number;
  activeEnterpriseGroupCount: number;
  enterpriseGroupCount: number;
  sectorBreakdown: { sector: string | null; count: number }[];
  municipalityBreakdown: { municipality: string; count: number }[];
  employmentByActivity: { section: string; employees: number }[];
  sourceSectorBreakdown: { source: string | null; sector: string | null; count: number }[];
}

export interface HomeDecisionCounts {
  pending: number;
  approved: number;
  rejected: number;
}

// The caller's own change requests: 'manual' were made on a record page, 'bulk' came from a bulk change file.
export interface StewardSummary {
  windowDays: number;
  counts: { manual: HomeDecisionCounts; bulk: HomeDecisionCounts };
  recent: {
    id: number;
    tableName: string;
    recordId: number | null;
    operation: string | null;
    status: string;
    createdAt: string;
    decidedAt: string | null;
    decidedBy: string | null;
    reason: string | null;
  }[];
  batches: {
    id: number;
    code: string | null;
    entityType: string;
    fileName: string | null;
    submittedAt: string;
    recordCount: number;
    changeCount: number;
    status: string;
    pending: number;
    approved: number;
    rejected: number;
  }[];
}

export interface ReviewerSummary {
  queue: { tableName: string; channel: 'manual' | 'bulk'; pending: number; oldestAt: string }[];
  oldest: {
    id: number;
    tableName: string;
    recordId: number | null;
    operation: string | null;
    requestedBy: string | null;
    createdAt: string;
  }[];
  batches: {
    id: number;
    code: string | null;
    entityType: string;
    submittedBy: string | null;
    submittedAt: string;
    pending: number;
    changeCount: number;
  }[];
  pendingBatches: number;
  decidedLast7Days: number;
}

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveSummary: builder.query<ApiResponse<ExecutiveSummary>, void>({
      query: () => ({ url: '/home/executive-summary' }),
    }),
    getStewardSummary: builder.query<ApiResponse<StewardSummary>, void>({
      query: () => ({ url: '/home/steward-summary' }),
      providesTags: ['ChangeRequests', 'BulkChange'],
    }),
    getReviewerSummary: builder.query<ApiResponse<ReviewerSummary>, void>({
      query: () => ({ url: '/home/reviewer-summary' }),
      providesTags: ['ChangeRequests', 'BulkChange'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetExecutiveSummaryQuery, useGetStewardSummaryQuery, useGetReviewerSummaryQuery } = homeApi;
