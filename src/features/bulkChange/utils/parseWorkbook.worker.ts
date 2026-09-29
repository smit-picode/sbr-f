import { parseWorkbook } from './parseWorkbook';

interface ParseRequest {
  file: File;
  idColumn: string;
  allowedColumns: string[];
}

self.onmessage = async (event: MessageEvent<ParseRequest>) => {
  const { file, idColumn, allowedColumns } = event.data;
  try {
    const result = await parseWorkbook(file, idColumn, allowedColumns);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
