export * from './routes';
export * from './navigation';

export const APP_NAME = 'SBR Portal';
export const APP_DESCRIPTION = 'Statistical Business Register - NPC Qatar';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const EST_STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

export const SECTOR_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Private', value: 'Private' },
  { label: 'Mixed-Private', value: 'Mixed-Private' },
  { label: 'Mixed-Government', value: 'Mixed-Government' },
];

export const SOURCE_CODE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'MOCI', value: 'MOCI' },
  { label: 'QFC', value: 'QFC' },
  { label: 'QFZ', value: 'QFZ' },
  { label: 'QSTP', value: 'QSTP' },
  { label: 'MOM_FARM', value: 'MOM_FARM' },
];
