export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FRAME: '/frame',
  FRAME_DETAIL: (id: string | number) => `/frame/${id}`,
  CONTACTS: '/contacts',
  ADDRESSES: '/addresses',
} as const;
