'use client';

import { useState } from 'react';
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
import { MOCK_BULK_TASKS } from '../mocks/bulkChangeMocks';
import { BULK_CHANGE_TABLES, type BulkChangeTableKey } from '../constants';
import type { BulkChangeValidationResult } from '../types';

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
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canGoNext =
    (step === STEP_SETUP && !!selectedTable) ||
    (step === STEP_UPLOAD && !!file) ||
    (step === STEP_VALIDATE && !!validation && validation.validRows > 0) ||
    (step === STEP_CONFIRM && reason.trim().length > 0);

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

  const handleSubmit = async () => {
    if (!validation) return;
    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 500));

    // No backend/API exists yet for this feature — append to the shared in-memory mock list
    // so the new task shows up in the pending queue, same as every other mocked task.
    MOCK_BULK_TASKS.unshift({
      ID: `BLK-${3000 + Math.floor((MOCK_BULK_TASKS.length + 1) * 7)}`,
      SUBMITTED_BY: 'admin@sbr.com',
      SUBMITTED_AT: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', ','),
      TABLE_NAME: selectedTable,
      RECORDS: validation.validRows,
      CHANGES: validation.validRows,
      STATUS: 'Pending',
    });

    setSubmitting(false);
    toast.success(t('bulkChange.wizard.submitSuccess', { defaultValue: 'Bulk update submitted for approval.' }));
    router.push('/tasks/bulk-change');
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

      {step === STEP_SETUP && <BulkChangeSetupStep selectedTable={selectedTable} onSelectTable={setSelectedTable} />}
      {step === STEP_UPLOAD && <BulkChangeUploadStep selectedTable={selectedTable} file={file} onFileSelected={setFile} />}
      {step === STEP_VALIDATE && (
        <BulkChangeValidateStep selectedTable={selectedTable} fileName={file?.name} onValidated={setValidation} />
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
