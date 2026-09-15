import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const STEP_KEYS = ['setUp', 'upload', 'validate', 'confirm'] as const;
const STEP_DEFAULTS = ['Set up', 'Upload', 'Validate', 'Confirm'] as const;

interface BulkChangeStepperProps {
  currentStep: number; // 0-based index into STEP_KEYS
}

export function BulkChangeStepper({ currentStep }: BulkChangeStepperProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-5 py-4 shadow-card">
      {STEP_KEYS.map((stepKey, index) => {
        const label = t(`bulkChange.wizard.steps.${stepKey}`, { defaultValue: STEP_DEFAULTS[index] });
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        return (
          <div key={stepKey} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isActive ? 'bg-[#8A1538] text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={`whitespace-nowrap text-[12.5px] font-semibold ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
              {label}
            </span>
            {index < STEP_KEYS.length - 1 && <span className="h-px w-8 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}
