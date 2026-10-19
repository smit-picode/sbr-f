'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileUp, RotateCcw } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/utils/toast';
import { useHasPermission } from '@/hooks/usePermission';
import { parseWorkbook, WorkbookParseError } from '@/features/bulkChange/utils/parseWorkbook';
import { useBulkTagMutation } from '../api/contactTagsApi';
import type { BulkTagResult, BulkTagRow } from '@/types';

// Tags contacts from a file; checked first, then applied all or nothing.

const ID_COLUMN = 'SBR_ID';
const COLUMNS = ['TAG_CODE', 'CONTACT_ID', 'EMAIL', 'PHONE', 'CONTACT_NAME'];
const MAX_ROWS = 5000;

const str = (v: string | number | null | undefined) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim());

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  TAG: 'info', CREATE_AND_TAG: 'warning', ALREADY: 'secondary', ERROR: 'destructive',
  TAGGED: 'success', MOVED: 'success', CREATED_TAGGED: 'success', CREATED_MOVED: 'success', CREATED_ALREADY: 'success',
};

async function downloadTemplate() {
  const ExcelJs = (await import('exceljs')) as unknown as { default?: typeof import('exceljs') } & typeof import('exceljs');
  const Lib = ExcelJs.default ?? ExcelJs;
  const wb = new Lib.Workbook();
  const sheet = wb.addWorksheet('Tags');
  sheet.addRow([ID_COLUMN, ...COLUMNS]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => { c.width = 22; });
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contact_tags_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export function TagUploadPage() {
  const { t } = useTranslation();
  const canTag = useHasPermission('contacts.tag');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BulkTagRow[]>([]);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<BulkTagResult | null>(null);
  const [parseError, setParseError] = useState('');
  const [bulkTag, { isLoading }] = useBulkTagMutation();

  if (!canTag) {
    return (
      <PageContainer>
        <div className="rounded-lg bg-white p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
        </div>
      </PageContainer>
    );
  }

  const reset = () => {
    setFileName(''); setRows([]); setResult(null); setParseError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const run = async (dryRun: boolean, input: BulkTagRow[] = rows) => {
    try {
      const res = await bulkTag({ rows: input, dryRun, reason: reason.trim() || undefined }).unwrap();
      if (!res.data) return;
      setResult(res.data);
      if (!dryRun && res.data.ok) toast.success(t('contactTags.upload.applied', { count: res.data.rows.length }));
      else if (!res.data.ok) toast.warning(t('contactTags.upload.hasErrors'));
    } catch (error) {
      toast.error((error as { data?: { message?: string } })?.data?.message ?? t('contactTags.upload.failed'));
    }
  };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;
    setFileName(file.name);
    try {
      const parsed = await parseWorkbook(file, ID_COLUMN, COLUMNS);
      if (parsed.missingIdColumn) { setParseError(t('contactTags.upload.missingId')); return; }
      if (parsed.unknownHeaders.length) {
        setParseError(t('contactTags.upload.unknownHeaders', { headers: parsed.unknownHeaders.join(', ') }));
        return;
      }
      if (parsed.items.length === 0) { setParseError(t('contactTags.upload.empty')); return; }
      if (parsed.items.length > MAX_ROWS) { setParseError(t('contactTags.upload.tooMany', { max: MAX_ROWS })); return; }
      const mapped: BulkTagRow[] = parsed.items.map((item) => {
        const d = item.changeData;
        const contactId = Number(d.CONTACT_ID);
        return {
          rowNumber: item.rowNumber,
          SBR_ID: item.id,
          TAG_CODE: (str(d.TAG_CODE) ?? '').toUpperCase(),
          CONTACT_ID: Number.isInteger(contactId) && contactId > 0 ? contactId : null,
          EMAIL: str(d.EMAIL),
          PHONE: str(d.PHONE),
          CONTACT_NAME: str(d.CONTACT_NAME),
        };
      });
      // Rows the server would reject wholesale (schema) are reported here instead, by row.
      const bad = mapped.filter((r) => !r.SBR_ID || !r.TAG_CODE || (!r.CONTACT_ID && !r.EMAIL));
      if (bad.length) {
        setParseError(t('contactTags.upload.incompleteRows', { rows: bad.slice(0, 20).map((r) => r.rowNumber).join(', ') }));
        return;
      }
      setRows(mapped);
      await run(true, mapped);
    } catch (error) {
      setParseError(error instanceof WorkbookParseError ? error.message : t('contactTags.upload.unreadable'));
    }
  };

  const counts = (result?.rows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] ?? 0) + 1;
    return acc;
  }, {});
  const applied = result && !result.dryRun && result.ok;

  return (
    <PageContainer>
      <PageHeader
        title={t('contactTags.upload.title')}
        description={t('contactTags.upload.description')}
        actions={(
          <Button variant="outline" className="gap-1.5" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> {t('contactTags.upload.template')}
          </Button>
        )}
      />

      <div className="rounded-lg bg-white p-4 shadow-card space-y-4">
        <p className="text-[12.5px] text-slate-500">{t('contactTags.upload.howTo')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>{t('contactTags.upload.file')}</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="block text-[12.5px] file:me-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-[12px]"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
          <div className="min-w-[260px] flex-1 space-y-1">
            <Label>{t('contactTags.upload.reason')}</Label>
            <Input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
          </div>
          {fileName && (
            <Button variant="ghost" className="gap-1.5" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> {t('contactTags.upload.reset')}
            </Button>
          )}
        </div>
        {parseError && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{parseError}</p>}
      </div>

      {result && (
        <div className="rounded-lg bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {applied ? t('contactTags.upload.resultTitle') : t('contactTags.upload.planTitle')}
            </h2>
            {Object.entries(counts).map(([action, n]) => (
              <Badge key={action} variant={ACTION_VARIANT[action] ?? 'secondary'}>{`${t(`contactTags.upload.actions.${action}`, { defaultValue: action })}: ${n}`}</Badge>
            ))}
            {result.dryRun && result.ok && (
              <Button className="ms-auto gap-1.5" loading={isLoading} onClick={() => run(false)}>
                <FileUp className="h-4 w-4" /> {t('contactTags.upload.apply', { count: rows.length })}
              </Button>
            )}
          </div>
          {!result.ok && <p className="px-4 pt-3 text-xs text-red-600">{t('contactTags.upload.nothingWritten')}</p>}
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('contactTags.upload.row')}</TableHead>
                  <TableHead>SBR_ID</TableHead>
                  <TableHead>TAG_CODE</TableHead>
                  <TableHead>CONTACT_ID</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>{t('contactTags.upload.action')}</TableHead>
                  <TableHead>{t('contactTags.upload.message')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((r) => (
                  <TableRow key={`${r.rowNumber}-${r.TAG_CODE}`}>
                    <TableCell className="tabular-nums">{r.rowNumber}</TableCell>
                    <TableCell className="font-mono text-[12px]">{r.SBR_ID}</TableCell>
                    <TableCell className="font-mono text-[12px]">{r.TAG_CODE}</TableCell>
                    <TableCell className="font-mono text-[12px]">{r.CONTACT_ID ?? ''}</TableCell>
                    <TableCell className="text-[12px]">{r.EMAIL ?? ''}</TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[r.action] ?? 'secondary'}>{t(`contactTags.upload.actions.${r.action}`, { defaultValue: r.action })}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-500">{r.message ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
