'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Columns2,
  Copy,
  Crosshair,
  Ellipsis,
  FileSpreadsheet,
  Filter,
  FilterX,
  GripVertical,
  ImageDown,
  ListTree,
  Pencil,
  Plus,
  RectangleHorizontal,
  Rows3,
  ShieldAlert,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Analysis, AnalysisAggregateResult, AnalysisBlock, AnalysisCrossFilter, AnalysisFilter } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAnalysisResult } from '../api/analysisService';
import { ANALYSIS_BLOCK_TYPE_MAP, ANALYSIS_DISCLOSURE, ANALYSIS_DRILL_PATHS, ANALYSIS_ENTITIES, ANALYSIS_FRAME_DIMENSION, ANALYSIS_OTHER_KEY } from '../constants';
import { requestForBlock, resolveBlockQuery, type AnalysisDrillStep } from '../engine/resolve';
import { blockTypeLabel, entityLabel, fieldLabel, frameName, valueLabel } from '../utils/labels';
import { AnalysisIcon } from './AnalysisIcon';
import { BlockContent, blockHeight } from './blocks/BlockContent';
import type { AnalysisPointEvent } from './blocks/types';

export interface BlockCardActions {
  onEdit: () => void;
  onChange: (patch: Partial<AnalysisBlock>) => void;
  onDuplicate: () => void;
  onInsertBelow: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onCrossFilter: (f: AnalysisCrossFilter) => void;
  onViewRecords: (block: AnalysisBlock, extra: AnalysisFilter[], label: string) => void;
  onExport: (kind: 'xlsx' | 'csv' | 'png') => void;
}

interface BlockCardProps extends BlockCardActions {
  block: AnalysisBlock;
  analysis: Analysis;
  cross: AnalysisCrossFilter[];
  masked: boolean;
  canEdit: boolean;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
}

interface MenuState extends AnalysisPointEvent { label: string }

function PointMenu({ menu, block, onClose, onFilter, onDrill, onRecords }: {
  menu: MenuState;
  block: AnalysisBlock;
  onClose: () => void;
  onFilter: (dimIndex: number) => void;
  onDrill: () => void;
  onRecords: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    const close = (e: Event) => { if (!(e.target as HTMLElement)?.closest?.('[data-point-menu]')) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    window.addEventListener('scroll', onClose, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  const filterable = menu.keys.map((k, i) => ({ k, i, dim: menu.dims[i] })).filter((x) => x.dim && x.dim !== ANALYSIS_FRAME_DIMENSION && x.k !== ANALYSIS_OTHER_KEY);
  const drillField = menu.dims[0] && block.type !== 'map' ? ANALYSIS_DRILL_PATHS[menu.dims[0]] : undefined;
  const canDrill = !!drillField && menu.keys[0] != null && menu.keys[0] !== ANALYSIS_OTHER_KEY && block.query.dimensions.length <= 2;
  const recordable = menu.keys.every((k, i) => k !== ANALYSIS_OTHER_KEY && menu.dims[i] !== ANALYSIS_FRAME_DIMENSION);
  const left = Math.min(menu.clientX + 6, window.innerWidth - 260);
  const top = Math.min(menu.clientY + 6, window.innerHeight - 200);
  const item = 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-slate-700 hover:bg-slate-100 text-start';

  return createPortal(
    <div data-point-menu className="fixed z-[70] w-[248px] rounded-2xl bg-white p-1.5 shadow-float border border-slate-100 animate-in fade-in zoom-in-95 duration-100" style={{ left, top }}>
      <div className="px-2.5 pt-1.5 pb-2 border-b border-slate-100 mb-1">
        <div className="text-[12.5px] font-bold text-slate-900 truncate">{menu.label}</div>
        {menu.value != null && <div className="text-[11px] text-slate-400 tabular-nums">{menu.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>}
      </div>
      {block.crossFilter && filterable.map((x) => (
        <button key={x.i} type="button" className={item} onClick={() => onFilter(x.i)}>
          <Crosshair className="h-3.5 w-3.5 text-adaam shrink-0" />
          <span className="truncate">{t('analysis.point.filter', { defaultValue: 'Filter report: {{value}}', value: valueLabel(t, x.dim, x.k, true) })}</span>
        </button>
      ))}
      {canDrill && (
        <button type="button" className={item} onClick={onDrill}>
          <ListTree className="h-3.5 w-3.5 text-adaam shrink-0" />
          <span className="truncate">{t('analysis.point.drill', { defaultValue: 'Drill into {{field}}', field: fieldLabel(t, drillField!).toLowerCase() })}</span>
        </button>
      )}
      {recordable && (
        <button type="button" className={item} onClick={onRecords}>
          <Rows3 className="h-3.5 w-3.5 text-adaam shrink-0" />
          <span className="truncate">{t('analysis.point.records', { defaultValue: 'View the underlying units' })}</span>
        </button>
      )}
    </div>,
    document.body
  );
}

export function BlockCard(props: BlockCardProps) {
  const { block, analysis, cross, masked, canEdit, selected, isFirst, isLast, dragHandleProps } = props;
  const { t } = useTranslation();
  const [drill, setDrill] = useState<AnalysisDrillStep[]>([]);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const def = ANALYSIS_BLOCK_TYPE_MAP[block.type];

  // A changed question invalidates the drill path.
  const dimsKey = `${block.query.entity}|${block.query.dimensions.join(',')}|${block.type}`;
  useEffect(() => { setDrill([]); }, [dimsKey]);

  const query = useMemo(() => resolveBlockQuery(block, analysis, cross, drill), [block, analysis, cross, drill]);
  const aggReq = useMemo(() => {
    const r = requestForBlock(block, query);
    return r?.kind === 'aggregate' && block.type !== 'kpi' ? r : null;
  }, [block, query]);
  const { data: agg } = useAnalysisResult<AnalysisAggregateResult>(aggReq);
  const flagged = agg ? agg.rows.filter((r) => r.flag).length : 0;

  const onPoint = def.interactive ? (e: AnalysisPointEvent) => {
    const label = e.keys.map((k, i) => valueLabel(t, e.dims[i], k, true)).join(' · ');
    setMenu({ ...e, label });
  } : undefined;

  const pointFilters = (m: MenuState): AnalysisFilter[] =>
    m.keys.map((k, i) => ({ id: `p${i}`, field: m.dims[i], op: 'in' as const, values: [k] })).filter((f) => f.field !== ANALYSIS_FRAME_DIMENSION);

  const drillFilters: AnalysisFilter[] = drill.map((s, i) => ({ id: `d${i}`, field: s.field, op: 'in', values: [s.value] }));
  const isText = block.type === 'text';
  const entity = ANALYSIS_ENTITIES[block.query.entity];
  const frameOverride = block.query.frame && block.query.frame !== analysis.frame ? block.query.frame : null;
  const usesCompare = def.needsCompare || block.type === 'kpi' || (['pivot', 'bar', 'column'].includes(block.type) && query.dimensions.length === 1);
  const compare = query.compareTo && usesCompare ? query.compareTo : null;
  const hasChart = !['kpi', 'pivot', 'heatmap', 'records', 'completeness', 'text'].includes(block.type);
  // Report and click filters on fields this block's unit doesn't have are skipped by the query — say so.
  const notApplied = [...new Set([
    ...analysis.filters.map((f) => f.field),
    ...(block.crossFilter ? cross.filter((c) => c.sourceBlockId !== block.id).map((c) => c.field) : []),
  ])].filter((f) => !entity.fields.includes(f));

  return (
    <div
      data-block-id={block.id}
      className={cn(
        'group/block relative flex flex-col rounded-2xl bg-white shadow-card transition-shadow break-inside-avoid',
        selected && 'ring-2 ring-adaam/60 shadow-float',
        isText && !selected && 'shadow-none bg-transparent'
      )}
    >
      {(!isText || canEdit) && (
        <div className={cn('flex items-start gap-2', isText ? 'absolute inset-x-0 top-0 z-10 px-3 pt-2 pointer-events-none [&>*]:pointer-events-auto' : 'px-4 pt-3.5 pb-2')}>
          {canEdit && (
            <button
              type="button"
              {...dragHandleProps}
              aria-label={t('analysis.block.drag', { defaultValue: 'Drag to reorder' })}
              className="no-print -ms-2 mt-0.5 h-6 w-4 flex items-center justify-center rounded text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {!isText && (
              <>
                <h3 className="text-[14px] font-bold text-slate-900 leading-snug truncate" title={block.title}>{block.title || blockTypeLabel(t, block.type)}</h3>
                {block.subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-2">{block.subtitle}</p>}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium">
                    <AnalysisIcon name={entity.icon} className="h-3 w-3" />
                    {entityLabel(t, block.query.entity)}
                  </span>
                  {frameOverride && <span className="rounded-full bg-info-tint text-info px-2 py-0.5 font-medium">{frameName(t, frameOverride)}</span>}
                  {compare && <span className="rounded-full bg-adaam-tint text-adaam-deep px-2 py-0.5 font-medium">{t('analysis.vsFrame', { defaultValue: 'vs {{frame}}', frame: frameName(t, compare) })}</span>}
                  {block.query.filters.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium" title={block.query.filters.map((f) => fieldLabel(t, f.field)).join(', ')}>
                      <Filter className="h-2.5 w-2.5" />
                      {t('analysis.filterCount', { defaultValue: '{{count}} filters', count: block.query.filters.length })}
                    </span>
                  )}
                  {notApplied.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-warn-tint text-warn-text px-2 py-0.5 font-medium"
                      title={t('analysis.block.notAppliedTip', { defaultValue: '{{unit}} have no such field, so these filters are skipped for this block.', unit: entityLabel(t, block.query.entity) })}
                    >
                      <FilterX className="h-2.5 w-2.5" />
                      {t('analysis.block.notApplied', { defaultValue: 'Not filtered by {{fields}}', fields: notApplied.map((f) => fieldLabel(t, f)).join(', ') })}
                    </span>
                  )}
                  {!block.crossFilter && <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5">{t('analysis.block.isolated', { defaultValue: 'Ignores report clicks' })}</span>}
                </div>
              </>
            )}
          </div>
          <div className="no-print flex items-center gap-0.5 shrink-0">
            {canEdit && (
              <button type="button" onClick={props.onEdit} className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-adaam-deep hover:bg-slate-100" aria-label={t('analysis.block.edit', { defaultValue: 'Edit block' })}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label={t('analysis.block.more', { defaultValue: 'More actions' })}>
                  <Ellipsis className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-[12.5px]">
                {canEdit && <DropdownMenuItem onClick={props.onEdit}><Pencil className="h-3.5 w-3.5 me-2" />{t('analysis.block.edit', { defaultValue: 'Edit block' })}</DropdownMenuItem>}
                {!isText && block.type !== 'records' && block.type !== 'kpi' && (
                  <DropdownMenuItem onClick={() => props.onViewRecords(block, drillFilters, block.title)}><Rows3 className="h-3.5 w-3.5 me-2" />{t('analysis.block.viewRecords', { defaultValue: 'View underlying units' })}</DropdownMenuItem>
                )}
                {!isText && (
                  <>
                    <DropdownMenuItem onClick={() => props.onExport('xlsx')}><FileSpreadsheet className="h-3.5 w-3.5 me-2" />{t('analysis.export.xlsx', { defaultValue: 'Export to Excel' })}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => props.onExport('csv')}><FileSpreadsheet className="h-3.5 w-3.5 me-2" />{t('analysis.export.csv', { defaultValue: 'Export to CSV' })}</DropdownMenuItem>
                  </>
                )}
                {hasChart && <DropdownMenuItem onClick={() => props.onExport('png')}><ImageDown className="h-3.5 w-3.5 me-2" />{t('analysis.export.png', { defaultValue: 'Download image' })}</DropdownMenuItem>}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => props.onChange({ width: block.width === 'full' ? 'half' : 'full' })}>
                      {block.width === 'full' ? <Columns2 className="h-3.5 w-3.5 me-2" /> : <RectangleHorizontal className="h-3.5 w-3.5 me-2" />}
                      {block.width === 'full' ? t('analysis.block.halfWidth', { defaultValue: 'Half width' }) : t('analysis.block.fullWidth', { defaultValue: 'Full width' })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={props.onDuplicate}><Copy className="h-3.5 w-3.5 me-2" />{t('analysis.block.duplicate', { defaultValue: 'Duplicate' })}</DropdownMenuItem>
                    <DropdownMenuItem onClick={props.onInsertBelow}><Plus className="h-3.5 w-3.5 me-2" />{t('analysis.block.insertBelow', { defaultValue: 'Add block below' })}</DropdownMenuItem>
                    {!isFirst && <DropdownMenuItem onClick={() => props.onMove(-1)}><ArrowUp className="h-3.5 w-3.5 me-2" />{t('analysis.block.moveUp', { defaultValue: 'Move up' })}</DropdownMenuItem>}
                    {!isLast && <DropdownMenuItem onClick={() => props.onMove(1)}><ArrowDown className="h-3.5 w-3.5 me-2" />{t('analysis.block.moveDown', { defaultValue: 'Move down' })}</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={props.onDelete} className="text-neg-text focus:text-neg-text"><Trash2 className="h-3.5 w-3.5 me-2" />{t('analysis.block.delete', { defaultValue: 'Delete block' })}</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {drill.length > 0 && (
        <div className="no-print mx-4 mb-1 flex flex-wrap items-center gap-1 text-[11.5px]">
          <button type="button" onClick={() => setDrill([])} className="inline-flex items-center gap-1 rounded-full bg-adaam-tint px-2 py-0.5 font-semibold text-adaam-deep hover:bg-adaam/20">
            <Undo2 className="h-3 w-3" />
            {fieldLabel(t, drill[0].field)}
          </button>
          {drill.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-300 rtl:rotate-180" />
              <button
                type="button"
                onClick={() => setDrill(drill.slice(0, i + 1))}
                className={cn('rounded-full px-2 py-0.5', i === drill.length - 1 ? 'bg-slate-800 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {valueLabel(t, s.field, s.value, true)}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={cn('flex-1 min-h-0', isText ? cn('py-3', canEdit ? 'ps-7 pe-4' : 'px-4') : 'px-4 pb-3')}>
        <BlockContent block={block} query={query} masked={masked} height={blockHeight(block, 'screen')} mode="screen" onPoint={onPoint} />
      </div>

      {flagged > 0 && (
        <div className="mx-4 mb-3 -mt-1 flex items-center gap-1.5 text-[11px] text-warn-text">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          {masked
            ? t('analysis.disclosure.suppressed', { defaultValue: '{{count}} cells suppressed for confidentiality', count: flagged })
            : t('analysis.disclosure.flagged', { defaultValue: '{{count}} cells are confidential (fewer than {{min}} units or dominated) — suppressed in the published view and on export', count: flagged, min: ANALYSIS_DISCLOSURE.minCell })}
        </div>
      )}

      {menu && (
        <PointMenu
          menu={menu}
          block={block}
          onClose={() => setMenu(null)}
          onFilter={(i) => {
            props.onCrossFilter({ field: menu.dims[i], value: menu.keys[i], sourceBlockId: block.id });
            setMenu(null);
          }}
          onDrill={() => {
            setDrill([...drill, { field: menu.dims[0], value: menu.keys[0] }]);
            setMenu(null);
          }}
          onRecords={() => {
            props.onViewRecords(block, [...drillFilters, ...pointFilters(menu)], menu.label);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}
