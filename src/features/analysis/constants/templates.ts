import type { AnalysisBlock, AnalysisFilter } from '@/types';
import { countMeasure, createBlock, uid } from '../utils/blocks';

export interface AnalysisTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  compareTo: string | null;
  filters: AnalysisFilter[];
  build: () => AnalysisBlock[];
}

const sum = (field: string) => ({ id: uid('m'), agg: 'sum' as const, field });
const avg = (field: string) => ({ id: uid('m'), agg: 'avg' as const, field });

function registerOverview(): AnalysisBlock[] {
  return [
    createBlock('kpi', 'establishments', { title: 'The register at a glance', width: 'full', query: { ...createBlock('kpi').query, measures: [countMeasure(), sum('employment'), avg('employment')] } }),
    createBlock('bar', 'establishments', { title: 'Establishments by economic activity', subtitle: 'ISIC Rev.4 sections — click a bar to drill into divisions' }),
    createBlock('map', 'establishments', { title: 'Where establishments are located' }),
    createBlock('column', 'establishments', { title: 'Size structure by registration source', query: { ...createBlock('column').query, dimensions: ['size_class', 'source'] } }),
    createBlock('donut', 'establishments', { title: 'Registration sources' }),
    createBlock('line', 'establishments', { title: 'Register growth across frames', width: 'full' }),
  ];
}

function frameComparison(): AnalysisBlock[] {
  return [
    createBlock('kpi', 'establishments', { title: 'Headline change', width: 'full', query: { ...createBlock('kpi').query, measures: [countMeasure(), sum('employment')] } }),
    createBlock('waterfall', 'establishments', { title: 'From start frame to end frame' }),
    createBlock('delta', 'establishments', { title: 'Change by economic activity' }),
    createBlock('sankey', 'establishments', { title: 'Size-class migration', subtitle: 'Units that changed size class, entered or left the register' }),
  ];
}

function qualityCheck(): AnalysisBlock[] {
  const missing = (field: string): AnalysisFilter => ({ id: uid('f'), field, op: 'empty' });
  return [
    createBlock('completeness', 'establishments', { title: 'Field completeness by registration source' }),
    createBlock('bar', 'establishments', { title: 'Units without an ISIC code, by municipality', query: { ...createBlock('bar').query, dimensions: ['municipality'], filters: [missing('isic_section')] } }),
    createBlock('bar', 'establishments', { title: 'Units without employment, by activity', query: { ...createBlock('bar').query, filters: [missing('employment')] } }),
    createBlock('records', 'establishments', { title: 'Active units with no ISIC code', query: { ...createBlock('records').query, filters: [missing('isic_section'), { id: uid('f'), field: 'status', op: 'in', values: ['Active'] }] } }),
  ];
}

function groupsLandscape(): AnalysisBlock[] {
  return [
    createBlock('kpi', 'enterpriseGroups', { title: 'Enterprise groups', width: 'full', query: { ...createBlock('kpi', 'enterpriseGroups').query, measures: [countMeasure(), sum('employment'), sum('enterprise_count')] } }),
    createBlock('donut', 'enterpriseGroups', { title: 'Groups by type', query: { ...createBlock('donut', 'enterpriseGroups').query, dimensions: ['group_type'] } }),
    createBlock('bar', 'enterpriseGroups', { title: 'Foreign-controlled groups by UCI country', query: { ...createBlock('bar', 'enterpriseGroups').query, dimensions: ['uci_country'], filters: [{ id: uid('f'), field: 'group_type', op: 'not_in', values: ['Domestic'] }] } }),
    createBlock('treemap', 'enterpriseGroups', { title: 'Group employment by principal activity', width: 'full', query: { ...createBlock('treemap', 'enterpriseGroups').query, measures: [sum('employment')] } }),
  ];
}

function statisticalTables(): AnalysisBlock[] {
  return [
    createBlock('text', 'establishments', { text: '# Establishments by municipality and activity\n\nCounts of establishments in the live frame. Cells built from fewer than 3 units are confidential and suppressed on export.' }),
    createBlock('heatmap', 'establishments', { title: 'Establishments by activity × municipality' }),
    createBlock('pivot', 'establishments', { title: 'Employment by municipality and size class', width: 'full', query: { ...createBlock('pivot').query, measures: [sum('employment')] } }),
  ];
}

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  { id: 'overview', name: 'Register overview', description: 'Headline KPIs, activity, geography, size and growth', icon: 'LayoutDashboard', compareTo: 'f-2026-04', filters: [], build: registerOverview },
  { id: 'comparison', name: 'Frame vs frame', description: 'Births, deaths and migrations between two frames', icon: 'ArrowRightLeft', compareTo: 'f-2026-04', filters: [], build: frameComparison },
  { id: 'quality', name: 'Data quality check', description: 'Completeness grid and lists of units to fix', icon: 'ShieldCheck', compareTo: null, filters: [], build: qualityCheck },
  { id: 'tables', name: 'Statistical tables', description: 'Publication-style cross-tabs with disclosure control', icon: 'Table2', compareTo: null, filters: [], build: statisticalTables },
  { id: 'groups', name: 'Enterprise groups', description: 'Group types, foreign control and employment', icon: 'Network', compareTo: null, filters: [], build: groupsLandscape },
];
