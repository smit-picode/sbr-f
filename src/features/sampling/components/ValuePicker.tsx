'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValuePicker as SharedValuePicker } from '@/components/common/ValuePicker';
import type { SamplingUnit } from '@/types';
import { useGetSamplingValuesQuery } from '../api/samplingApi';
import { valueLabel } from '../utils/labels';

interface ValuePickerProps {
  unit: SamplingUnit;
  column: string;
  snapshotId: number | null;
  multiple: boolean;
  values: string[];
  onChange: (values: string[]) => void;
}

// The shared picker over the sampling frame's values, with section and size-class names.
export function ValuePicker({ unit, column, snapshotId, multiple, values, onChange }: ValuePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useGetSamplingValuesQuery({ unit, column, snapshotId }, { skip: !open });
  return (
    <SharedValuePicker
      options={data?.data ?? []}
      loading={isFetching}
      multiple={multiple}
      values={values}
      onChange={onChange}
      onOpenChange={setOpen}
      labelFor={(v) => valueLabel(t, column, v)}
    />
  );
}
