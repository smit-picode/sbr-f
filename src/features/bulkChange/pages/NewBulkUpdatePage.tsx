'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { BulkChangeStepper } from '../components/BulkChangeStepper';
import { BulkChangeSetupStep } from '../components/BulkChangeSetupStep';
import { BulkChangeUploadStep } from '../components/BulkChangeUploadStep';
import { BulkChangeValidateStep } from '../components/BulkChangeValidateStep';
import { BulkChangeConfirmStep } from '../components/BulkChangeConfirmStep';
import { useSubmitBulkChangeMutation } from '../api/bulkChangeApi';
import { BULK_CHANGE_TABLES, ENTITY_TYPE_BY_TABLE, type BulkChangeTableKey } from '../constants';
import type { BulkChangeItemInput, BulkChangeValidationResult } from '../types';

const STEP_SETUP = 0;
const STEP_UPLOAD = 1;
const STEP_VALIDATE = 2;
const STEP_CONFIRM = 3;

export function NewBulkUpdatePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(STEP_SETUP);
  const [selectedTable, setSelectedTable] = useState<BulkChangeTableKey>('Establishments');
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<BulkChangeValidationResult | null>(null);
  const [items, setItems] = useState<BulkChangeItemInput[]>([]);
  const [reason, setReason] = useState('');

  const [submitBulkChange, { isLoading: submitting }] = useSubmitBulkChangeMutation();

  const canGoNext =
    (step === STEP_SETUP && !!selectedTable) ||
    (step === STEP_UPLOAD && !!file) ||
    (step === STEP_VALIDATE && !!validation && validation.validRows > 0) ||
    (step === STEP_CONFIRM && reason.trim().length > 0);

  // Changing the table or the file invalidates any validation already computed — otherwise
  // Next could carry a previous file's valid-row set into the confirm step.
  const handleSelectTable = useCallback((table: BulkChangeTableKey) => {
    setSelectedTable(table);
    setValidation(null);
    setItems([]);
  }, []);

  const handleFileSelected = useCallback((next: File | null) => {
    setFile(next);
    setValidation(null);
    setItems([]);
  }, []);

  const handleValidated = useCallback((result: BulkChangeValidationResult | null, parsed: BulkChangeItemInput[]) => {
    setValidation(result);
    setItems(parsed);
  }, []);

  const handleSubmit = async () => {
    if (!validation || items.length === 0) return;
    try {
      const response = await submitBulkChange({
        entityType: ENTITY_TYPE_BY_TABLE[selectedTable],
        // Every parsed row is posted; the API re-validates and submits only the rows that
        // still pass, so the client's verdict is never trusted as the gate.
        items,
        reason: reason.trim(),
        fileName: file?.name,
      }).unwrap();

      const result = response.data;
      // SUBMIT_BULK is best-effort: some rows can fail inside the procedure while the rest
      // commit. Say so rather than reporting a clean success.
      if (result && result.failed > 0) {
        toast.warning(
          t('bulkChange.wizard.submitPartial', {
            defaultValue: '{{submitted}} of {{total}} rows submitted for approval; {{failed}} failed.',
            submitted: result.submitted,
            total: result.submitted + result.failed,
            failed: result.failed,
          })
        );
      } else {
        toast.success(t('bulkChange.wizard.submitSuccess', { defaultValue: 'Bulk update submitted for approval.' }));
      }
      router.push('/tasks/bulk-change');
    } catch {
      // The base query already surfaced the server message as a toast.
    }
  };

  const handleNext = () => {
    if (step === STEP_CONFIRM) {
      void handleSubmit();
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_CONFIRM));
  };

  const handleBack = () => {
    if (step === STEP_SETUP) {
      router.push('/tasks/bulk-change');
      return;
    }
    setStep((s) => Math.max(s - 1, STEP_SETUP));
  };

  const tableOption = BULK_CHANGE_TABLES.find((o) => o.key === selectedTable);
  const tableLabel = tableOption ? t(tableOption.navKey, { defaultValue: tableOption.label }) : selectedTable;

  return (
    <PageContainer>
      <button
        onClick={() => router.push('/tasks/bulk-change')}
        className="flex w-fit items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#A71D3A]"
      >
        <X className="h-4 w-4" /> {t('bulkChange.wizard.backToBulkChanges', { defaultValue: 'Back to bulk changes' })}
      </button>

      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">
          {t('bulkChange.wizard.title', { defaultValue: 'New bulk update' })}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('bulkChange.wizard.description', {
            defaultValue: 'Update many {{table}} at once from an Excel file — submitted as one approval task.',
            table: tableLabel,
          })}
        </p>
      </div>

      <BulkChangeStepper currentStep={step} />

      {step === STEP_SETUP && <BulkChangeSetupStep selectedTable={selectedTable} onSelectTable={handleSelectTable} />}
      {step === STEP_UPLOAD && <BulkChangeUploadStep selectedTable={selectedTable} file={file} onFileSelected={handleFileSelected} />}
      {step === STEP_VALIDATE && (
        <BulkChangeValidateStep selectedTable={selectedTable} file={file} onValidated={handleValidated} />
      )}
      {step === STEP_CONFIRM && validation && (
        <BulkChangeConfirmStep
          selectedTable={selectedTable}
          fileName={file?.name}
          validation={validation}
          reason={reason}
          onReasonChange={setReason}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={submitting}>
          {step === STEP_SETUP
            ? t('bulkChange.wizard.cancel', { defaultValue: 'Cancel' })
            : t('bulkChange.wizard.back', { defaultValue: 'Back' })}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canGoNext || submitting}
          style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
          className="text-white"
        >
          {step === STEP_CONFIRM
            ? submitting
              ? t('bulkChange.wizard.submitting', { defaultValue: 'Submitting…' })
              : t('bulkChange.wizard.submitForApproval', { defaultValue: 'Submit for approval' })
            : t('bulkChange.wizard.next', { defaultValue: 'Next' })}
        </Button>
      </div>
    </PageContainer>
  );
}
