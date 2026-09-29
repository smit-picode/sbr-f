import { parseWorkbook, type ParsedWorkbook } from './parseWorkbook';

// Reading a large workbook freezes the tab for seconds, so it runs in a worker; any worker failure retries on the main thread.
export const parseWorkbookInWorker = (
  file: File,
  idColumn: string,
  allowedColumns: string[],
): Promise<ParsedWorkbook> => {
  const parseOnMainThread = () => parseWorkbook(file, idColumn, allowedColumns);
  if (typeof Worker === 'undefined') return parseOnMainThread();

  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./parseWorkbook.worker.ts', import.meta.url));
    } catch {
      resolve(parseOnMainThread());
      return;
    }

    const fallBack = () => {
      worker.terminate();
      resolve(parseOnMainThread());
    };

    worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: ParsedWorkbook }>) => {
      if (!event.data.ok || !event.data.result) return fallBack();
      worker.terminate();
      resolve(event.data.result);
    };
    worker.onerror = fallBack;
    worker.onmessageerror = fallBack;
    worker.postMessage({ file, idColumn, allowedColumns });
  });
};
