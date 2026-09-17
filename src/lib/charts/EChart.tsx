'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CHART_ANIMATION, ensureChartTheme } from './theme';

export type EChartOption = Record<string, unknown>;
// A function option is used when the layout genuinely needs the container's measured size
// (e.g. a donut deciding whether its legend fits beside the ring or has to drop underneath).
export type EChartOptionInput = EChartOption | ((width: number, height: number) => EChartOption);

interface EChartProps {
  option: EChartOptionInput;
  height?: number | string;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
}

// Thin React wrapper around a raw ECharts instance — ECharts owns and mutates its canvas
// directly, which is why this isn't just `<div>{...}</div>` with option as a prop rendered
// declaratively: the instance must be created once, resized via ResizeObserver, and have
// `setOption` called imperatively whenever the option changes.
export function EChart({ option, height = 240, className, onEvents }: EChartProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const optionRef = useRef(option);
  optionRef.current = option;

  // A function option carries its own key via optionKey (set by builders like donut() whose
  // layout depends on measured width) — without it, JSON.stringify on a function is useless
  // ("undefined") and the chart would never know to re-render on data changes.
  const key = typeof option === 'function'
    ? ((option as { optionKey?: string }).optionKey ?? String(option))
    : JSON.stringify(option);

  function applyOption(chart: echarts.ECharts, el: HTMLDivElement) {
    const o = optionRef.current;
    const resolved = typeof o === 'function' ? o(el.clientWidth, el.clientHeight) : o;
    chart.setOption({ ...CHART_ANIMATION, ...resolved }, { notMerge: true });
  }

  useEffect(() => {
    ensureChartTheme();
    const el = elRef.current;
    if (!el) return;
    const chart = echarts.init(el, 'sbr');
    chartRef.current = chart;
    if (onEvents) {
      for (const [ev, handler] of Object.entries(onEvents)) chart.on(ev, handler);
    }
    const ro = new ResizeObserver(() => {
      chart.resize();
      if (typeof optionRef.current === 'function') applyOption(chart, el);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current && elRef.current) applyOption(chartRef.current, elRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={elRef}
      dir="ltr"
      className={className}
      style={{ width: '100%', height, minWidth: 0 }}
    />
  );
}
