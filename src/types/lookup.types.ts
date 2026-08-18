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
