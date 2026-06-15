export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LEGAL_UNITS: '/legal-units',
  LEGAL_UNIT_DETAIL: (id: string | number) => `/legal-units/${id}`,
  CONTACTS: '/contacts',
  ADDRESSES: '/addresses',
} as const;
