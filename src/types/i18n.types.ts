
export interface Translations {
  nav: {
    establishments: string;
    contacts: string;
    addresses: string;
    auditLog: string;
  };
  pageBanner: Record<string, string>;
  pages: {
    frame: { title: string; description: string };
    contacts: { title: string; description: string };
    addresses: { title: string; description: string };
    auditLog: { title: string; description: string };
  };
  filters: {
    searchByName: string;
    searchByContact: string;
    searchByAddress: string;
    filterByRecordId: string;
    status: string;
    sector: string;
    source: string;
    allTables: string;
    reset: string;
  };
  table: {
    showing: string;
    to: string;
    of: string;
    records: string;
    rowsPerPage: string;
    page: string;
    noRecords: string;
    noRecordsDesc: string;
    loadError: string;
    loadErrorDesc: string;
    retry: string;
    loading: string;
  };
  actions: {
    edit: string;
    cancel: string;
    saveChanges: string;
    confirmSave: string;
    saving: string;
    signOut: string;
    signingOut: string;
    profile: string;
  };
  comment: {
    title: string;
    description: string;
    label: string;
    required: string;
    placeholder: string;
  };
  login: {
    title: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    branding: string;
    brandingSub: string;
    brandingCountry: string;
    copyright: string;
  };
}
