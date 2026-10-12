'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CHART_ANIMATION, ensureChartTheme } from './theme';

export type EChartOption = Record<string, unknown>;
// A function option is used when the layout genuinely needs the container's measured size
export type EChartOptionInput = EChartOption | ((width: number, height: number) => EChartOption);

interface EChartProps {
  option: EChartOptionInput;
  height?: number | string;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  renderer?: 'canvas' | 'svg';
  confineTooltip?: boolean;
}

// Thin React wrapper around a raw ECharts instance
export function EChart({ option, height = 240, className, onEvents, renderer = 'canvas', confineTooltip = false }: EChartProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const optionRef = useRef(option);
  optionRef.current = option;

  const key = typeof option === 'function'
    ? ((option as { optionKey?: string }).optionKey ?? String(option))
    : JSON.stringify(option);

  function applyOption(chart: echarts.ECharts, el: HTMLDivElement) {
    const o = optionRef.current;
    const resolved = typeof o === 'function' ? o(el.clientWidth, el.clientHeight) : o;
    const tooltip = resolved.tooltip as Record<string, unknown> | undefined;
    const withTooltip = confineTooltip && tooltip && !Array.isArray(tooltip) ? { ...resolved, tooltip: { ...tooltip, confine: true } } : resolved;
    chart.setOption({ ...CHART_ANIMATION, ...withTooltip }, { notMerge: true });
  }

  useEffect(() => {
    ensureChartTheme();
    const el = elRef.current;
    if (!el) return;
    const chart = echarts.init(el, 'sbr', { renderer });
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
