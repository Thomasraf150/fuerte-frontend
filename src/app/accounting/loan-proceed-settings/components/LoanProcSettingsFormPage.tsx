"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Card, CardBody, CardHeader } from '@/components/Card';
import useLoanProceedAccount from '@/hooks/useLoanProceedAccount';
import useCoa from '@/hooks/useCoa';
import { toast } from '@/utils/notify';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DataLoanProceedAcctData } from '@/utils/DataTypes';
import LoanProcSettingsForm from './LoanProcSettingsForm';

export const LIST_PATH = '/accounting/loan-proceed-settings';

/**
 * The mapping form on its own URL: `/new` for Create Account, `/<branch_sub_id>` or `/global`
 * for a saved mapping, so Back, refresh and a pasted link all land on the same form.
 * The mapping is read from the URL's branch, never from the list row that was clicked.
 */
const LoanProcSettingsFormPage: React.FC<{ branchKey?: string }> = ({ branchKey }) => {
  const router = useRouter();
  const isEdit = branchKey !== undefined;
  const actionLbl = isEdit ? 'Update Account' : 'Create Account';
  const { loading, fetchLpsDataTable, fetchLpsDataForm, lpsSingleData } = useLoanProceedAccount();
  const { coaDataAccount, branchSubData, fetchCoaDataTable } = useCoa();
  // An edit URL starts loading at once, so Save never opens before the mapping is asked for.
  const [mappingAsked, setMappingAsked] = useState<boolean>(!isEdit);

  const backToList = () => router.push(LIST_PATH);

  useEffect(() => {
    fetchCoaDataTable();
    if (!isEdit) return;
    if (branchKey !== 'global' && !/^\d+$/.test(branchKey)) {
      toast.error('That loan proceed setting does not exist.');
      backToList();
      return;
    }
    (async () => {
      // Open only a mapping the list would show this user. The server answers any branch asked
      // for by id, so without this a typed URL reached other branches' mappings (and Global
      // Default) that the scoped list never offered.
      let listed: DataLoanProceedAcctData[] | undefined;
      try {
        listed = await fetchLpsDataTable();
      } catch (error) {
        console.warn('Loan proceed list failed to load', { branch_sub_id: branchKey, error });
      }
      if (!Array.isArray(listed)) {
        toast.error('Could not load this mapping. Please try again.');
        backToList();
        return;
      }
      if (!listed.some(row => (row?.branch_sub_id == null ? 'global' : String(row.branch_sub_id)) === branchKey)) {
        toast.error('That loan proceed setting does not exist.');
        backToList();
        return;
      }
      const loaded = await fetchLpsDataForm({ branch_sub_id: branchKey });
      setMappingAsked(true);
      // Back to the list when the mapping can't be loaded (the hook says why).
      if (!loaded) backToList();
    })();
  }, [branchKey]);

  // A branch with no saved rows has nothing to edit: its branch box would be locked and empty.
  useEffect(() => {
    if (isEdit && mappingAsked && !loading && lpsSingleData?.length === 0) {
      toast.error('This branch has no saved loan proceed setting.');
      backToList();
    }
  }, [isEdit, mappingAsked, loading, lpsSingleData]);

  const first = lpsSingleData?.[0];
  const branchName = !isEdit ? undefined : first ? (first.branch_sub?.name ?? 'Global Default') : undefined;
  useDocumentTitle('Loan Proceed Settings', branchName);

  return (
    <>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Loan Proceed Settings"
          loading={isEdit && !branchName}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Loan Proceed Settings', href: LIST_PATH },
            { label: isEdit ? (branchName ?? '') : 'New' },
          ]}
        />
      </div>
      <div className="max-w-12xl">
        <div className="fade-in">
          <Card>
            <CardHeader title={actionLbl} />
            <CardBody>
              <LoanProcSettingsForm
                setShowForm={(show) => { if (!show) backToList(); }}
                actionLbl={actionLbl}
                lpsSingleData={lpsSingleData}
                mappingLoading={loading || !mappingAsked}
                coaDataAccount={coaDataAccount || []}
                branchSubData={branchSubData} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoanProcSettingsFormPage;
