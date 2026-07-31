'use client';

import { useTranslation } from 'react-i18next';

interface ErrorSummaryProps {
  /** Field key -> message. Render this component only when it has at least one entry. */
  errors: Record<string, string>;
  /** Field key -> human label. Missing keys fall back to the raw key. */
  fieldLabels?: Record<string, string>;
  /** When provided, each row becomes a button that scrolls/focuses the offending field. */
  onErrorClick?: (field: string) => void;
}

/**
 * Shared validation banner shown at the top of create/edit modals: an error count plus a list of
 * each failing field. Extracted from the byte-identical copies that previously lived in the
 * Establishment / Contact / Address edit modals, so every form presents validation the same way.
 *
 * `fieldLabels` and `onErrorClick` are optional: forms without a label map or scroll targets
 * (e.g. the short Enterprise / Enterprise Group forms) can pass just `errors`.
 */
export function ErrorSummary({ errors, fieldLabels, onErrorClick }: ErrorSummaryProps) {
  const { t } = useTranslation();
  const errorCount = Object.keys(errors).length;

  // No bottom margin here: DialogContent's own `grid gap-4` (sticky-layout modals) or the scroll
  // body's top padding (flex-layout modals) already separates this from the form below — an mb-4
  // doubled that into a wide empty strip.
  return (
    <div className="sticky top-0 z-20 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-red-700">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">
            {errorCount === 1
              ? t('validation.errorCountOne', { defaultValue: '1 validation error found' })
              : t('validation.errorCountMany', { defaultValue: `${errorCount} validation errors found`, count: errorCount })}
          </p>
          <p className="text-xs text-red-700 mt-0.5">
            {t('validation.correctBeforeSaving', { defaultValue: 'Please correct the errors below before saving' })}
          </p>
        </div>
      </div>
      <ul className="space-y-1.5 ml-7">
        {Object.entries(errors).map(([field, message]) => {
          const label = fieldLabels?.[field] || field;
          return (
            <li key={field}>
              {onErrorClick ? (
                <button
                  type="button"
                  onClick={() => onErrorClick(field)}
                  className="text-xs text-red-700 hover:text-red-900 hover:underline text-left font-medium transition-colors"
                >
                  • {label}: {message}
                </button>
              ) : (
                <span className="text-xs text-red-700 text-left font-medium">
                  • {label}: {message}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
