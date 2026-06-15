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

export const en: Translations = {
  nav: {
    establishments: 'Legal Units',
    contacts: 'Contacts',
    addresses: 'Addresses',
    auditLog: 'Audit Log',
  },
  pageBanner: {
    frame:      'Legal Units Management',
    contacts:   'Contacts Management',
    addresses:  'Addresses Management',
    auditLog:   'Audit Log',
  },
  pages: {
    frame: {
      title: 'Legal Units',
      description: 'Statistical Business Register — Legal Unit records',
    },
    contacts: {
      title: 'Contacts',
      description: 'Business contacts associated with registered Legal Units',
    },
    addresses: {
      title: 'Addresses',
      description: 'Physical address records linked to registered Legal Units',
    },
    auditLog: {
      title: 'Audit Log',
      description: 'Track all data changes across Legal Units, Contacts and Addresses',
    },
  },
  filters: {
    searchByName: 'Search by name...',
    searchByContact: 'Search by name, email, or phone...',
    searchByAddress: 'Search by zone, street, or QARS...',
    filterByRecordId: 'Filter by Record ID...',
    status: 'Status',
    sector: 'Sector',
    source: 'Source',
    allTables: 'All Tables',
    reset: 'Reset',
  },
  table: {
    showing: 'Showing',
    to: 'to',
    of: 'of',
    records: 'records',
    rowsPerPage: 'Rows per page:',
    page: 'Page',
    noRecords: 'No records found',
    noRecordsDesc: 'Try adjusting your search or filter criteria.',
    loadError: 'Something went wrong',
    loadErrorDesc: 'Failed to load data. Please try again.',
    retry: 'Retry',
    loading: 'Loading...',
  },
  actions: {
    edit: 'Edit',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    confirmSave: 'Confirm & Save',
    saving: 'Saving...',
    signOut: 'Sign Out',
    profile: 'Profile',
  },
  comment: {
    title: 'Add Change Comment',
    description: 'Provide a reason or description for this change. This will be stored in the Audit Log.',
    label: 'Comment',
    required: 'Comment is required before saving.',
    placeholder: 'e.g. Corrected legal unit name based on trade license...',
  },
  login: {
    title: 'Login',
    email: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    branding: 'Statistical Business Register',
    brandingSub: 'National Planning Council',
    brandingCountry: 'State of Qatar',
    copyright: 'National Planning Council — Qatar',
  },
};
