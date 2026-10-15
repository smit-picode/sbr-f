'use client';

import { useCallback, useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { pendingChangeText } from '@/utils/pendingChange';
import { BulkChangeStepper } from '../components/BulkChangeStepper';
import { BulkChangeSetupStep } from '../components/BulkChangeSetupStep';
import { BulkChangeUploadStep } from '../components/BulkChangeUploadStep';
import { BulkChangeValidateStep } from '../components/BulkChangeValidateStep';
import { BulkChangeConfirmStep } from '../components/BulkChangeConfirmStep';
import { useSubmitBulkChangeMutation } from '../api/bulkChangeApi';
import { BULK_CHANGE_TABLES, ENTITY_TYPE_BY_TABLE } from '../constants';
import { validationRowNumber } from '../utils/rowNumber';
import type { BulkChangeItemInput, BulkChangeSubmitFailure, BulkChangeSubmitResponse, BulkChangeTableKey, BulkChangeValidationResult } from '../types';

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
  const [validating, setValidating] = useState(false);
  const [items, setItems] = useState<BulkChangeItemInput[]>([]);
  const [reason, setReason] = useState('');
  const [submitFailures, setSubmitFailures] = useState<BulkChangeSubmitFailure[]>([]);

  const [submitBulkChange, { isLoading: submitting }] = useSubmitBulkChangeMutation();

  const canGoNext =
    (step === STEP_SETUP && !!selectedTable) ||
    (step === STEP_UPLOAD && !!file) ||
    (step === STEP_VALIDATE && !!validation && validation.validRows > 0) ||
    (step === STEP_CONFIRM && reason.trim().length > 0);

  // Changing the table or the file invalidates any validation already computed
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
    const validRowNumbers = new Set(validation.rows.flatMap((row, index) => (row.status === 'VALID' ? [validationRowNumber(row, index, items)] : [])));
    const validItems = items.filter((item) => validRowNumbers.has(item.rowNumber));
    if (validItems.length === 0) return;
    setSubmitFailures([]);
    try {
      const response = await submitBulkChange({
        entityType: ENTITY_TYPE_BY_TABLE[selectedTable],
        items: validItems,
        reason: reason.trim(),
        fileName: file?.name,
      }).unwrap();

      const result = response.data;
      const total = validation.totalRows;
      const submitted = result?.submitted ?? 0;
      const failed = total - submitted;
      if (failed > 0) {
        toast.warning(
          t('bulkChange.wizard.submitPartial', {
            defaultValue: '{{submitted}} of {{total}} rows submitted for approval; {{failed}} failed.',
            submitted,
            total,
            failed,
          })
        );
      } else {
        toast.success(t('bulkChange.wizard.submitSuccess', { defaultValue: 'Bulk update submitted for approval.' }));
      }
      router.push('/tasks/bulk-change');
    } catch (error) {
      const body = (error as { data?: { message?: string; data?: Partial<BulkChangeSubmitResponse> } })?.data;
      const failures = (body?.data?.items ?? []).filter((item) => item.status === 'FAILED');
      setSubmitFailures(failures.map((item) => ({
        rowNumber: item.rowNumber,
        error: pendingChangeText(item.error, t) ?? item.error ?? t('bulkChange.wizard.confirm.unknownFailure', { defaultValue: 'This row could not be submitted.' }),
      })));
      if ((error as { status?: number })?.status === 400) {
        toast.error(body?.message ?? t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' }));
      }
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
      <PageHeader
        title={t('bulkChange.wizard.title', { defaultValue: 'New bulk update' })}
        description={t('bulkChange.wizard.description', {
          defaultValue: 'Update many {{table}} at once from an Excel file — submitted as one approval task.',
          table: tableLabel,
        })}
        back={{ label: t('bulkChange.wizard.backToBulkChanges', { defaultValue: 'Back to bulk changes' }), onClick: () => router.push('/tasks/bulk-change') }}
      />

      <BulkChangeStepper currentStep={step} />

      {step === STEP_SETUP && <BulkChangeSetupStep selectedTable={selectedTable} onSelectTable={handleSelectTable} />}
      {step === STEP_UPLOAD && <BulkChangeUploadStep selectedTable={selectedTable} file={file} onFileSelected={handleFileSelected} />}
      {step === STEP_VALIDATE && (
        <BulkChangeValidateStep selectedTable={selectedTable} file={file} onValidated={handleValidated} onRunningChange={setValidating} />
      )}
      {step === STEP_CONFIRM && validation && (
        <BulkChangeConfirmStep
          selectedTable={selectedTable}
          fileName={file?.name}
          validation={validation}
          reason={reason}
          onReasonChange={setReason}
          submitFailures={submitFailures}
        />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={submitting || validating}>
          {step === STEP_SETUP
            ? t('bulkChange.wizard.cancel', { defaultValue: 'Cancel' })
            : t('bulkChange.wizard.back', { defaultValue: 'Back' })}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canGoNext}
          loading={submitting}
          style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}
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
