// Static reference lookups served by the backend's /lookups routes (SBR_LOOKUPS_API).
export interface LookupValue {
  CODE: string;
  DESCRIPTION: string | null;
}

// One row of GET /lookups/main-branches
export interface MainBranchEstablishment {
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  EST_STATUS: string | null;
  MAIN_BRANCH_FLG: string | null;
}
