import type { Analysis, AnalysisBlockType } from '@/types';
import { cn } from '@/lib/utils';
import { CHART_COLOR, CHART_GRAY, hexA } from '@/lib/charts/theme';

// Tiny schematic of a report's layout — each block drawn as a glyph of its visual type.
function Glyph({ type }: { type: AnalysisBlockType }) {
  const c = CHART_COLOR.adaam;
  const soft = hexA(CHART_COLOR.adaam, 0.5);
  const line = CHART_GRAY[300];
  switch (type) {
    case 'kpi':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><rect x="2" y="4" width="16" height="3" rx="1.5" fill={line} /><rect x="2" y="11" width="12" height="7" rx="1.5" fill={c} /><rect x="22" y="4" width="16" height="3" rx="1.5" fill={line} /><rect x="22" y="11" width="14" height="7" rx="1.5" fill={soft} /><rect x="42" y="4" width="16" height="3" rx="1.5" fill={line} /><rect x="42" y="11" width="10" height="7" rx="1.5" fill={soft} /></svg>;
    case 'bar': case 'delta':
      return <svg viewBox="0 0 60 24" className="h-full w-full">{[18, 50, 36, 26, 12].map((w, i) => <rect key={i} x="4" y={2 + i * 4.4} width={w} height="3" rx="1.5" fill={i === 1 ? c : soft} />)}</svg>;
    case 'column': case 'waterfall':
      return <svg viewBox="0 0 60 24" className="h-full w-full">{[10, 18, 14, 21, 8, 16].map((h, i) => <rect key={i} x={5 + i * 9} y={22 - h} width="6" height={h} rx="1.5" fill={i === 3 ? c : soft} />)}</svg>;
    case 'line':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><path d="M3 19 L15 15 L27 16 L39 9 L57 5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" /><path d="M3 19 L15 15 L27 16 L39 9 L57 5 L57 23 L3 23Z" fill={soft} opacity=".45" /></svg>;
    case 'donut': case 'sunburst':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><circle cx="30" cy="12" r="8" fill="none" stroke={soft} strokeWidth="5" /><path d="M30 4 A8 8 0 0 1 37.6 14.5" fill="none" stroke={c} strokeWidth="5" /></svg>;
    case 'treemap':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><rect x="3" y="2" width="30" height="20" rx="2" fill={c} /><rect x="35" y="2" width="22" height="11" rx="2" fill={soft} /><rect x="35" y="15" width="10" height="7" rx="2" fill={soft} /><rect x="47" y="15" width="10" height="7" rx="2" fill={line} /></svg>;
    case 'map':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><path d="M26 2 C33 1 37 6 36 11 C35 16 38 20 32 22 C27 23 24 19 23 14 C22 9 21 3 26 2Z" fill={soft} /><path d="M29 10 C32 9 34 12 33 14 C31 16 28 15 29 10Z" fill={c} /></svg>;
    case 'pivot': case 'heatmap': case 'completeness':
      return <svg viewBox="0 0 60 24" className="h-full w-full">{Array.from({ length: 12 }).map((_, i) => <rect key={i} x={4 + (i % 4) * 13.5} y={3 + Math.floor(i / 4) * 6.8} width="12" height="5.4" rx="1" fill={type === 'pivot' ? (i < 4 ? soft : line) : hexA(CHART_COLOR.adaam, 0.15 + ((i * 37) % 9) / 11)} />)}</svg>;
    case 'records':
      return <svg viewBox="0 0 60 24" className="h-full w-full">{[0, 1, 2, 3].map((i) => <g key={i}><rect x="4" y={3 + i * 5} width="10" height="2.6" rx="1.3" fill={i ? line : soft} /><rect x="17" y={3 + i * 5} width="26" height="2.6" rx="1.3" fill={i ? line : soft} /><rect x="46" y={3 + i * 5} width="10" height="2.6" rx="1.3" fill={i ? line : soft} /></g>)}</svg>;
    case 'sankey':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><rect x="4" y="3" width="3" height="18" rx="1" fill={c} /><rect x="53" y="3" width="3" height="18" rx="1" fill={soft} /><path d="M7 6 C30 6 30 14 53 14 L53 20 C30 20 30 12 7 12Z" fill={soft} opacity=".6" /><path d="M7 14 C30 14 30 5 53 5 L53 9 C30 9 30 19 7 19Z" fill={c} opacity=".35" /></svg>;
    case 'text':
      return <svg viewBox="0 0 60 24" className="h-full w-full"><rect x="4" y="4" width="30" height="4" rx="2" fill={CHART_GRAY[400]} /><rect x="4" y="12" width="52" height="2.4" rx="1.2" fill={line} /><rect x="4" y="17" width="40" height="2.4" rx="1.2" fill={line} /></svg>;
    default:
      return null;
  }
}

export function AnalysisThumbnail({ analysis, className }: { analysis: Analysis; className?: string }) {
  const blocks = analysis.blocks.slice(0, 6);
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-adaam-tint via-white to-slate-100 p-3', className)}>
      <div className="grid grid-cols-2 gap-1.5">
        {blocks.map((b) => (
          <div key={b.id} className={cn('rounded-lg bg-white shadow-soft px-2 py-1.5', b.width === 'full' && 'col-span-2')} style={{ height: b.type === 'text' || b.type === 'kpi' ? 30 : 44 }}>
            <Glyph type={b.type} />
          </div>
        ))}
        {!blocks.length && <div className="col-span-2 h-[74px] rounded-md border border-dashed border-slate-300" />}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent" />
    </div>
  );
}
