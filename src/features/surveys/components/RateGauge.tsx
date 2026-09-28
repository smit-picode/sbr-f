'use client';

import { EChart, gauge } from '@/lib/charts';
import { RATE_FAIR_COLOR, RATE_GOOD_COLOR, RATE_POOR_COLOR } from '../constants';
import { rateColor } from '../utils/classify';

// Ring gauge for a response rate, coloured good / fair / poor.
export function RateGauge({ rate, size, width, valueSize }: { rate: number; size: number; width: number; valueSize: number }) {
  return (
    <div className="shrink-0" style={{ width: size, height: size }}>
      <EChart
        height={size}
        option={gauge({
          value: rate,
          color: rateColor(rate, RATE_GOOD_COLOR, RATE_FAIR_COLOR, RATE_POOR_COLOR),
          width,
          valueSize,
          format: (v) => `${Math.round(v)}%`,
        })}
      />
    </div>
  );
}
