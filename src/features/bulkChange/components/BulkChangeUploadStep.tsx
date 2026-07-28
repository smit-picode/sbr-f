'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import { toast } from '@/utils/toast';
import { BULK_CHANGE_TABLES, type BulkChangeTableKey } from '../constants';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

interface BulkChangeUploadStepProps {
  selectedTable: BulkChangeTableKey;
  file: File | null;
  onFileSelected: (file: File | null) => void;
}

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BulkChangeUploadStep({ selectedTable, file, onFileSelected }: BulkChangeUploadStepProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tableOption = BULK_CHANGE_TABLES.find((o) => o.key === selectedTable);
  const tableLabel = tableOption ? t(tableOption.navKey, { defaultValue: tableOption.label }) : selectedTable;

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (!picked) return;
    if (!isAcceptedFile(picked)) {
      toast.error(
        t('bulkChange.wizard.upload.unsupportedFile', {
          defaultValue: 'Unsupported file type. Please upload an .xlsx, .xls or .csv file.',
        })
      );
      return;
    }
    onFileSelected(picked);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-800">{t('bulkChange.wizard.upload.title', { defaultValue: 'Upload your file' })}</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        {t('bulkChange.wizard.upload.description', { defaultValue: 'Upload the Excel file with your updates for {{table}}.', table: tableLabel })}
      </p>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
            isDragOver ? 'border-[#A71D3A] bg-[#A71D3A]/5' : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            {t('bulkChange.wizard.upload.dragDrop', { defaultValue: 'Drag and drop your file here, or click to browse' })}
          </p>
          <p className="text-xs text-slate-400">
            {t('bulkChange.wizard.upload.acceptedFormats', { defaultValue: 'Accepted formats: .xlsx, .xls, .csv' })}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelected(null)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            aria-label={t('bulkChange.wizard.upload.removeFile', { defaultValue: 'Remove file' })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
