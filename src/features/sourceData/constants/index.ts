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

export const SOURCE_TABLE_SEARCH_DEBOUNCE_MS: number = 400;

// Column-name patterns that pick the search box's default column: a name column, English unless the query is Arabic.
export const SOURCE_SEARCH_NAME_PATTERN: RegExp = /NAME/i;
export const SOURCE_SEARCH_ARABIC_COLUMN_PATTERN: RegExp = /(_AR|_ARA|_A)$/i;
export const SOURCE_SEARCH_ENGLISH_COLUMN_PATTERN: RegExp = /(_EN|_ENU|_E)$/i;
export const ARABIC_TEXT_PATTERN: RegExp = /[؀-ۿ]/;

// A query shaped like a MOCI CR number (10001, 10001/1) searches the table's CR column instead of the name.
export const CR_NUMBER_QUERY_PATTERN: RegExp = /^\d+(\/\d*)?$/;
export const SOURCE_SEARCH_CR_COLUMN_PATTERN: RegExp = /(^|_)CR_(NUM|ID)$/i;

// Only regulator SRC_ tables open in the viewer: they carry column masking, the STG_ copies do not.
export const SOURCE_BROWSABLE_TABLE_PREFIX: string = 'SRC_';
export const isBrowsableSourceTable = (table: string): boolean => table.toUpperCase().startsWith(SOURCE_BROWSABLE_TABLE_PREFIX);
