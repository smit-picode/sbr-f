import type { SourceCatalogRecord, SourceRegulator } from '@/types';
import { SOURCE_REGULATOR_ORDER } from '../constants';

const orderOf = (code: string): number => {
  const i = SOURCE_REGULATOR_ORDER.indexOf(code);
  return i === -1 ? SOURCE_REGULATOR_ORDER.length : i;
};

export const groupSourceCatalog = (rows: SourceCatalogRecord[]): SourceRegulator[] => {
  const byCode = new Map<string, SourceRegulator>();
  for (const row of rows) {
    const reg = byCode.get(row.SOURCE_NAME) ?? { code: row.SOURCE_NAME, name: row.SOURCE_DESC, tables: [] };
    reg.name = reg.name ?? row.SOURCE_DESC;
    reg.tables.push({ name: row.TABLE_NAME, description: row.TABLE_DESC });
    byCode.set(row.SOURCE_NAME, reg);
  }
  return Array.from(byCode.values()).sort((a, b) => orderOf(a.code) - orderOf(b.code) || a.code.localeCompare(b.code));
};
