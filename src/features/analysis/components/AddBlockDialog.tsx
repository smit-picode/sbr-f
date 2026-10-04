'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalysisBlockType, AnalysisEntity } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ANALYSIS_BLOCK_TYPES, ANALYSIS_ENTITIES, ANALYSIS_ENTITY_ORDER, type AnalysisBlockCategory } from '../constants';
import { blockCategoryLabel, blockTypeDescription, blockTypeLabel, entityLabel } from '../utils/labels';
import { supportsType } from '../utils/blocks';
import { AnalysisIcon } from './AnalysisIcon';

interface Props {
  open: boolean;
  defaultEntity: AnalysisEntity;
  onClose: () => void;
  onAdd: (type: AnalysisBlockType, entity: AnalysisEntity) => void;
}

export function AddBlockDialog({ open, defaultEntity, onClose, onAdd }: Props) {
  const { t } = useTranslation();
  const [entity, setEntity] = useState<AnalysisEntity>(defaultEntity);
  const categories = [...new Set(ANALYSIS_BLOCK_TYPES.map((b) => b.category))] as AnalysisBlockCategory[];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 text-start">
          <DialogTitle>{t('analysis.add.title', { defaultValue: 'Add a block' })}</DialogTitle>
          <DialogDescription className="text-[12.5px] text-slate-500">
            {t('analysis.add.description', { defaultValue: 'Pick what to analyse and how to show it — you can change both afterwards.' })}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t('analysis.editor.unit', { defaultValue: 'Unit of analysis' })}</div>
          <div className="flex flex-wrap gap-1.5">
            {ANALYSIS_ENTITY_ORDER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEntity(e)}
                className={cn('inline-flex items-center gap-1.5 h-8 rounded-full border px-3 text-[12px] font-semibold transition-colors', entity === e ? 'border-adaam bg-adaam-tint text-adaam-deep' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
              >
                <AnalysisIcon name={ANALYSIS_ENTITIES[e].icon} className="h-3.5 w-3.5" />
                {entityLabel(t, e)}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          {categories.map((c) => (
            <div key={c}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{blockCategoryLabel(t, c)}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ANALYSIS_BLOCK_TYPES.filter((b) => b.category === c).map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => onAdd(b.type, entity)}
                    disabled={!supportsType(b.type, entity)}
                    className="group flex disabled:opacity-40 disabled:pointer-events-none items-start gap-3 rounded-2xl border border-slate-200 p-3 text-start transition-all hover:border-adaam/50 hover:bg-adaam-tint/40 hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <span className="h-9 w-9 shrink-0 rounded-xl bg-adaam-tint text-adaam-deep flex items-center justify-center group-hover:bg-adaam group-hover:text-white transition-colors">
                      <AnalysisIcon name={b.icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-slate-800">{blockTypeLabel(t, b.type)}</span>
                      <span className="block text-[11.5px] text-slate-500 leading-snug mt-0.5">{blockTypeDescription(t, b.type)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
