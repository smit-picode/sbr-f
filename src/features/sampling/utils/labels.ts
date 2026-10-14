import type { TFunction } from 'i18next';
import type { SamplingField, SamplingGroup, SamplingNode } from '@/types';
import { valueLabel as analysisValueLabel } from '@/features/analysis/utils/labels';
import {
  SAMPLING_KEY_NULL, SAMPLING_LABELLED_VALUE_FIELDS, SAMPLING_LIST_OPERATORS, SAMPLING_NO_VALUE_OPERATORS,
  SAMPLING_OPERATOR_LABELS,
} from '../constants';

const humanize = (key: string) => {
  const s = key.toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Frame fields reuse the analysis module's names, register fields the establishment column names.
export function fieldLabel(t: TFunction, field: string, origin?: SamplingField['ORIGIN']): string {
  if (origin === 'register') return t(`columns.${field}`, { defaultValue: humanize(field) });
  return t(`analysis.fields.${field.toLowerCase()}`, { defaultValue: t(`columns.${field}`, { defaultValue: humanize(field) }) });
}

const CONTACT_COLUMN_LABELS: Record<string, string> = {
  SBR_ID: 'SBR ID', CONTACT_ID: 'Contact ID', CONTACT_NAME: 'Contact name', ROLE: 'Role', PHONE: 'Phone', MOBILE: 'Mobile',
  EMAIL: 'E-mail', FAX: 'Fax', PO_BOX: 'P.O. box', WEBSITE: 'Website', TAGS: 'Tags', IS_PRIMARY: 'Primary', MATCH: 'Why included',
};

export function contactColumnLabel(t: TFunction, column: string): string {
  return t(`sampling.contactColumns.${column}`, { defaultValue: CONTACT_COLUMN_LABELS[column] ?? humanize(column) });
}

export function groupMethodLabel(t: TFunction, method: string): string {
  return t(`sampling.groupMethod.${method}`, {
    defaultValue: method === 'random' ? 'Random sample' : method === 'census' ? 'Full population' : 'Hand-picked',
  });
}

export function unitLabel(t: TFunction, unit: string): string {
  return t(`sampling.unit.${unit}`, { defaultValue: unit === 'enterprise' ? 'Enterprises' : 'Establishments' });
}

export function operatorLabel(t: TFunction, op: string): string {
  return t(`sampling.op.${op}`, { defaultValue: SAMPLING_OPERATOR_LABELS[op] ?? op });
}

// SBR_SAMPLING_API names number bands '< a', 'a to < b' and '>= a'; the page words them per language.
const BAND_LT = /^< (-?[\d.]+)$/;
const BAND_RANGE = /^(-?[\d.]+) to < (-?[\d.]+)$/;
const BAND_GE = /^>= (-?[\d.]+)$/;

function bandLabel(t: TFunction, value: string): string | null {
  const num = (v: string) => Number(v).toLocaleString();
  let m = BAND_LT.exec(value);
  if (m) return t('sampling.band.lt', { defaultValue: 'under {{a}}', a: num(m[1]) });
  m = BAND_RANGE.exec(value);
  if (m) return t('sampling.band.range', { defaultValue: '{{a}} to under {{b}}', a: num(m[1]), b: num(m[2]) });
  m = BAND_GE.exec(value);
  if (m) return t('sampling.band.ge', { defaultValue: '{{a}} and over', a: num(m[1]) });
  return null;
}

// A stratum or filter value as people read it: section letters, size classes and bands get words.
export function valueLabel(t: TFunction, field: string, value: string | null): string {
  if (value == null || value === SAMPLING_KEY_NULL) return t('sampling.missing', { defaultValue: '(missing)' });
  const band = bandLabel(t, value);
  if (band) return band;
  if (SAMPLING_LABELLED_VALUE_FIELDS.includes(field)) return analysisValueLabel(t, field.toLowerCase(), value, true);
  if (value === 'Y') return t('sampling.yes', { defaultValue: 'Yes' });
  if (value === 'N') return t('sampling.no', { defaultValue: 'No' });
  return value;
}

// One readable line for a filter tree, for the export's settings sheet.
export function describeFilter(t: TFunction, node: SamplingNode, fields: SamplingField[]): string {
  const origin = (f: string) => fields.find((x) => x.FIELD_NAME === f)?.ORIGIN;
  if (node.kind === 'condition') {
    const name = fieldLabel(t, node.column, origin(node.column));
    if (SAMPLING_NO_VALUE_OPERATORS.includes(node.operator)) return `${name} ${operatorLabel(t, node.operator)}`;
    const value = SAMPLING_LIST_OPERATORS.includes(node.operator)
      ? node.values.map((v) => valueLabel(t, node.column, v)).join(', ')
      : node.operator === 'between' ? node.value.replace(',', ' – ') : valueLabel(t, node.column, node.value);
    return `${name} ${operatorLabel(t, node.operator)} ${value}`;
  }
  const parts = node.rules.map((r) => describeFilter(t, r, fields)).filter(Boolean);
  if (!parts.length) return '';
  const joined = parts.join(node.op === 'and' ? ` ${t('sampling.and', { defaultValue: 'AND' })} ` : ` ${t('sampling.or', { defaultValue: 'OR' })} `);
  const wrapped = parts.length > 1 ? `(${joined})` : joined;
  return node.not ? `${t('sampling.notPrefix', { defaultValue: 'NOT' })} ${wrapped}` : wrapped;
}

export function describeRootFilter(t: TFunction, root: SamplingGroup, fields: SamplingField[]): string {
  return describeFilter(t, root, fields) || t('sampling.wholeFrame', { defaultValue: 'The whole frame' });
}
