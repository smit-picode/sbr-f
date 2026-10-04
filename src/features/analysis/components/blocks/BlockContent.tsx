'use client';

import type { AnalysisBlock } from '@/types';
import { ChartBlock } from './ChartBlock';
import { CompletenessBlock } from './CompletenessBlock';
import { FlowBlock } from './FlowBlock';
import { KpiBlock } from './KpiBlock';
import { PivotBlock } from './PivotBlock';
import { RecordsBlock } from './RecordsBlock';
import { TextBlock } from './TextBlock';
import type { AnalysisRenderMode, BlockViewProps } from './types';

export function blockHeight(block: AnalysisBlock, mode: AnalysisRenderMode): number {
  if (mode === 'present') return typeof window === 'undefined' ? 520 : Math.max(360, Math.round(window.innerHeight * 0.58));
  const full = block.width === 'full';
  const print = mode === 'print';
  switch (block.type) {
    case 'line': return print ? 220 : full ? 280 : 260;
    case 'map': return print ? 300 : 340;
    case 'sankey': return print ? 320 : 380;
    case 'treemap': case 'sunburst': return print ? 280 : full ? 360 : 320;
    case 'bar': case 'delta': {
      const rows = (block.query.limit ?? 14) + 1;
      return Math.max(220, Math.min(print ? 360 : 440, rows * 26 + 40));
    }
    default: return print ? 240 : full ? 320 : 290;
  }
}

export function BlockContent(props: BlockViewProps) {
  switch (props.block.type) {
    case 'text': return <TextBlock text={props.block.text} mode={props.mode} />;
    case 'kpi': return <KpiBlock {...props} />;
    case 'pivot': case 'heatmap': return <PivotBlock {...props} />;
    case 'records': return <RecordsBlock {...props} />;
    case 'completeness': return <CompletenessBlock {...props} />;
    case 'waterfall': case 'sankey': return <FlowBlock {...props} />;
    default: return <ChartBlock {...props} />;
  }
}
