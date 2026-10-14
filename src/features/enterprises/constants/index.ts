import type { ColumnFilterOption } from '@/components/common/ColumnFilters';
// Field labels for the edit modal's validation summary.
export const ENTERPRISE_FIELD_LABELS: Record<string, string> = {
  NAME_ENU: 'Enterprise Name',
  SECTOR_ID: 'Sector',
  STATUS: 'Status',
};

export const ENTERPRISE_DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  sectorId: '',
} as const;

// Columns offered in the dynamic "Column filters" builder. `value` must match a key in
// the backend ENTERPRISE_FILTER_COLUMNS allow-list (enterprises.controller).
export const ENTERPRISE_FILTER_COLUMNS: ColumnFilterOption[] = [
  { value: 'ENTERPRISE_ID', label: 'Enterprise ID', type: 'number' },
  { value: 'NAME_ENU', label: 'Name (EN)' },
  { value: 'NAME_ARA', label: 'Name (AR)' },
  { value: 'STATUS', label: 'Status', pick: true },
  { value: 'SECTOR_ID', label: 'Sector', pick: true },
  { value: 'ISIC_CODE', label: 'ISIC code', pick: true },
  { value: 'LEGAL_TYPE', label: 'Legal type', pick: true },
  { value: 'PARENT_ENTITY_COUNTRY', label: 'Parent country', pick: true },
  { value: 'FOREIGN_CONTROLLED_FLG', label: 'Foreign controlled', pick: true },
  { value: 'MOCI_CR_NUM', label: 'Main CR' },
  { value: 'EMPLOYMENT_COUNT', label: 'Employment count', type: 'number' },
  { value: 'ESTABLISHMENT_COUNT', label: 'Number of establishments', type: 'number' },
  { value: 'ECON_ACTIVITY_START_DATE', label: 'Activity start date', type: 'date' },
];

export const ISIC_LABELS: Record<string, string> = {
  '0150': 'Mixed farming',
  '2599': 'Manufacture of other fabricated metal products',
  '4100': 'Construction of buildings',
  '4520': 'Maintenance and repair of motor vehicles',
  '4711': 'Retail sale in non-specialized stores',
  '4923': 'Freight transport by road',
  '5510': 'Short term accommodation activities',
  '5610': 'Restaurants and mobile food service activities',
  '5630': 'Beverage serving activities',
  '6201': 'Computer programming activities',
  '6420': 'Activities of holding companies',
  '6810': 'Real estate activities with own or leased property',
  '6820': 'Real estate activities on a fee or contract basis',
  '7110': 'Architectural and engineering activities and related technical consultancy',
  '8610': 'Hospital activities',
};

export const getIsicLabel = (code?: string | null): string => (code ? ISIC_LABELS[code] ?? '' : '');
