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
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {STEP_KEYS.map((stepKey, index) => {
        const label = t(`bulkChange.wizard.steps.${stepKey}`, { defaultValue: STEP_DEFAULTS[index] });
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        return (
          <div key={stepKey} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone
                    ? 'bg-[#A71D3A] text-white'
                    : isActive
                      ? 'bg-[#A71D3A] text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={`whitespace-nowrap text-sm ${isActive ? 'font-semibold text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {index < STEP_KEYS.length - 1 && (
              <div className={`mx-3 h-px flex-1 ${isDone ? 'bg-[#A71D3A]/40' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
