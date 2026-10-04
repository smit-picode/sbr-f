'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { ChartColumn, Copy, Ellipsis, FileDown, FileSpreadsheet, Plus, Presentation, Share2, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisBlock, AnalysisBlockType, AnalysisCrossFilter, AnalysisEntity, AnalysisFilter, AnalysisResolvedQuery } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/utils/toast';
import { formatDate } from '@/utils/format';
import { useAppDispatch } from '@/hooks';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { AnalysisReportSkeleton } from '@/components/common/AnalysisReportSkeleton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ANALYSIS_BLOCK_TYPE_MAP, ANALYSIS_LIST_HREF, ANALYSIS_QUICK_ADD } from '../constants';
import { resolveBlockQuery } from '../engine/resolve';
import { useAnalysesStore, useAnalysisAccess, nameFromEmail } from '../hooks/useAnalyses';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { useBlockDrag } from '../hooks/useBlockDrag';
import { removeAnalysis, upsertAnalysis } from '../store/analysesSlice';
import { createBlock, duplicateBlock, insertBlock, moveBlock, removeBlock, uid, updateBlockIn } from '../utils/blocks';
import { exportBlockCsv, exportBlockPng, exportBlockXlsx, exportReportXlsx } from '../utils/export';
import { blockTypeLabel } from '../utils/labels';
import { AddBlockDialog } from '../components/AddBlockDialog';
import { AnalysisIcon } from '../components/AnalysisIcon';
import { BlockCard } from '../components/BlockCard';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { CreateAnalysisDialog } from '../components/CreateAnalysisDialog';
import { BlockEditorPanel } from '../components/editor/BlockEditorPanel';
import { PresentationMode } from '../components/PresentationMode';
import { PrintReport } from '../components/PrintReport';
import { RecordsDrawer, type RecordsTarget } from '../components/RecordsDrawer';
import { ReportToolbar } from '../components/ReportToolbar';
import { ShareDialog } from '../components/ShareDialog';


export function AnalysisReportPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAnalysesStore();
  const access = useAnalysisAccess();
  const found = items.find((a) => a.id === id);
  const analysis = found && access.canView(found) ? found : undefined;
  const { commit, undo, redo, canUndo, canRedo } = useAnalysisHistory(analysis);

  const [cross, setCross] = useState<AnalysisCrossFilter[]>([]);
  const [maskedPref, setMaskedPref] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ afterId: string | null } | null>(null);
  const [records, setRecords] = useState<RecordsTarget | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const canEdit = !!analysis && access.canEditAnalysis(analysis);
  const maskLocked = !access.canExportUnsuppressed;
  const masked = maskLocked || maskedPref;
  const editing = analysis?.blocks.find((b) => b.id === editingId) ?? null;

  const { drag, start: startDrag } = useBlockDrag((id, overId, after) => {
    if (!analysis) return;
    const without = analysis.blocks.filter((b) => b.id !== id);
    change((a) => moveBlock(a, id, without.findIndex((b) => b.id === overId) + (after ? 1 : 0)));
  });

  const change = useCallback((fn: (a: NonNullable<typeof analysis>) => NonNullable<typeof analysis>, key?: string) => {
    if (analysis) commit(fn(analysis), key);
  }, [analysis, commit]);

  // Ctrl/Cmd+Z / Shift+Z / Y — ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.closest?.('input, textarea, [contenteditable="true"]')) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (!editingId) return;
    const el = canvasRef.current?.querySelector(`[data-block-id="${editingId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [editingId]);

  const lastEntity: AnalysisEntity = useMemo(() => {
    const withData = analysis?.blocks.filter((b) => b.type !== 'text') ?? [];
    return withData[withData.length - 1]?.query.entity ?? 'establishments';
  }, [analysis]);

  if (!hydrated) return <PageContainer><AnalysisReportSkeleton /></PageContainer>;
  if (!analysis) {
    return (
      <PageContainer>
        <PageHeader title={t('analysis.notFound', { defaultValue: 'Analysis not found' })} back={{ label: t('analysis.back', { defaultValue: 'All analyses' }), onClick: () => router.push(ANALYSIS_LIST_HREF) }} />
        <div className="rounded-2xl bg-white shadow-card p-12 text-center text-slate-500">{t('analysis.notFoundBody', { defaultValue: 'It may have been deleted, or it was never shared with you.' })}</div>
      </PageContainer>
    );
  }

  const addBlock = (type: AnalysisBlockType, entity: AnalysisEntity, afterId: string | null) => {
    const block = createBlock(type, entity);
    change((a) => insertBlock(a, block, afterId));
    setAdding(null);
    setEditingId(block.id);
  };

  const onCrossFilter = (f: AnalysisCrossFilter) => {
    setCross((prev) => [...prev.filter((c) => c.field !== f.field), f]);
  };

  const exportOne = async (block: AnalysisBlock, kind: 'xlsx' | 'csv' | 'png') => {
    const q = resolveBlockQuery(block, analysis, cross);
    try {
      if (kind === 'png') {
        if (!exportBlockPng(block)) toast.error(t('analysis.export.pngFailed', { defaultValue: 'This block has no chart to download.' }));
        return;
      }
      toast.info(t('analysis.export.preparingBlock', { defaultValue: 'Preparing the export…' }));
      if (kind === 'csv') await exportBlockCsv(block, q, t, masked);
      else await exportBlockXlsx(block, q, t, masked);
      toast.success(t('analysis.export.done', { defaultValue: 'Export ready.' }));
    } catch {
      toast.error(t('analysis.export.failed', { defaultValue: 'Export failed. Please try again.' }));
    }
  };

  const exportRecordsBlock = async (block: AnalysisBlock, q: AnalysisResolvedQuery) => {
    try {
      await exportBlockXlsx(block, q, t, masked);
      toast.success(t('analysis.export.done', { defaultValue: 'Export ready.' }));
    } catch {
      toast.error(t('analysis.export.failed', { defaultValue: 'Export failed. Please try again.' }));
    }
  };

  const exportWorkbook = async () => {
    setExporting(true);
    try {
      await exportReportXlsx(analysis, cross, t, masked);
      toast.success(t('analysis.export.done', { defaultValue: 'Export ready.' }));
    } catch {
      toast.error(t('analysis.export.failed', { defaultValue: 'Export failed. Please try again.' }));
    } finally {
      setExporting(false);
    }
  };

  const duplicateAnalysis = () => setDuplicating(true);

  const confirmDuplicate = (name: string, description: string) => {
    setDuplicating(false);
    const copy = {
      ...JSON.parse(JSON.stringify(analysis)),
      id: uid('a'),
      name,
      description,
      ownerEmail: access.email,
      ownerName: nameFromEmail(access.email),
      shares: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(upsertAnalysis(copy));
    toast.success(t('analysis.duplicated', { defaultValue: 'Analysis duplicated.' }));
    router.push(`${ANALYSIS_LIST_HREF}/${copy.id}`);
  };


  const shared = analysis.shares.length > 0;

  return (
    <div className={cn('transition-[padding] duration-200', editing && 'lg:pe-[452px]')}>
      <PageContainer>
        <PageHeader
          title={canEdit ? (
            <input
              value={analysis.name}
              onChange={(e) => change((a) => ({ ...a, name: e.target.value }), 'name')}
              aria-label={t('analysis.name', { defaultValue: 'Analysis name' })}
              className="w-full min-w-[280px] max-w-[760px] bg-transparent text-white font-extrabold outline-none border-b border-transparent hover:border-white/30 focus:border-white/60 transition-colors"
            />
          ) : analysis.name}
          description={canEdit ? (
            <input
              value={analysis.description}
              onChange={(e) => change((a) => ({ ...a, description: e.target.value }), 'description')}
              placeholder={t('analysis.descriptionPlaceholder', { defaultValue: 'Add a short description…' })}
              className="w-full max-w-2xl bg-transparent text-white/80 placeholder:text-white/40 outline-none border-b border-transparent hover:border-white/20 focus:border-white/50 transition-colors"
            />
          ) : analysis.description}
          back={{ label: t('analysis.back', { defaultValue: 'All analyses' }), onClick: () => router.push(ANALYSIS_LIST_HREF) }}
          chips={
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white/85">
              {shared && <Users className="h-3 w-3" />}
              {analysis.ownerName || analysis.ownerEmail} · {formatDate(analysis.updatedAt)}
            </span>
          }
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setPresenting(true)} disabled={!analysis.blocks.length}>
                <Presentation className="h-3.5 w-3.5" />
                {t('analysis.present.start', { defaultValue: 'Present' })}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSharing(true)}>
                <Share2 className="h-3.5 w-3.5" />
                {t('analysis.share.button', { defaultValue: 'Share' })}
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={!analysis.blocks.length} loading={exporting || printing}>
                    {!exporting && !printing && <FileDown className="h-3.5 w-3.5" />}
                    {t('analysis.export.button', { defaultValue: 'Export' })}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 text-[12.5px]">
                  <DropdownMenuItem onClick={() => setPrinting(true)}><FileDown className="h-3.5 w-3.5 me-2" />{t('analysis.export.pdf', { defaultValue: 'PDF (print the report)' })}</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportWorkbook}><FileSpreadsheet className="h-3.5 w-3.5 me-2" />{t('analysis.export.workbook', { defaultValue: 'Excel — one sheet per block' })}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" aria-label={t('analysis.block.more', { defaultValue: 'More actions' })}>
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 text-[12.5px]">
                  <DropdownMenuItem onClick={duplicateAnalysis}><Copy className="h-3.5 w-3.5 me-2" />{t('analysis.duplicate', { defaultValue: 'Duplicate analysis' })}</DropdownMenuItem>
                  {access.isOwner(analysis) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-neg-text focus:text-neg-text"><Trash2 className="h-3.5 w-3.5 me-2" />{t('analysis.deleteAnalysis', { defaultValue: 'Delete analysis' })}</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />

        <ReportToolbar
          analysis={analysis}
          canEdit={canEdit}
          cross={cross}
          masked={masked}
          maskLocked={maskLocked}
          canUndo={canUndo}
          canRedo={canRedo}
          onFrame={(frame) => change((a) => ({ ...a, frame, compareTo: a.compareTo === frame ? null : a.compareTo }))}
          onCompare={(compareTo) => change((a) => ({ ...a, compareTo }))}
          onFilters={(filters: AnalysisFilter[]) => change((a) => ({ ...a, filters }), 'report-filters')}
          onClearCross={(i) => setCross((prev) => (i == null ? [] : prev.filter((_, j) => j !== i)))}
          onMasked={setMaskedPref}
          onUndo={undo}
          onRedo={redo}
        />

        {!canEdit && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12px] text-slate-600 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            {t('analysis.viewOnly', { defaultValue: 'You can view and explore this analysis. Duplicate it to make your own changes.' })}
            <button type="button" onClick={duplicateAnalysis} className="ms-auto font-semibold text-adaam-deep hover:underline">{t('analysis.duplicate', { defaultValue: 'Duplicate analysis' })}</button>
          </div>
        )}

        {analysis.blocks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-adaam-tint text-adaam flex items-center justify-center"><ChartColumn className="h-7 w-7" /></div>
            <h3 className="text-[17px] font-bold text-slate-800">{t('analysis.emptyReport.title', { defaultValue: 'Start building your analysis' })}</h3>
            <p className="mt-1 text-[13px] text-slate-500 max-w-md mx-auto">{t('analysis.emptyReport.body', { defaultValue: 'Add blocks: headline numbers, charts, maps, cross-tabs, record lists or commentary. Every block can target its own unit, frame and filters.' })}</p>
            {canEdit && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {ANALYSIS_QUICK_ADD.map((type) => (
                  <button key={type} type="button" onClick={() => addBlock(type, 'establishments', null)} className="inline-flex items-center gap-1.5 h-9 rounded-full border border-slate-200 bg-white px-3.5 text-[12.5px] font-semibold text-slate-700 hover:border-adaam/50 hover:bg-adaam-tint/40">
                    <AnalysisIcon name={ANALYSIS_BLOCK_TYPE_MAP[type].icon} className="h-4 w-4 text-adaam" />
                    {blockTypeLabel(t, type)}
                  </button>
                ))}
                <Button size="sm" onClick={() => setAdding({ afterId: null })}><Plus className="h-3.5 w-3.5" />{t('analysis.add.more', { defaultValue: 'All blocks…' })}</Button>
              </div>
            )}
          </div>
        ) : (
          <div ref={canvasRef} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {analysis.blocks.map((b, i) => (
              <div
                key={b.id}
                data-block-slot={b.id}
                data-full={b.width === 'full'}
                className={cn('relative min-w-0', b.width === 'full' && 'lg:col-span-2', drag?.id === b.id && 'opacity-40')}
              >
                {drag && drag.over === b.id && drag.id !== b.id && (
                  <div className={cn('pointer-events-none absolute z-10 rounded-full bg-adaam', b.width === 'full'
                    ? cn('inset-x-2 h-1', drag.after ? '-bottom-2.5' : '-top-2.5')
                    : cn('inset-y-2 w-1', drag.after ? '-end-2.5' : '-start-2.5'))} />
                )}
                <BlockCard
                  block={b}
                  analysis={analysis}
                  cross={cross}
                  masked={masked}
                  canEdit={canEdit}
                  selected={editingId === b.id}
                  isFirst={i === 0}
                  isLast={i === analysis.blocks.length - 1}
                  dragHandleProps={{ onPointerDown: (e) => startDrag(b.id, e) }}
                  onEdit={() => setEditingId(b.id)}
                  onChange={(patch) => change((a) => updateBlockIn(a, b.id, patch))}
                  onDuplicate={() => change((a) => duplicateBlock(a, b.id))}
                  onInsertBelow={() => setAdding({ afterId: b.id })}
                  onDelete={() => {
                    change((a) => removeBlock(a, b.id));
                    if (editingId === b.id) setEditingId(null);
                    setCross((prev) => prev.filter((c) => c.sourceBlockId !== b.id));
                    toast.info(t('analysis.block.deleted', { defaultValue: 'Block deleted — press Ctrl+Z to undo.' }));
                  }}
                  onMove={(dir) => change((a) => moveBlock(a, b.id, i + dir))}
                  onCrossFilter={onCrossFilter}
                  onViewRecords={(block, extra, label) => setRecords({ block, query: resolveBlockQuery(block, analysis, cross), extra, label })}
                  onExport={(kind) => exportOne(b, kind)}
                />
              </div>
            ))}
            {canEdit && (
              <div className="lg:col-span-2 no-print rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-4 py-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[12px] font-semibold text-slate-400 me-1">{t('analysis.add.quick', { defaultValue: 'Add' })}</span>
                {ANALYSIS_QUICK_ADD.map((type) => (
                  <button key={type} type="button" onClick={() => addBlock(type, lastEntity, null)} className="inline-flex items-center gap-1.5 h-8 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:border-adaam/50 hover:bg-adaam-tint/40 hover:text-adaam-deep">
                    <AnalysisIcon name={ANALYSIS_BLOCK_TYPE_MAP[type].icon} className="h-3.5 w-3.5" />
                    {blockTypeLabel(t, type)}
                  </button>
                ))}
                <button type="button" onClick={() => setAdding({ afterId: null })} className="inline-flex items-center gap-1 h-8 rounded-full bg-adaam px-3.5 text-[12px] font-semibold text-white hover:bg-adaam-deep">
                  <Plus className="h-3.5 w-3.5" />
                  {t('analysis.add.more', { defaultValue: 'All blocks…' })}
                </button>
              </div>
            )}
          </div>
        )}
      </PageContainer>

      {editing && canEdit && (
        <BlockEditorPanel
          key={editing.id}
          block={editing}
          analysis={analysis}
          onChange={(b) => change((a) => updateBlockIn(a, b.id, () => b), `block:${b.id}`)}
          onClose={() => setEditingId(null)}
        />
      )}
      {adding && (
        <AddBlockDialog open defaultEntity={lastEntity} onClose={() => setAdding(null)} onAdd={(type, entity) => addBlock(type, entity, adding.afterId)} />
      )}
      <RecordsDrawer target={records} onClose={() => setRecords(null)} onExport={exportRecordsBlock} />
      {sharing && (
        <ShareDialog
          open
          analysis={analysis}
          readOnly={!access.isOwner(analysis)}
          onClose={() => setSharing(false)}
          onSave={(shares) => { change((a) => ({ ...a, shares })); toast.success(t('analysis.share.saved', { defaultValue: 'Access updated.' })); }}
        />
      )}
      <CreateAnalysisDialog
        request={duplicating ? { kind: 'duplicate', name: t('analysis.copyOf', { defaultValue: 'Copy of {{name}}', name: analysis.name }), description: analysis.description, blockCount: analysis.blocks.length } : null}
        onCancel={() => setDuplicating(false)}
        onConfirm={confirmDuplicate}
      />
      <ConfirmDeleteDialog
        open={confirmDelete}
        title={t('analysis.deleteAnalysis', { defaultValue: 'Delete analysis' })}
        message={t('analysis.confirmDelete', { defaultValue: 'Delete “{{name}}”? People you shared it with lose access too. This cannot be undone.', name: analysis.name })}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          dispatch(removeAnalysis(analysis.id));
          toast.success(t('analysis.deleted', { defaultValue: 'Analysis deleted.' }));
          router.push(ANALYSIS_LIST_HREF);
        }}
      />
      {drag && (
        <div className="pointer-events-none fixed z-[90] max-w-[260px] truncate rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-float" style={{ left: drag.x + 14, top: drag.y + 14 }}>
          {analysis.blocks.find((b) => b.id === drag.id)?.title || t('analysis.block.moving', { defaultValue: 'Moving block' })}
        </div>
      )}
      {presenting && <PresentationMode analysis={analysis} cross={cross} masked={masked} onClose={() => setPresenting(false)} />}
      {printing && <PrintReport analysis={analysis} cross={cross} masked={masked} onDone={() => setPrinting(false)} />}
    </div>
  );
}
