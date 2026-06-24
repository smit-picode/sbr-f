export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LEGAL_UNITS: '/establishments',
  LEGAL_UNIT_DETAIL: (id: string | number) => `/establishments/${id}`,
  CONTACTS: '/contacts',
  ADDRESSES: '/addresses',
} as const;
