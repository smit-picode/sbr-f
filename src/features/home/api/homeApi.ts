import { baseApi } from '@/services/api';
import type { ApiResponse } from '@/types';

// Mirrors sbr-backend's TEMPORARY raw-SQL home controller (src/controllers/home/home.controller.ts)
// — everything here goes away once a real SBR_HOME_API / SBR_ESTABLISHMENTS_API summary
// procedure exists.
export interface ExecutiveSummary {
  sizeClass: { category: string | null; count: number }[];
  registerGrowthByMonth: { year: number; month: number; count: number }[];
  registerGrowthBySource: { year: number; month: number; dimension: string | null; count: number }[];
  registerGrowthBySector: { year: number; month: number; dimension: string | null; count: number }[];
  growthPct: number | null;
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

export const homeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutiveSummary: builder.query<ApiResponse<ExecutiveSummary>, void>({
      query: () => ({ url: '/home/executive-summary' }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetExecutiveSummaryQuery } = homeApi;
