import { parseWorkbook } from './parseWorkbook';
import type { ParseRequest } from '@/features/bulkChange/types';

self.onmessage = async (event: MessageEvent<ParseRequest>) => {
  const { file, idColumn, allowedColumns } = event.data;
  try {
    const result = await parseWorkbook(file, idColumn, allowedColumns);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
