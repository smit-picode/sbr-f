// Field Labels for error messages and form display
export const ADDRESS_FIELD_LABELS: Record<string, string> = {
  MUNICIPALITY_ID: 'Municipality ID',
  ZONE: 'Zone',
  STREET: 'Street',
  BUILDING_NO: 'Building No.',
  UNIT_NO: 'Unit No.',
  FLOOR_NO: 'Floor No.',
  QARS: 'QARS',
  ELECTRICITY_NO: 'Electricity No.',
  LONGITUDE: 'Longitude',
  LATITUDE: 'Latitude',
  PRIORITY: 'Priority',
  SOURCE_CODE: 'Source Code',
};

// Enum Options from backend
export const ADDRESS_SOURCE_CODE_OPTIONS: string[] = ['MOCI', 'QSTP', 'KRMA_QID', 'KRMA_OWNER', 'KRMA_ELEC', 'LEGACY_SBR'];

export const ADDRESS_DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  search: '',
  municipalityId: '',
  sourceCode: '',
} as const;
