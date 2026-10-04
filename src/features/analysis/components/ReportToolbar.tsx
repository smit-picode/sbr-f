'use client';

import { useMemo } from 'react';
import { Check, Crosshair, EyeOff, Redo2, ShieldCheck, Undo2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisCrossFilter, AnalysisFilter } from '@/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ANALYSIS_ENTITIES, ANALYSIS_ENTITY_ORDER } from '../constants';
import { ANALYSIS_FRAMES } from '../mock/frames';
import { fieldLabel, frameName, valueLabel } from '../utils/labels';
import { FilterChips } from './editor/FilterChips';

const NONE = '__none__';

interface Props {
  analysis: Analysis;
  canEdit: boolean;
  cross: AnalysisCrossFilter[];
  masked: boolean;
  maskLocked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onFrame: (frame: string) => void;
  onCompare: (frame: string | null) => void;
  onFilters: (filters: AnalysisFilter[]) => void;
  onClearCross: (index?: number) => void;
  onMasked: (v: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{children}</span>;
}

export function ReportToolbar(p: Props) {
  const { t } = useTranslation();
  const { analysis, canEdit } = p;
  // Report filters can use any field; each block applies those its unit has.
  const allFields = useMemo(() => [...new Set(ANALYSIS_ENTITY_ORDER.flatMap((e) => ANALYSIS_ENTITIES[e].fields))].filter((f) => !['sbr_id', 'enterprise_id', 'group_id', 'contact_id', 'address_id', 'name'].includes(f)), []);

  return (
    <div className="no-print sticky top-0 z-30 -mx-1 px-1 pt-1 pb-2 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="rounded-2xl bg-white shadow-card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex items-center gap-2">
          <Label>{t('analysis.toolbar.frame', { defaultValue: 'Frame' })}</Label>
          <Select value={analysis.frame} onValueChange={p.onFrame} disabled={!canEdit}>
            <SelectTrigger className="h-8 w-[136px] text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANALYSIS_FRAMES.map((f) => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', f.kind === 'live' ? 'bg-pos' : 'bg-info')} />
                    {frameName(t, f.id)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>{t('analysis.toolbar.compare', { defaultValue: 'Compare' })}</Label>
          <Select value={analysis.compareTo ?? NONE} onValueChange={(v) => p.onCompare(v === NONE ? null : v)} disabled={!canEdit}>
            <SelectTrigger className="h-8 w-[144px] text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} className="text-xs">{t('analysis.editor.noCompare', { defaultValue: 'No comparison' })}</SelectItem>
              {ANALYSIS_FRAMES.filter((f) => f.id !== analysis.frame).map((f) => <SelectItem key={f.id} value={f.id} className="text-xs">{frameName(t, f.id)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="hidden md:block h-6 w-px bg-slate-200" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Label>{t('analysis.toolbar.filters', { defaultValue: 'Filters' })}</Label>
          <FilterChips filters={analysis.filters} onChange={p.onFilters} entity="establishments" fields={allFields} readOnly={!canEdit} compact addLabel={t('analysis.toolbar.addReportFilter', { defaultValue: 'Filter all blocks' })} />
        </div>
        <div className="ms-auto flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => !p.maskLocked && p.onMasked(!p.masked)}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-[11.5px] font-semibold transition-colors',
                    p.masked ? 'bg-dune text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    p.maskLocked && 'cursor-default'
                  )}
                >
                  {p.masked ? <EyeOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {p.masked ? t('analysis.toolbar.published', { defaultValue: 'Published view' }) : t('analysis.toolbar.internal', { defaultValue: 'Internal view' })}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                {p.maskLocked
                  ? t('analysis.toolbar.maskLocked', { defaultValue: 'Confidential cells are always suppressed for your role.' })
                  : p.masked
                    ? t('analysis.toolbar.maskOn', { defaultValue: 'Confidential cells are suppressed, exactly as they will be exported.' })
                    : t('analysis.toolbar.maskOff', { defaultValue: 'Confidential cells are shown hatched. Switch to preview the published output.' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {canEdit && (
            <>
              <button type="button" onClick={p.onUndo} disabled={!p.canUndo} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={t('analysis.toolbar.undo', { defaultValue: 'Undo' })} title={t('analysis.toolbar.undo', { defaultValue: 'Undo' })}>
                <Undo2 className="h-4 w-4 rtl:-scale-x-100" />
              </button>
              <button type="button" onClick={p.onRedo} disabled={!p.canRedo} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={t('analysis.toolbar.redo', { defaultValue: 'Redo' })} title={t('analysis.toolbar.redo', { defaultValue: 'Redo' })}>
                <Redo2 className="h-4 w-4 rtl:-scale-x-100" />
              </button>
              <span className="hidden lg:inline-flex items-center gap-1 ps-1 text-[11px] text-slate-400">
                <Check className="h-3 w-3 text-pos" />
                {t('analysis.toolbar.saved', { defaultValue: 'Saved' })}
              </span>
            </>
          )}
        </div>
      </div>

      {p.cross.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-2xl bg-adaam-tint/70 border border-adaam/20 px-4 py-2 animate-in fade-in slide-in-from-top-1">
          <Crosshair className="h-3.5 w-3.5 text-adaam-deep" />
          <span className="text-[11.5px] font-semibold text-adaam-deep me-1">{t('analysis.toolbar.focusedOn', { defaultValue: 'Focused on' })}</span>
          {p.cross.map((c, i) => (
            <span key={`${c.field}-${i}`} className="inline-flex items-center gap-1 h-7 rounded-full bg-white ps-2.5 pe-1 text-[11.5px] text-slate-700 shadow-soft">
              <span className="font-semibold text-slate-500">{fieldLabel(t, c.field)}:</span>
              {valueLabel(t, c.field, c.value, true)}
              <button type="button" onClick={() => p.onClearCross(i)} className="h-5 w-5 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100" aria-label={t('analysis.editor.removeFilter', { defaultValue: 'Remove filter' })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => p.onClearCross()} className="ms-auto text-[11.5px] font-semibold text-adaam-deep hover:underline">
            {t('analysis.toolbar.clearAll', { defaultValue: 'Clear all' })}
          </button>
        </div>
      )}
    </div>
  );
}
