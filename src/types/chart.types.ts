import type { ChartCategory, ChartSeries } from './analysis.types';

// ---------- trend ----------
export interface TrendSeries {
  name: string;
  data: (number | null)[];
  color?: string;
  area?: boolean;
  dashed?: boolean;
  endLabel?: boolean;
}

export interface TrendOptions {
  categories: string[];
  series: TrendSeries[];
  yMin?: number;
  yMax?: number;
  unit?: string;
  format?: (v: number) => string;
}

// ---------- donut ----------
export interface DonutItem { name: string; value: number; color?: string; }

export interface DonutOptions {
  items: DonutItem[];
  totalLabel?: string;
  legendWidth?: number;
  compact?: boolean;
}

// ---------- columns (vertical bars) ----------
export interface ColumnsSeries { name: string; data: number[]; color?: string; }

export interface ColumnsOptions {
  categories: string[];
  series: ColumnsSeries[];
  gradient?: boolean;
  labels?: boolean;
  right?: number;
  xFontSize?: number;
  greyIndex?: number;
}

// ---------- spark (compact trend line; hollow points mark values that are not reported) ----------
export interface SparkOptions {
  data: number[];
  categories: string[];
  color?: string;
  unit?: string;
  format?: (v: number) => string;
  solid?: boolean[];
}

// targetColumns: stacked columns with a target line, y max and unit.
export interface TargetColumnsOptions {
  categories: string[];
  series: ColumnsSeries[];
  stacked?: boolean;
  gradient?: boolean;
  labels?: boolean;
  yMax?: number;
  unit?: string;
  refLines?: { value: number; label: string; color?: string }[];
}

// ---------- gauge (ring 0..max) ----------
export interface GaugeOptions {
  value: number;
  max?: number;
  color?: string;
  width?: number;
  valueSize?: number;
  format?: (v: number) => string;
}

export interface BubbleAxisItem { key: string; label: string; sub?: string; }

export interface BubbleCell { row: string; col: string; size: number; value: number; label?: string; tip?: string; }

export interface BubbleGridOptions {
  rows: BubbleAxisItem[];
  cols: BubbleAxisItem[];
  cells: BubbleCell[];
  midpoint?: number;
  min?: number;
  max?: number;
  lowColor?: string;
  midColor?: string;
  highColor?: string;
  labelWidth?: number;
  maxBubble?: number;
}

// ---------- hbars (horizontal bars) ----------
export interface HBarItem { name: string; value: number; color?: string; sub?: string; }

export interface HBarsSingleOptions {
  items: HBarItem[];
  unit?: string;
  max?: number;
  barWidth?: number;
  labelWidth?: number;
  share?: boolean;
  refLines?: { value: number; label: string; color?: string }[];
  axis?: boolean;
}

export interface HBarsStackedOptions {
  categories: string[];
  series: { name: string; data: number[]; color?: string }[];
  barWidth?: number;
  labelWidth?: number;
}

// ---------- pareto ----------
export interface ParetoItem { name: string; value: number; color?: string; }

export interface ParetoOptions {
  items: ParetoItem[];
  valueLabel?: string;
  cumLabel?: string;
  rotate?: number;
  labelWidth?: number;
}

export interface QatarMapOptions {
  byMunicipality: Record<string, number>;
  unitLabel?: string;
  unitLabelOne?: string;
  color?: string;
  nameMap?: Record<string, string>;
}

export type EChartOption = Record<string, unknown>;

// A function option is used when the layout genuinely needs the container's measured size
export type EChartOptionInput = EChartOption | ((width: number, height: number) => EChartOption);

export interface BarOpts {
  categories: ChartCategory[];
  series: ChartSeries[];
  horizontal: boolean;
  stacked: boolean;
  percent: boolean;
  showValues: boolean;
  animate?: boolean;
  compare?: boolean;
}

export interface ChartTreeNode { key: string | null; name: string; value: number; children?: ChartTreeNode[]; keys: (string | null)[] }

export interface ChartClickParams {
  name?: string;
  data?: { keys?: (string | null)[]; value?: number | null } | null;
  value?: number | null;
  event?: { event?: MouseEvent };
}
