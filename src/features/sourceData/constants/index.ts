// Display order of the regulator cards; any source not listed here follows alphabetically.
export const SOURCE_REGULATOR_ORDER: string[] = ['MOCI', 'MOI', 'QFC', 'QFZ', 'QSTP', 'MOM'];

// One clearly different hue per regulator so no two cards look alike: gold, navy, teal, maroon, purple (MOI: near-black).
export const SOURCE_REGULATOR_COLOR: Record<string, string> = {
  MOCI: '#A29374',
  MOI: '#030F1F',
  QFC: '#0D4261',
  QFZ: '#129B82',
  QSTP: '#8A1538',
  MOM: '#8067A4',
};

export const SOURCE_REGULATOR_FALLBACK_COLOR = '#64748B';
