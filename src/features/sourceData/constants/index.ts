export const SOURCE_REGULATOR_ORDER: string[] = ['MOCI', 'MOI', 'QFC', 'QFZ', 'QSTP', 'MOM'];

export const SOURCE_REGULATOR_COLOR: Record<string, string> = {
  MOCI: '#A29374',
  MOI: '#030F1F',
  QFC: '#0D4261',
  QFZ: '#129B82',
  QSTP: '#8A1538',
  MOM: '#8067A4',
};

export const SOURCE_REGULATOR_FALLBACK_COLOR = '#64748B';

export const SOURCE_TABLE_DEFAULT_PAGE_SIZE: number = 10;

// Only regulator SRC_ tables open in the viewer: they carry column masking, the STG_ copies do not.
export const SOURCE_BROWSABLE_TABLE_PREFIX: string = 'SRC_';
export const isBrowsableSourceTable = (table: string): boolean => table.toUpperCase().startsWith(SOURCE_BROWSABLE_TABLE_PREFIX);
