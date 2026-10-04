import type {
  AnalysisAgg,
  AnalysisBlockDisplay,
  AnalysisBlockType,
  AnalysisEntity,
  AnalysisFieldType,
  AnalysisFilterOp,
  AnalysisPercentMode,
  AnalysisSort,
} from '@/types';

export type AnalysisFieldGroup = 'unit' | 'activity' | 'size' | 'location' | 'contact' | 'enterprise' | 'group';

export interface AnalysisFieldDef {
  id: string;
  label: string;
  type: AnalysisFieldType;
  group: AnalysisFieldGroup;
  // Ordered domain for category fields whose order is meaningful (size classes, years…)
  order?: string[];
}

export const ANALYSIS_FIELD_GROUP_LABELS: Record<AnalysisFieldGroup, string> = {
  unit: 'Unit',
  activity: 'Economic activity',
  size: 'Size & employment',
  location: 'Location',
  contact: 'Contact details',
  enterprise: 'Enterprise',
  group: 'Enterprise group',
};

export const ANALYSIS_SIZE_CLASS_VALUES: string[] = ['micro', 'small', 'medium', 'large'];

export const ANALYSIS_SIZE_CLASS_LABELS: Record<string, string> = {
  micro: 'Micro (1–9)',
  small: 'Small (10–49)',
  medium: 'Medium (50–249)',
  large: 'Large (250+)',
};

export const ANALYSIS_FIELDS: Record<string, AnalysisFieldDef> = {
  sbr_id: { id: 'sbr_id', label: 'SBR ID', type: 'id', group: 'unit' },
  name: { id: 'name', label: 'Name', type: 'text', group: 'unit' },
  status: { id: 'status', label: 'Status', type: 'category', group: 'unit' },
  source: { id: 'source', label: 'Registration source', type: 'category', group: 'unit' },
  sector: { id: 'sector', label: 'Ownership sector', type: 'category', group: 'unit' },
  legal_type: { id: 'legal_type', label: 'Legal type', type: 'category', group: 'unit' },
  main_branch: { id: 'main_branch', label: 'Main / branch', type: 'category', group: 'unit' },
  reg_year: { id: 'reg_year', label: 'Registration year', type: 'category', group: 'unit' },

  isic_section: { id: 'isic_section', label: 'ISIC section', type: 'category', group: 'activity' },
  isic_division: { id: 'isic_division', label: 'ISIC division', type: 'category', group: 'activity' },
  isic_group: { id: 'isic_group', label: 'ISIC group', type: 'category', group: 'activity' },
  isic_class: { id: 'isic_class', label: 'ISIC class', type: 'category', group: 'activity' },

  employment: { id: 'employment', label: 'Employment', type: 'number', group: 'size' },
  size_class: { id: 'size_class', label: 'Size class', type: 'category', group: 'size', order: ANALYSIS_SIZE_CLASS_VALUES },
  turnover: { id: 'turnover', label: 'Annual turnover (QAR)', type: 'number', group: 'size' },

  municipality: { id: 'municipality', label: 'Municipality', type: 'category', group: 'location' },
  zone: { id: 'zone', label: 'Zone', type: 'category', group: 'location' },
  has_address: { id: 'has_address', label: 'Has address', type: 'boolean', group: 'location' },
  has_street: { id: 'has_street', label: 'Has street', type: 'boolean', group: 'location' },
  has_building: { id: 'has_building', label: 'Has building no.', type: 'boolean', group: 'location' },
  has_coordinates: { id: 'has_coordinates', label: 'Has coordinates', type: 'boolean', group: 'location' },
  address_id: { id: 'address_id', label: 'Address ID', type: 'id', group: 'location' },
  address_source: { id: 'address_source', label: 'Address source', type: 'category', group: 'location' },

  contact_id: { id: 'contact_id', label: 'Contact ID', type: 'id', group: 'contact' },
  role: { id: 'role', label: 'Contact role', type: 'category', group: 'contact' },
  contact_source: { id: 'contact_source', label: 'Contact source', type: 'category', group: 'contact' },
  has_phone: { id: 'has_phone', label: 'Has phone', type: 'boolean', group: 'contact' },
  has_mobile: { id: 'has_mobile', label: 'Has mobile', type: 'boolean', group: 'contact' },
  has_email: { id: 'has_email', label: 'Has email', type: 'boolean', group: 'contact' },
  has_website: { id: 'has_website', label: 'Has website', type: 'boolean', group: 'contact' },

  enterprise_id: { id: 'enterprise_id', label: 'Enterprise ID', type: 'id', group: 'enterprise' },
  foreign_ownership_pct: { id: 'foreign_ownership_pct', label: 'Foreign ownership %', type: 'number', group: 'enterprise' },
  foreign_controlled: { id: 'foreign_controlled', label: 'Foreign controlled', type: 'boolean', group: 'enterprise' },
  parent_country: { id: 'parent_country', label: 'Parent country', type: 'category', group: 'enterprise' },
  establishment_count: { id: 'establishment_count', label: 'Establishments', type: 'number', group: 'enterprise' },

  group_id: { id: 'group_id', label: 'Group ID', type: 'id', group: 'group' },
  in_group: { id: 'in_group', label: 'Part of a group', type: 'boolean', group: 'group' },
  group_type: { id: 'group_type', label: 'Group type', type: 'category', group: 'group' },
  uci_country: { id: 'uci_country', label: 'UCI country', type: 'category', group: 'group' },
  multinational: { id: 'multinational', label: 'Multinational', type: 'boolean', group: 'group' },
  enterprise_count: { id: 'enterprise_count', label: 'Enterprises', type: 'number', group: 'group' },
};

// Pseudo-dimension: one bucket per frame, for trends across frozen frames.
export const ANALYSIS_FRAME_DIMENSION = '__frame';

export interface AnalysisEntityDef {
  id: AnalysisEntity;
  label: string;
  unitLabel: string;
  icon: string;
  idField: string;
  fields: string[];
  defaultColumns: string[];
}

const EST_CORE = ['sbr_id', 'name', 'status', 'source', 'sector', 'legal_type', 'main_branch', 'reg_year', 'isic_section', 'isic_division', 'isic_group', 'isic_class', 'employment', 'size_class'];

export const ANALYSIS_ENTITIES: Record<AnalysisEntity, AnalysisEntityDef> = {
  establishments: {
    id: 'establishments',
    label: 'Establishments',
    unitLabel: 'establishments',
    icon: 'Building2',
    idField: 'sbr_id',
    fields: [
      ...EST_CORE,
      'municipality', 'zone', 'has_address', 'has_coordinates',
      'has_phone', 'has_email', 'has_website',
      'enterprise_id', 'turnover', 'foreign_controlled', 'parent_country',
      'group_id', 'in_group', 'group_type', 'uci_country', 'multinational',
    ],
    defaultColumns: ['sbr_id', 'name', 'status', 'isic_section', 'municipality', 'employment'],
  },
  enterprises: {
    id: 'enterprises',
    label: 'Enterprises',
    unitLabel: 'enterprises',
    icon: 'Layers',
    idField: 'enterprise_id',
    fields: [
      'enterprise_id', 'name', 'status', 'sector', 'legal_type', 'reg_year',
      'isic_section', 'isic_division', 'isic_group', 'isic_class',
      'employment', 'size_class', 'turnover', 'establishment_count',
      'foreign_ownership_pct', 'foreign_controlled', 'parent_country', 'municipality',
      'group_id', 'in_group', 'group_type', 'uci_country', 'multinational',
    ],
    defaultColumns: ['enterprise_id', 'name', 'isic_section', 'employment', 'establishment_count', 'turnover'],
  },
  enterpriseGroups: {
    id: 'enterpriseGroups',
    label: 'Enterprise groups',
    unitLabel: 'groups',
    icon: 'Network',
    idField: 'group_id',
    fields: [
      'group_id', 'name', 'status', 'group_type', 'uci_country', 'multinational', 'foreign_controlled',
      'reg_year', 'isic_section', 'isic_division', 'employment', 'size_class', 'turnover',
      'enterprise_count', 'establishment_count',
    ],
    defaultColumns: ['group_id', 'name', 'group_type', 'uci_country', 'enterprise_count', 'employment'],
  },
  contacts: {
    id: 'contacts',
    label: 'Contacts',
    unitLabel: 'contacts',
    icon: 'Users',
    idField: 'contact_id',
    fields: [
      'contact_id', 'role', 'contact_source', 'has_phone', 'has_mobile', 'has_email', 'has_website',
      'sbr_id', 'name', 'status', 'source', 'sector', 'isic_section', 'isic_division', 'size_class', 'municipality',
    ],
    defaultColumns: ['contact_id', 'sbr_id', 'name', 'role', 'has_phone', 'has_email'],
  },
  addresses: {
    id: 'addresses',
    label: 'Addresses',
    unitLabel: 'addresses',
    icon: 'MapPin',
    idField: 'address_id',
    fields: [
      'address_id', 'municipality', 'zone', 'has_street', 'has_building', 'has_coordinates', 'address_source',
      'sbr_id', 'name', 'status', 'source', 'sector', 'isic_section', 'isic_division', 'size_class',
    ],
    defaultColumns: ['address_id', 'sbr_id', 'name', 'municipality', 'zone', 'has_coordinates'],
  },
};

export const ANALYSIS_ENTITY_ORDER: AnalysisEntity[] = ['establishments', 'enterprises', 'enterpriseGroups', 'contacts', 'addresses'];

// Parent -> child level for click-to-drill.
export const ANALYSIS_DRILL_PATHS: Record<string, string> = {
  isic_section: 'isic_division',
  isic_division: 'isic_group',
  isic_group: 'isic_class',
  municipality: 'zone',
};

export interface AnalysisAggDef {
  id: AnalysisAgg;
  label: string;
  short: string;
  numeric: boolean;
}

export const ANALYSIS_AGGS: AnalysisAggDef[] = [
  { id: 'count', label: 'Count of units', short: 'Count', numeric: false },
  { id: 'count_distinct', label: 'Distinct count', short: 'Distinct', numeric: false },
  { id: 'sum', label: 'Sum', short: 'Sum', numeric: true },
  { id: 'avg', label: 'Average', short: 'Avg', numeric: true },
  { id: 'median', label: 'Median', short: 'Median', numeric: true },
  { id: 'min', label: 'Minimum', short: 'Min', numeric: true },
  { id: 'max', label: 'Maximum', short: 'Max', numeric: true },
];

export const ANALYSIS_FILTER_OPS: Record<AnalysisFilterOp, string> = {
  in: 'is',
  not_in: 'is not',
  between: 'between',
  contains: 'contains',
  empty: 'is empty',
  not_empty: 'is not empty',
};

export const ANALYSIS_SORT_OPTIONS: { value: AnalysisSort; label: string }[] = [
  { value: 'value_desc', label: 'Largest first' },
  { value: 'value_asc', label: 'Smallest first' },
  { value: 'key_asc', label: 'A → Z' },
  { value: 'key_desc', label: 'Z → A' },
];

export const ANALYSIS_LIMIT_OPTIONS: (number | null)[] = [5, 10, 15, 20, 50, null];

export const ANALYSIS_PERCENT_OPTIONS: { value: AnalysisPercentMode; label: string }[] = [
  { value: 'none', label: 'Values' },
  { value: 'total', label: '% of total' },
  { value: 'row', label: '% of row' },
  { value: 'column', label: '% of column' },
];

export type AnalysisBlockCategory = 'numbers' | 'charts' | 'tables' | 'geo' | 'comparison' | 'quality' | 'narrative';

export const ANALYSIS_BLOCK_CATEGORY_LABELS: Record<AnalysisBlockCategory, string> = {
  numbers: 'Numbers',
  charts: 'Charts',
  tables: 'Tables',
  geo: 'Geography',
  comparison: 'Frame comparison',
  quality: 'Data quality',
  narrative: 'Narrative',
};

export interface AnalysisBlockTypeDef {
  type: AnalysisBlockType;
  label: string;
  description: string;
  icon: string;
  category: AnalysisBlockCategory;
  minDims: number;
  maxDims: number;
  needsCompare: boolean;
  // Blocks whose data points can be clicked to cross-filter / drill / list records
  interactive: boolean;
}

export const ANALYSIS_BLOCK_TYPES: AnalysisBlockTypeDef[] = [
  { type: 'kpi', label: 'KPI', description: 'Headline numbers with change and trend', icon: 'Gauge', category: 'numbers', minDims: 0, maxDims: 0, needsCompare: false, interactive: false },
  { type: 'bar', label: 'Bar', description: 'Rank categories side by side', icon: 'ChartBarBig', category: 'charts', minDims: 1, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'column', label: 'Column', description: 'Compare categories, stacked or grouped', icon: 'ChartColumnBig', category: 'charts', minDims: 1, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'line', label: 'Trend', description: 'Evolution across frozen frames', icon: 'ChartLine', category: 'charts', minDims: 0, maxDims: 1, needsCompare: false, interactive: true },
  { type: 'donut', label: 'Donut', description: 'Share of a whole', icon: 'ChartPie', category: 'charts', minDims: 1, maxDims: 1, needsCompare: false, interactive: true },
  { type: 'treemap', label: 'Treemap', description: 'Nested proportions, e.g. ISIC hierarchy', icon: 'LayoutDashboard', category: 'charts', minDims: 1, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'sunburst', label: 'Sunburst', description: 'Two-level breakdown as rings', icon: 'Sun', category: 'charts', minDims: 2, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'map', label: 'Qatar map', description: 'Choropleth by municipality', icon: 'Map', category: 'geo', minDims: 1, maxDims: 1, needsCompare: false, interactive: true },
  { type: 'pivot', label: 'Pivot table', description: 'Cross-tab with totals and percentages', icon: 'Table2', category: 'tables', minDims: 1, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'heatmap', label: 'Heatmap', description: 'Cross-tab with colour-scaled cells', icon: 'Grid3x3', category: 'tables', minDims: 2, maxDims: 2, needsCompare: false, interactive: true },
  { type: 'records', label: 'Records', description: 'The underlying units, exportable as is', icon: 'Rows3', category: 'tables', minDims: 0, maxDims: 0, needsCompare: false, interactive: false },
  { type: 'delta', label: 'Change by category', description: 'What grew and what shrank between frames', icon: 'ArrowUpDown', category: 'comparison', minDims: 1, maxDims: 1, needsCompare: true, interactive: true },
  { type: 'waterfall', label: 'Waterfall', description: 'Start + births − deaths ± reclassified = end', icon: 'ChartNoAxesColumnIncreasing', category: 'comparison', minDims: 0, maxDims: 0, needsCompare: true, interactive: false },
  { type: 'sankey', label: 'Flows', description: 'How units moved between categories', icon: 'Workflow', category: 'comparison', minDims: 1, maxDims: 1, needsCompare: true, interactive: false },
  { type: 'completeness', label: 'Completeness grid', description: '% of units with each field filled', icon: 'ShieldCheck', category: 'quality', minDims: 0, maxDims: 1, needsCompare: false, interactive: true },
  { type: 'text', label: 'Commentary', description: 'Headings and narrative text', icon: 'Type', category: 'narrative', minDims: 0, maxDims: 0, needsCompare: false, interactive: false },
];

export const ANALYSIS_BLOCK_TYPE_MAP: Record<AnalysisBlockType, AnalysisBlockTypeDef> = Object.fromEntries(
  ANALYSIS_BLOCK_TYPES.map((b) => [b.type, b])
) as Record<AnalysisBlockType, AnalysisBlockTypeDef>;

export const ANALYSIS_DEFAULT_DISPLAY: AnalysisBlockDisplay = {
  showValues: true,
  stacked: false,
  percent: 'none',
  showTotals: true,
  sparkline: true,
};

// Disclosure control: confidential if fewer than minCell units, or one unit holds > dominance of a sum.
export const ANALYSIS_DISCLOSURE = {
  minCell: 3,
  dominance: 0.85,
};

export const ANALYSIS_LIST_HREF = '/snapshots/analysis';
export const ANALYSIS_QUICK_ADD: AnalysisBlockType[] = ['kpi', 'bar', 'map', 'pivot', 'records', 'text'];
export const ANALYSIS_RECORDS_PAGE_SIZE = 25;
export const ANALYSIS_BAR_ROW_HEIGHT = 26;
export const ANALYSIS_BAR_SCROLL_HEIGHT = 560;
export const ANALYSIS_EXPORT_ROW_LIMIT = 200000;
export const ANALYSIS_OTHER_KEY = '__other__';
export const ANALYSIS_STORAGE_KEY = 'sbr_analyses_v2';
export const ANALYSIS_MAX_MEASURES = 4;

export const ANALYSIS_PERMISSIONS = {
  view: 'analysis.view',
  edit: 'analysis.edit',
  exportUnsuppressed: 'analysis.export_unsuppressed',
};

export const ISIC_SECTION_LABELS: Record<string, string> = {
  A: 'Agriculture, forestry & fishing',
  B: 'Mining & quarrying',
  C: 'Manufacturing',
  D: 'Electricity & gas',
  E: 'Water & waste',
  F: 'Construction',
  G: 'Wholesale & retail trade',
  H: 'Transport & storage',
  I: 'Accommodation & food',
  J: 'Information & communication',
  K: 'Finance & insurance',
  L: 'Real estate',
  M: 'Professional & scientific',
  N: 'Administrative & support',
  O: 'Public administration',
  P: 'Education',
  Q: 'Health & social work',
  R: 'Arts & recreation',
  S: 'Other services',
  T: 'Households as employers',
  U: 'Extraterritorial bodies',
};

export const ISIC_SECTION_LABELS_AR: Record<string, string> = {
  A: 'الزراعة والحراجة وصيد الأسماك',
  B: 'التعدين واستغلال المحاجر',
  C: 'الصناعة التحويلية',
  D: 'الكهرباء والغاز',
  E: 'المياه والنفايات',
  F: 'التشييد',
  G: 'تجارة الجملة والتجزئة',
  H: 'النقل والتخزين',
  I: 'الإقامة والطعام',
  J: 'المعلومات والاتصالات',
  K: 'المال والتأمين',
  L: 'الأنشطة العقارية',
  M: 'الأنشطة المهنية والعلمية',
  N: 'الخدمات الإدارية والدعم',
  O: 'الإدارة العامة',
  P: 'التعليم',
  Q: 'الصحة والعمل الاجتماعي',
  R: 'الفنون والترفيه',
  S: 'الخدمات الأخرى',
  T: 'الأسر المعيشية كأصحاب عمل',
  U: 'الهيئات الخارجية',
};

export const ANALYSIS_SIZE_CLASS_LABELS_AR: Record<string, string> = {
  micro: 'متناهية الصغر (1–9)',
  small: 'صغيرة (10–49)',
  medium: 'متوسطة (50–249)',
  large: 'كبيرة (250+)',
};

// Flow (births/deaths) pseudo-categories.
export const FLOW_NEW = '__new__';
export const FLOW_CEASED = '__ceased__';
export const FLOW_OUTSIDE = '__outside__';

