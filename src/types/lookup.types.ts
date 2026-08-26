// Static reference lookups served by the backend's /lookups routes (SBR_LOOKUPS_API).
// Every procedure in that package returns the same two-column CODE / DESCRIPTION shape,
// so one row type covers them all.
export interface LookupValue {
  // The literal value stored on the entity column (e.g. SbrEstablishment.EST_STATUS_CATEGORY).
  CODE: string;
  // Display text. Identical to CODE for the status-category list today, but kept separate so
  // the label can diverge from the stored value later without a frontend change.
  DESCRIPTION: string | null;
}

// One row of GET /lookups/main-branches (NPC-222) — every active main-branch establishment,
// for the Edit Establishment "Main Branch SBR ID" picker. A different shape from LookupValue's
// CODE/DESCRIPTION pair, so it gets its own type.
export interface MainBranchEstablishment {
  SBR_ID: number;
  NAME_ENU: string | null;
  NAME_ARA: string | null;
  EST_STATUS: string | null;
  MAIN_BRANCH_FLG: string | null;
}
