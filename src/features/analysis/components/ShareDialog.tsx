'use client';

import { useState } from 'react';
import { Search, ShieldCheck, Trash2, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisShare } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalysisAccess } from '../hooks/useAnalyses';
import { SHARE_DIRECTORY } from '../mock/seedAnalyses';

interface Props {
  open: boolean;
  analysis: Analysis;
  readOnly: boolean;
  onClose: () => void;
  onSave: (shares: AnalysisShare[]) => void;
}

export function ShareDialog({ open, analysis, readOnly, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [shares, setShares] = useState<AnalysisShare[]>(analysis.shares);
  const [q, setQ] = useState('');
  const { myRoles } = useAnalysisAccess();
  // Real roles from the session first; the dummy directory fills in the rest until a lookup endpoint exists.
  const directory = [
    ...myRoles.map((r) => ({ kind: 'role' as const, id: r.id, label: r.label, sub: t('analysis.share.roleSub', { defaultValue: 'Role' }) })),
    ...SHARE_DIRECTORY.filter((d) => !myRoles.some((r) => r.label.toLowerCase() === d.label.toLowerCase())),
  ];
  const matches = q.trim()
    ? directory.filter((d) => !shares.some((s) => s.id === d.id) && d.id !== analysis.ownerEmail && `${d.label} ${d.sub}`.toLowerCase().includes(q.toLowerCase()))
    : [];

  const access = (a: AnalysisShare['access']) => (a === 'edit' ? t('analysis.share.canEdit', { defaultValue: 'Can edit' }) : t('analysis.share.canView', { defaultValue: 'Can view' }));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setShares(analysis.shares); setQ(''); onClose(); } }}>
      <DialogContent className="max-w-lg w-[calc(100vw-32px)]">
        <DialogHeader className="text-start">
          <DialogTitle>{t('analysis.share.title', { defaultValue: 'Share “{{name}}”', name: analysis.name })}</DialogTitle>
          <DialogDescription className="pt-1 text-[12.5px]">
            {t('analysis.share.description', { defaultValue: 'People see only fields their own permissions allow. Anyone who can view can duplicate it as a starting point.' })}
          </DialogDescription>
        </DialogHeader>

        {!readOnly && (
          <div className="relative">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('analysis.share.search', { defaultValue: 'Add people or roles…' })}
              className="h-10 w-full rounded-full border border-slate-300 bg-white ps-10 pe-4 text-[13px] shadow-input outline-none focus:border-[#A29374]/40 focus:ring-2 focus:ring-[#A29374]/20"
            />
            {matches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-float">
                {matches.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { setShares([...shares, { kind: d.kind, id: d.id, label: d.label, access: 'view' }]); setQ(''); }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-start hover:bg-slate-100"
                  >
                    <span className="h-7 w-7 rounded-full bg-dune-tint text-dune-deep flex items-center justify-center">{d.kind === 'role' ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-slate-800">{d.label}</span>
                      <span className="block text-[11px] text-slate-400">{d.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="h-8 w-8 rounded-full bg-dune text-white flex items-center justify-center text-[11px] font-bold">{(analysis.ownerName || analysis.ownerEmail).slice(0, 2).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-slate-800 truncate">{analysis.ownerName || analysis.ownerEmail}</span>
              <span className="block text-[11px] text-slate-400 truncate">{analysis.ownerEmail}</span>
            </span>
            <span className="text-[12px] font-semibold text-slate-500">{t('analysis.share.owner', { defaultValue: 'Owner' })}</span>
          </div>
          {shares.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
              <span className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">{s.kind === 'role' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-slate-800 truncate">{s.label}</span>
                <span className="block text-[11px] text-slate-400">{s.kind === 'role' ? t('analysis.share.role', { defaultValue: 'Everyone with this role' }) : s.id}</span>
              </span>
              {readOnly ? (
                <span className="text-[12px] text-slate-500">{access(s.access)}</span>
              ) : (
                <>
                  <Select value={s.access} onValueChange={(v) => setShares(shares.map((x) => (x.id === s.id ? { ...x, access: v as AnalysisShare['access'] } : x)))}>
                    <SelectTrigger className="h-8 w-[112px] text-xs shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view" className="text-xs">{access('view')}</SelectItem>
                      <SelectItem value="edit" className="text-xs">{access('edit')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <button type="button" onClick={() => setShares(shares.filter((x) => x.id !== s.id))} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-neg-text" aria-label={t('analysis.share.remove', { defaultValue: 'Remove access' })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {!shares.length && <p className={cn('px-2 py-3 text-[12.5px] text-slate-400')}>{t('analysis.share.private', { defaultValue: 'Only you can see this analysis.' })}</p>}
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11.5px] text-slate-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-adaam" />
          {t('analysis.share.disclosure', { defaultValue: 'Viewers without the unsuppressed-export permission only ever export disclosure-controlled figures.' })}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{readOnly ? t('analysis.close', { defaultValue: 'Close' }) : t('analysis.cancel', { defaultValue: 'Cancel' })}</Button>
          {!readOnly && <Button onClick={() => { onSave(shares); onClose(); }}>{t('analysis.share.save', { defaultValue: 'Save access' })}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
