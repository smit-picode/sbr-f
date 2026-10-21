'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Pause, Pencil, Play, Plus, Send, Trash2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisMailUser, AnalysisSchedule, AnalysisSend } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n';
import { toast } from '@/utils/toast';
import {
  useDeleteAnalysisScheduleMutation, useGetAnalysisRecipientsQuery, useGetAnalysisSchedulesQuery, useGetAnalysisSendsQuery,
  useSaveAnalysisScheduleMutation, useSendAnalysisEmailMutation,
} from '../../api/analysisApi';
import { apiErrorMessage, formatDohaDateTime, pauseReasonLabel, scheduleSummary, scheduleToRequest } from '../../utils/mail';
import { EmailContentFields, type EmailContent } from './EmailContentFields';
import { RecipientPicker } from './RecipientPicker';
import { ScheduleForm } from './ScheduleForm';

// While a send is still being prepared, the history is re-read this often.
const SENDS_POLL_MS = 5000;

interface Props {
  open: boolean;
  analysis: Analysis;
  onClose: () => void;
}

const EMPTY_CONTENT: EmailContent = { subject: '', message: '', includePdf: true, includeXlsx: true };

function SendStatus({ send }: { send: AnalysisSend }) {
  const { t } = useTranslation();
  if (send.status === 'SENT') return <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{t('analysis.email.statusSent', { defaultValue: 'Sent' })}</span>;
  if (send.status === 'FAILED') return <span className="inline-flex items-center gap-1 text-red-600" title={send.error ?? undefined}><XCircle className="h-3.5 w-3.5" />{t('analysis.email.statusFailed', { defaultValue: 'Failed' })}</span>;
  return <span className="inline-flex items-center gap-1 text-amber-600"><Clock className="h-3.5 w-3.5" />{t('analysis.email.statusPending', { defaultValue: 'Sending…' })}</span>;
}

export function EmailAnalysisDialog({ open, analysis, onClose }: Props) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [tab, setTab] = useState<'send' | 'schedules'>('send');
  const [recipients, setRecipients] = useState<AnalysisMailUser[]>([]);
  const [content, setContent] = useState<EmailContent>(EMPTY_CONTENT);
  const [editing, setEditing] = useState<AnalysisSchedule | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data: directory } = useGetAnalysisRecipientsQuery({ id: analysis.id }, { skip: !open });
  const mailEnabled = directory?.data?.mailEnabled ?? true;
  const { data: sendsData, isLoading: sendsLoading } = useGetAnalysisSendsQuery(analysis.id, { skip: !open });
  const sends = sendsData?.data ?? [];
  const pending = sends.some((s) => s.status === 'PENDING');
  useGetAnalysisSendsQuery(analysis.id, { skip: !open || !pending, pollingInterval: SENDS_POLL_MS });
  const { data: schedulesData, isLoading: schedulesLoading } = useGetAnalysisSchedulesQuery(analysis.id, { skip: !open });
  const schedules = schedulesData?.data ?? [];

  const [sendEmail, { isLoading: sending }] = useSendAnalysisEmailMutation();
  const [saveSchedule, { isLoading: toggling }] = useSaveAnalysisScheduleMutation();
  const [deleteSchedule, { isLoading: deleting }] = useDeleteAnalysisScheduleMutation();

  const close = () => {
    setRecipients([]);
    setContent(EMPTY_CONTENT);
    setEditing(null);
    setConfirmDelete(null);
    setTab('send');
    onClose();
  };

  const send = async (to: AnalysisMailUser[], c: EmailContent) => {
    if (to.length === 0) { toast.error(t('analysis.email.needRecipient', { defaultValue: 'Add at least one recipient.' })); return false; }
    if (!c.includePdf && !c.includeXlsx) { toast.error(t('analysis.email.needAttachment', { defaultValue: 'Attach the PDF, the Excel workbook or both.' })); return false; }
    try {
      await sendEmail({
        id: analysis.id,
        body: { recipients: to.map((r) => r.id), subject: c.subject.trim(), message: c.message.trim(), includePdf: c.includePdf, includeXlsx: c.includeXlsx },
      }).unwrap();
      toast.success(t('analysis.email.queued', { defaultValue: 'The analysis is being prepared and will be emailed in a moment.' }));
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? t('analysis.email.sendFailed', { defaultValue: 'The email could not be sent.' }));
      return false;
    }
  };

  const sendNow = async () => {
    if (await send(recipients, content)) {
      setRecipients([]);
      setContent(EMPTY_CONTENT);
    }
  };

  const toggle = async (s: AnalysisSchedule) => {
    try {
      await saveSchedule({ id: analysis.id, scheduleId: s.id, body: scheduleToRequest(s, !s.isActive) }).unwrap();
      toast.success(s.isActive
        ? t('analysis.email.schedulePaused', { defaultValue: 'Schedule paused.' })
        : t('analysis.email.scheduleResumed', { defaultValue: 'Schedule resumed.' }));
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? t('analysis.email.scheduleFailed', { defaultValue: 'The schedule could not be saved.' }));
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteSchedule({ id: analysis.id, scheduleId: id }).unwrap();
      toast.success(t('analysis.email.scheduleDeleted', { defaultValue: 'Schedule deleted.' }));
      setConfirmDelete(null);
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? t('analysis.email.scheduleDeleteFailed', { defaultValue: 'The schedule could not be deleted.' }));
    }
  };

  const sendScheduleNow = (s: AnalysisSchedule) => send(
    s.recipients.filter((r) => r.hasAccess !== false),
    { subject: s.subject ?? '', message: s.message ?? '', includePdf: s.includePdf, includeXlsx: s.includeXlsx },
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !sending) close(); }}>
      <DialogContent className="max-w-2xl w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-start">
          <DialogTitle>{t('analysis.email.title', { defaultValue: 'Email “{{name}}”', name: analysis.name })}</DialogTitle>
          <DialogDescription className="pt-1 text-[12.5px]">
            {t('analysis.email.description', { defaultValue: 'Send the report as a PDF and an Excel workbook to people it is shared with, now or on a schedule. Each email carries the data as it is when it is sent.' })}
          </DialogDescription>
        </DialogHeader>

        {!mailEnabled && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('analysis.email.notConfigured', { defaultValue: 'Email is not configured on this server yet, so nothing can be sent.' })}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'send' | 'schedules'); setEditing(null); }}>
          <TabsList>
            <TabsTrigger value="send"><Send className="h-3.5 w-3.5 me-1.5" />{t('analysis.email.tabSend', { defaultValue: 'Send now' })}</TabsTrigger>
            <TabsTrigger value="schedules">
              <CalendarClock className="h-3.5 w-3.5 me-1.5" />
              {t('analysis.email.tabSchedules', { defaultValue: 'Schedules' })}
              {schedules.length > 0 && <span className="ms-1.5 rounded-full bg-slate-200 px-1.5 text-[11px]">{schedules.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4 pt-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">{t('analysis.email.recipients', { defaultValue: 'Recipients' })}</p>
              <RecipientPicker analysisId={analysis.id} value={recipients} onChange={setRecipients} disabled={sending} />
            </div>
            <EmailContentFields
              value={content}
              onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
              subjectPlaceholder={analysis.name}
              disabled={sending}
              idPrefix="email-now"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={sending}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
              <Button onClick={() => void sendNow()} loading={sending} disabled={sending || !mailEnabled}>
                <Send className="h-3.5 w-3.5 me-1.5" />{t('analysis.email.send', { defaultValue: 'Send' })}
              </Button>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-[12px] font-bold tracking-[0.08em] text-slate-400">{t('analysis.email.history', { defaultValue: 'RECENT EMAILS' })}</p>
              {sendsLoading ? (
                <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : sends.length === 0 ? (
                <p className="text-[12.5px] text-slate-400">{t('analysis.email.noHistory', { defaultValue: 'This analysis has not been emailed yet.' })}</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-[12.5px]">
                  {sends.slice(0, 8).map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-1.5">
                      <span className="w-36 shrink-0 text-slate-500">{formatDohaDateTime(s.createdAt, language)}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-700" title={s.recipients.map((r) => r.email).join(', ')}>
                        {s.scheduleId ? <CalendarClock className="me-1 inline h-3.5 w-3.5 text-slate-400" /> : null}
                        {t('analysis.email.historyLine', { defaultValue: '{{by}} to {{count}} recipient(s)', by: s.sentBy.name, count: s.recipients.length })}
                      </span>
                      <SendStatus send={s} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-3 pt-3">
            {editing ? (
              <ScheduleForm
                analysisId={analysis.id}
                analysisName={analysis.name}
                schedule={editing === 'new' ? null : editing}
                onDone={() => setEditing(null)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] text-slate-500">
                    {t('analysis.email.schedulesHint', { defaultValue: 'Times are Doha time. A schedule pauses itself if the analysis or its recipients lose access.' })}
                  </p>
                  <Button size="sm" onClick={() => setEditing('new')} disabled={!mailEnabled}>
                    <Plus className="h-3.5 w-3.5 me-1" />{t('analysis.email.newSchedule', { defaultValue: 'New schedule' })}
                  </Button>
                </div>
                {schedulesLoading ? (
                  <div className="space-y-2"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
                ) : schedules.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[12.5px] text-slate-400">
                    {t('analysis.email.noSchedules', { defaultValue: 'No schedules yet.' })}
                  </p>
                ) : schedules.map((s) => (
                  <div key={s.id} className={cn('rounded-xl border p-3', s.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50')}>
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-slate-800">{scheduleSummary(t, s)}</p>
                        <p className="text-[12px] text-slate-500">
                          {t('analysis.email.scheduleMeta', {
                            defaultValue: '{{count}} recipient(s) · by {{owner}}',
                            count: s.recipients.length,
                            owner: s.owner.name,
                          })}
                          {' · '}
                          {[s.includePdf && 'PDF', s.includeXlsx && 'Excel'].filter(Boolean).join(' + ')}
                        </p>
                        <p className={cn('mt-1 text-[12px]', s.isActive ? 'text-slate-600' : 'text-amber-700')}>
                          {s.isActive
                            ? t('analysis.email.nextRun', { defaultValue: 'Next: {{when}}', when: formatDohaDateTime(s.nextRunAt, language) })
                            : pauseReasonLabel(t, s.pausedReason)}
                          {s.lastRunAt && (
                            <span className={cn('ms-2', s.lastStatus === 'FAILED' ? 'text-red-600' : 'text-slate-400')} title={s.lastError ?? undefined}>
                              · {s.lastStatus === 'FAILED'
                                ? t('analysis.email.lastFailed', { defaultValue: 'last attempt failed {{when}}', when: formatDohaDateTime(s.lastRunAt, language) })
                                : t('analysis.email.lastSent', { defaultValue: 'last sent {{when}}', when: formatDohaDateTime(s.lastRunAt, language) })}
                            </span>
                          )}
                        </p>
                        {s.recipients.some((r) => r.hasAccess === false) && (
                          <p className="mt-1 text-[11.5px] text-amber-700">
                            {t('analysis.email.someLostAccess', { defaultValue: 'Some recipients can no longer open the analysis and are skipped.' })}
                          </p>
                        )}
                      </div>
                      {s.canEdit && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" title={t('analysis.email.sendScheduleNow', { defaultValue: 'Send now' })}
                            onClick={() => void sendScheduleNow(s)} disabled={sending || !mailEnabled}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            title={s.isActive ? t('analysis.email.pause', { defaultValue: 'Pause' }) : t('analysis.email.resume', { defaultValue: 'Resume' })}
                            onClick={() => void toggle(s)} disabled={toggling}>
                            {s.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" title={t('analysis.email.edit', { defaultValue: 'Edit' })} onClick={() => setEditing(s)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" title={t('analysis.email.delete', { defaultValue: 'Delete' })} onClick={() => setConfirmDelete(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {confirmDelete === s.id && (
                      <div className="mt-2 flex items-center justify-end gap-2 rounded-lg bg-red-50 p-2 text-[12.5px] text-red-700">
                        {t('analysis.email.confirmDelete', { defaultValue: 'Delete this schedule?' })}
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
                        <Button size="sm" variant="destructive" onClick={() => void remove(s.id)} loading={deleting} disabled={deleting}>{t('analysis.email.delete', { defaultValue: 'Delete' })}</Button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
