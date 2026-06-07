import { FileSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NoDataProps {
  message?: string;
  description?: string;
}

export function NoData({ message, description }: NoDataProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <FileSearch className="h-6 w-6 text-slate-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{message ?? t('table.noRecords')}</p>
        <p className="text-xs text-slate-500 mt-1">{description ?? t('table.noRecordsDesc')}</p>
      </div>
    </div>
  );
}
