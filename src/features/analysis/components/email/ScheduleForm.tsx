'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisMailUser, AnalysisSchedule, AnalysisScheduleFrequency } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/utils/toast';
import { useSaveAnalysisScheduleMutation } from '../../api/analysisApi';
import { ANALYSIS_SCHEDULE_FREQUENCIES, ANALYSIS_SCHEDULE_WEEKDAYS } from '../../constants';
import { apiErrorMessage, emptyScheduleRequest, scheduleToRequest } from '../../utils/mail';
import { EmailContentFields, type EmailContent } from './EmailContentFields';
import { RecipientPicker } from './RecipientPicker';

const FREQUENCY_DEFAULTS: Record<AnalysisScheduleFrequency, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };
const DAYS_OF_MONTH: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

interface Props {
  analysisId: string;
  analysisName: string;
  schedule: AnalysisSchedule | null;
  onDone: () => void;
}

export function ScheduleForm({ analysisId, analysisName, schedule, onDone }: Props) {
  const { t } = useTranslation();
  const [save, { isLoading }] = useSaveAnalysisScheduleMutation();
  const initial = schedule ? scheduleToRequest(schedule) : emptyScheduleRequest();
  const [frequency, setFrequency] = useState<AnalysisScheduleFrequency>(initial.frequency);
  const [dayOfWeek, setDayOfWeek] = useState<number>(initial.dayOfWeek ?? 7);
  const [dayOfMonth, setDayOfMonth] = useState<number>(initial.dayOfMonth ?? 1);
  const [sendTime, setSendTime] = useState(initial.sendTime);
  const [recipients, setRecipients] = useState<AnalysisMailUser[]>(schedule?.recipients ?? []);
  const [content, setContent] = useState<EmailContent>({
    subject: initial.subject ?? '', message: initial.message ?? '', includePdf: initial.includePdf, includeXlsx: initial.includeXlsx,
  });

  const submit = async () => {
    const usable = recipients.filter((r) => r.hasAccess !== false);
    if (usable.length === 0) { toast.error(t('analysis.email.needRecipient', { defaultValue: 'Add at least one recipient.' })); return; }
    if (!content.includePdf && !content.includeXlsx) { toast.error(t('analysis.email.needAttachment', { defaultValue: 'Attach the PDF, the Excel workbook or both.' })); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sendTime)) { toast.error(t('analysis.email.badTime', { defaultValue: 'Choose a time.' })); return; }
    try {
      await save({
        id: analysisId,
        scheduleId: schedule?.id,
        body: {
          recipients: usable.map((r) => r.id),
          subject: content.subject.trim(),
          message: content.message.trim(),
          includePdf: content.includePdf,
          includeXlsx: content.includeXlsx,
          frequency,
          dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : null,
          dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : null,
          sendTime,
          isActive: true,
        },
      }).unwrap();
      toast.success(schedule
        ? t('analysis.email.scheduleUpdated', { defaultValue: 'Schedule saved.' })
        : t('analysis.email.scheduleCreated', { defaultValue: 'Schedule created.' }));
      onDone();
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? t('analysis.email.scheduleFailed', { defaultValue: 'The schedule could not be saved.' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>{t('analysis.email.frequency', { defaultValue: 'Frequency' })}</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as AnalysisScheduleFrequency)} disabled={isLoading}>
            <SelectTrigger className="h-9 text-sm shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANALYSIS_SCHEDULE_FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>{t(`analysis.email.frequencies.${f}`, { defaultValue: FREQUENCY_DEFAULTS[f] })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {frequency === 'WEEKLY' && (
          <div className="space-y-1">
            <Label>{t('analysis.email.weekday', { defaultValue: 'Day' })}</Label>
            <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))} disabled={isLoading}>
              <SelectTrigger className="h-9 text-sm shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANALYSIS_SCHEDULE_WEEKDAYS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>{t(`analysis.email.weekdays.${d.key}`, { defaultValue: d.label })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {frequency === 'MONTHLY' && (
          <div className="space-y-1">
            <Label>{t('analysis.email.monthDay', { defaultValue: 'Day of the month' })}</Label>
            <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))} disabled={isLoading}>
              <SelectTrigger className="h-9 text-sm shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS_OF_MONTH.map((d) => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="schedule-time">{t('analysis.email.time', { defaultValue: 'Time (Doha)' })}</Label>
          <Input
            id="schedule-time"
            type="time"
            value={sendTime}
            onChange={(e) => setSendTime(e.target.value)}
            disabled={isLoading}
            className="h-9 focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
          />
        </div>
      </div>
      {frequency === 'MONTHLY' && dayOfMonth > 28 && (
        <p className="text-[11.5px] text-slate-500">
          {t('analysis.email.lastDayNote', { defaultValue: 'In a month without day {{day}}, it is sent on the last day of the month.', day: dayOfMonth })}
        </p>
      )}
      <div className="space-y-1">
        <Label>{t('analysis.email.recipients', { defaultValue: 'Recipients' })}</Label>
        <RecipientPicker analysisId={analysisId} value={recipients} onChange={setRecipients} disabled={isLoading} />
      </div>
      <EmailContentFields
        value={content}
        onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
        subjectPlaceholder={analysisName}
        disabled={isLoading}
        idPrefix="schedule"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={isLoading}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button onClick={() => void submit()} loading={isLoading} disabled={isLoading}>
          {schedule ? t('analysis.email.saveSchedule', { defaultValue: 'Save schedule' }) : t('analysis.email.createSchedule', { defaultValue: 'Create schedule' })}
        </Button>
      </div>
    </div>
  );
}
