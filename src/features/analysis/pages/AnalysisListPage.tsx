'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { ChartColumn, Copy, Plus, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/utils/toast';
import { formatDate } from '@/utils/format';
import { useAppDispatch, useDebounce } from '@/hooks';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { AnalysisListSkeleton } from '@/components/common/AnalysisListSkeleton';
import { Button } from '@/components/ui/button';
import { ANALYSIS_LIST_HREF } from '../constants';
import { ANALYSIS_TEMPLATES, type AnalysisTemplate } from '../constants/templates';
import { useAnalysesStore, useAnalysisAccess, nameFromEmail } from '../hooks/useAnalyses';
import { removeAnalysis, upsertAnalysis } from '../store/analysesSlice';
import { uid } from '../utils/blocks';
import { frameName } from '../utils/labels';
import { AnalysisIcon } from '../components/AnalysisIcon';
import { AnalysisThumbnail } from '../components/AnalysisThumbnail';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { CreateAnalysisDialog, type CreateAnalysisRequest } from '../components/CreateAnalysisDialog';

type Scope = 'all' | 'mine' | 'shared';

export function AnalysisListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAnalysesStore();
  const access = useAnalysisAccess();
  const [scope, setScope] = useState<Scope>('all');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [toDelete, setToDelete] = useState<Analysis | null>(null);
  const [pending, setPending] = useState<{ req: CreateAnalysisRequest; tpl?: AnalysisTemplate; source?: Analysis } | null>(null);

  const visible = useMemo(() => items.filter((a) => access.canView(a)), [items, access]);
  const filtered = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    return visible
      .filter((a) => (scope === 'mine' ? access.isOwner(a) : scope === 'shared' ? access.isSharedWithMe(a) : true))
      .filter((a) => !needle || `${a.name} ${a.description} ${a.ownerName}`.toLowerCase().includes(needle))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [visible, scope, debounced, access]);

  const create = (tpl?: AnalysisTemplate) => {
    setPending({
      tpl,
      req: {
        kind: tpl ? 'template' : 'blank',
        name: tpl ? t(`analysis.templates.${tpl.id}.name`, { defaultValue: tpl.name }) : t('analysis.untitled', { defaultValue: 'Untitled analysis' }),
        description: tpl ? t(`analysis.templates.${tpl.id}.description`, { defaultValue: tpl.description }) : '',
        icon: tpl?.icon,
        blockCount: tpl ? tpl.build().length : 0,
      },
    });
  };

  const duplicate = (src: Analysis) => {
    setPending({ source: src, req: { kind: 'duplicate', name: t('analysis.copyOf', { defaultValue: 'Copy of {{name}}', name: src.name }), description: src.description, blockCount: src.blocks.length } });
  };

  const confirmCreate = (name: string, description: string) => {
    if (!pending) return;
    const { tpl, source } = pending;
    setPending(null);
    const now = new Date().toISOString();
    if (source) {
      dispatch(upsertAnalysis({ ...JSON.parse(JSON.stringify(source)), id: uid('a'), name, description, ownerEmail: access.email, ownerName: nameFromEmail(access.email), shares: [], createdAt: now, updatedAt: now }));
      toast.success(t('analysis.duplicated', { defaultValue: 'Analysis duplicated.' }));
      return;
    }
    const a: Analysis = {
      id: uid('a'),
      name,
      description,
      ownerEmail: access.email,
      ownerName: nameFromEmail(access.email),
      createdAt: now,
      updatedAt: now,
      frame: 'live',
      compareTo: tpl?.compareTo ?? null,
      filters: tpl?.filters ?? [],
      blocks: tpl ? tpl.build() : [],
      shares: [],
    };
    dispatch(upsertAnalysis(a));
    router.push(`${ANALYSIS_LIST_HREF}/${a.id}`);
  };

  if (!hydrated) return <PageContainer><AnalysisListSkeleton /></PageContainer>;

  const counts = { all: visible.length, mine: visible.filter(access.isOwner).length, shared: visible.filter(access.isSharedWithMe).length };

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.analysis.title', { defaultValue: 'Analysis' })}
        description={t('pages.analysis.description', { defaultValue: 'Build custom analyses and visualisations on any frame table.' })}
        actions={access.canCreate && (
          <Button size="sm" onClick={() => create()}>
            <Plus className="h-3.5 w-3.5" />
            {t('analysis.new', { defaultValue: 'New analysis' })}
          </Button>
        )}
      />

      {access.canCreate && (
        <section>
          <h2 className="mb-2 text-[13px] font-bold text-slate-700">{t('analysis.templates.title', { defaultValue: 'Start from a template' })}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <button type="button" onClick={() => create()} className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 text-start transition-all hover:border-adaam/50 hover:-translate-y-0.5">
              <span className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-adaam group-hover:text-white transition-colors"><Plus className="h-4.5 w-4.5" /></span>
              <span>
                <span className="block text-[13px] font-bold text-slate-800">{t('analysis.templates.blank', { defaultValue: 'Blank analysis' })}</span>
                <span className="block text-[11.5px] text-slate-500 leading-snug">{t('analysis.templates.blankDesc', { defaultValue: 'Start from an empty canvas' })}</span>
              </span>
            </button>
            {ANALYSIS_TEMPLATES.map((tpl) => (
              <button key={tpl.id} type="button" onClick={() => create(tpl)} className="group flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-start shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float">
                <span className="h-9 w-9 rounded-xl bg-adaam-tint text-adaam-deep flex items-center justify-center group-hover:bg-adaam group-hover:text-white transition-colors"><AnalysisIcon name={tpl.icon} className="h-4.5 w-4.5" /></span>
                <span>
                  <span className="block text-[13px] font-bold text-slate-800">{t(`analysis.templates.${tpl.id}.name`, { defaultValue: tpl.name })}</span>
                  <span className="block text-[11.5px] text-slate-500 leading-snug">{t(`analysis.templates.${tpl.id}.description`, { defaultValue: tpl.description })}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
          {(['all', 'mine', 'shared'] as Scope[]).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={cn('h-7 rounded-full px-3 text-[11.5px] font-semibold transition-colors', scope === s ? 'bg-dune text-white shadow-soft' : 'text-slate-500 hover:text-slate-700')}>
              {s === 'all' ? t('analysis.scope.all', { defaultValue: 'All' }) : s === 'mine' ? t('analysis.scope.mine', { defaultValue: 'My analyses' }) : t('analysis.scope.shared', { defaultValue: 'Shared with me' })}
              <span className={cn('ms-1.5 tabular-nums', scope === s ? 'text-white/80' : 'text-slate-400')}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder={t('analysis.search', { defaultValue: 'Search analyses…' })} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-adaam-tint text-adaam flex items-center justify-center"><ChartColumn className="h-6 w-6" /></div>
          <p className="text-[14px] font-bold text-slate-700">{debounced ? t('analysis.list.noMatch', { defaultValue: 'No analyses match your search' }) : t('analysis.list.emptyTitle', { defaultValue: 'No analyses yet' })}</p>
          <p className="mt-1 text-[12.5px] text-slate-500">{t('analysis.list.emptyBody', { defaultValue: 'Pick a template above or start from a blank canvas.' })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const mine = access.isOwner(a);
            return (
              <div
                key={a.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`${ANALYSIS_LIST_HREF}/${a.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`${ANALYSIS_LIST_HREF}/${a.id}`); }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float focus:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40"
              >
                <AnalysisThumbnail analysis={a} className="h-[150px]" />
                <div className="absolute top-2.5 end-2.5 flex gap-1">
                  <button type="button" onClick={(e) => { e.stopPropagation(); duplicate(a); }} className="h-8 w-8 rounded-full bg-white/95 shadow-soft flex items-center justify-center text-slate-500 hover:text-adaam-deep" aria-label={t('analysis.duplicate', { defaultValue: 'Duplicate analysis' })} title={t('analysis.duplicate', { defaultValue: 'Duplicate analysis' })}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {mine && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setToDelete(a); }} className="h-8 w-8 rounded-full bg-white/95 shadow-soft flex items-center justify-center text-slate-500 hover:text-neg-text" aria-label={t('analysis.deleteAnalysis', { defaultValue: 'Delete analysis' })} title={t('analysis.deleteAnalysis', { defaultValue: 'Delete analysis' })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-[14.5px] font-bold text-slate-900 truncate">{a.name}</h3>
                  <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-2 min-h-[34px]">{a.description || t('analysis.list.noDescription', { defaultValue: 'No description' })}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-dune text-white text-[9.5px] font-bold flex items-center justify-center">{(a.ownerName || a.ownerEmail).slice(0, 2).toUpperCase()}</span>
                    <span className="truncate">{mine ? t('analysis.list.you', { defaultValue: 'You' }) : a.ownerName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0">{formatDate(a.updatedAt)}</span>
                    <span className="ms-auto flex shrink-0 items-center gap-1.5">
                      {a.shares.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5" title={a.shares.map((s) => s.label).join(', ')}>
                          <Users className="h-3 w-3" />{a.shares.length}
                        </span>
                      )}
                      <span className="rounded-full bg-adaam-tint px-2 py-0.5 font-medium text-adaam-deep">{frameName(t, a.frame)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">{t('analysis.list.blocks', { defaultValue: '{{count}} blocks', count: a.blocks.length })}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateAnalysisDialog request={pending?.req ?? null} onCancel={() => setPending(null)} onConfirm={confirmCreate} />
      <ConfirmDeleteDialog
        open={!!toDelete}
        title={t('analysis.deleteAnalysis', { defaultValue: 'Delete analysis' })}
        message={t('analysis.confirmDelete', { defaultValue: 'Delete “{{name}}”? People you shared it with lose access too. This cannot be undone.', name: toDelete?.name ?? '' })}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) dispatch(removeAnalysis(toDelete.id));
          setToDelete(null);
          toast.success(t('analysis.deleted', { defaultValue: 'Analysis deleted.' }));
        }}
      />
    </PageContainer>
  );
}
