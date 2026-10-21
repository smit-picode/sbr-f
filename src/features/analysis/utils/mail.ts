import type { TFunction } from 'i18next';
import type { AnalysisSchedule, AnalysisScheduleRequest } from '@/types';
import { ANALYSIS_SCHEDULE_DEFAULT_TIME, ANALYSIS_SCHEDULE_PAUSE_REASONS, ANALYSIS_SCHEDULE_WEEKDAYS } from '../constants';

// Schedules run on Doha time, so their moments are shown in it whatever the browser's zone.
export const formatDohaDateTime = (iso: string | null | undefined, locale: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale === 'ar' ? 'ar-QA' : 'en-GB', { timeZone: 'Asia/Qatar', dateStyle: 'medium', timeStyle: 'short' });
};

export const weekdayLabel = (t: TFunction, dow: number | null): string => {
  const day = ANALYSIS_SCHEDULE_WEEKDAYS.find((d) => d.value === dow);
  return day ? t(`analysis.email.weekdays.${day.key}`, { defaultValue: day.label }) : '';
};

// "Every Monday at 08:00", "Every day at 07:30", "Monthly on day 31 at 06:00".
export const scheduleSummary = (t: TFunction, s: Pick<AnalysisSchedule, 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'sendTime'>): string => {
  if (s.frequency === 'WEEKLY') {
    return t('analysis.email.summaryWeekly', { defaultValue: 'Every {{day}} at {{time}}', day: weekdayLabel(t, s.dayOfWeek), time: s.sendTime });
  }
  if (s.frequency === 'MONTHLY') {
    return t('analysis.email.summaryMonthly', { defaultValue: 'Monthly on day {{day}} at {{time}}', day: s.dayOfMonth, time: s.sendTime });
  }
  return t('analysis.email.summaryDaily', { defaultValue: 'Every day at {{time}}', time: s.sendTime });
};

export const pauseReasonLabel = (t: TFunction, reason: string | null): string =>
  t(`analysis.email.paused.${reason ?? 'PAUSED_BY_USER'}`, {
    defaultValue: ANALYSIS_SCHEDULE_PAUSE_REASONS[reason ?? 'PAUSED_BY_USER'] ?? ANALYSIS_SCHEDULE_PAUSE_REASONS.PAUSED_BY_USER,
  });

export const emptyScheduleRequest = (): AnalysisScheduleRequest => ({
  recipients: [],
  subject: '',
  message: '',
  includePdf: true,
  includeXlsx: true,
  frequency: 'WEEKLY',
  dayOfWeek: 7,
  dayOfMonth: null,
  sendTime: ANALYSIS_SCHEDULE_DEFAULT_TIME,
  isActive: true,
});

export const scheduleToRequest = (s: AnalysisSchedule, isActive = s.isActive): AnalysisScheduleRequest => ({
  recipients: s.recipients.map((r) => r.id),
  subject: s.subject ?? '',
  message: s.message ?? '',
  includePdf: s.includePdf,
  includeXlsx: s.includeXlsx,
  frequency: s.frequency,
  dayOfWeek: s.frequency === 'WEEKLY' ? s.dayOfWeek : null,
  dayOfMonth: s.frequency === 'MONTHLY' ? s.dayOfMonth : null,
  sendTime: s.sendTime,
  isActive,
});

export const apiErrorMessage = (err: unknown): string | undefined =>
  (err as { data?: { message?: string } } | undefined)?.data?.message;
