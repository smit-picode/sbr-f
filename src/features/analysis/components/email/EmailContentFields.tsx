'use client';

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ANALYSIS_MAIL_MESSAGE_MAX_LENGTH, ANALYSIS_MAIL_SUBJECT_MAX_LENGTH } from '../../constants';

export interface EmailContent {
  subject: string;
  message: string;
  includePdf: boolean;
  includeXlsx: boolean;
}

interface Props {
  value: EmailContent;
  onChange: (patch: Partial<EmailContent>) => void;
  subjectPlaceholder: string;
  disabled?: boolean;
  idPrefix: string;
}

// Subject, note and attachments, shared by "Send now" and the schedule form.
export function EmailContentFields({ value, onChange, subjectPlaceholder, disabled, idPrefix }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-subject`}>{t('analysis.email.subject', { defaultValue: 'Subject' })}</Label>
        <Input
          id={`${idPrefix}-subject`}
          value={value.subject}
          maxLength={ANALYSIS_MAIL_SUBJECT_MAX_LENGTH}
          placeholder={subjectPlaceholder}
          onChange={(e) => onChange({ subject: e.target.value })}
          disabled={disabled}
          className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-message`}>{t('analysis.email.message', { defaultValue: 'Note (optional)' })}</Label>
        <textarea
          id={`${idPrefix}-message`}
          value={value.message}
          maxLength={ANALYSIS_MAIL_MESSAGE_MAX_LENGTH}
          rows={3}
          onChange={(e) => onChange({ message: e.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20 disabled:opacity-60"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-700">{t('analysis.email.attachments', { defaultValue: 'Attach' })}</p>
        <div className="flex flex-wrap gap-5">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700">
            <Checkbox checked={value.includePdf} onCheckedChange={(c) => onChange({ includePdf: c === true })} disabled={disabled} />
            {t('analysis.email.pdf', { defaultValue: 'PDF of the report' })}
          </label>
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700">
            <Checkbox checked={value.includeXlsx} onCheckedChange={(c) => onChange({ includeXlsx: c === true })} disabled={disabled} />
            {t('analysis.email.xlsx', { defaultValue: 'Excel workbook' })}
          </label>
        </div>
        <p className="text-[11.5px] text-slate-500">
          {t('analysis.email.suppressionNote', { defaultValue: 'Attachments always have statistical disclosure control applied, whatever your own export rights.' })}
        </p>
      </div>
    </div>
  );
}
