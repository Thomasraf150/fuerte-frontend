"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'react-feather';
import BorrowerDetails from '@/app/borrowers/components/TabForm/BorrowerDetails';
import useNewApplication from '@/hooks/useNewApplication';
import {
  APPLICATION_REQUIRED_FIELDS, hasBlankBasic, toApplicationInput, type ApplicationFormValues, type LoanApplicationInput,
} from '@/utils/applicationForm';
import type { LoanApplicationChannel } from '@/utils/DataTypes';
import LoadError from './LoadError';
import { NAME_INPUTS_IN_CAPITALS } from './nameInputs';
import SaanGalingField from './SaanGalingField';
import { useApplicationPicklists } from './useApplicationPicklists';
import { useCanUpload } from './useCanUpload';

const LIST = '/applications';
const BLANK_BASICS = 'Kailangan ang pangalan, mobile, amount at purpose.';

const noop = () => {};

/** The back link, the title and the one-line promise: only the starred fields are needed. */
const NewApplicationHeader: React.FC = () => (
  <div className="px-2 sm:px-4 lg:px-0">
    <Link
      href={LIST}
      className="-ml-2 inline-flex min-h-12 items-center gap-1.5 rounded px-2 text-sm font-medium text-primary transition-colors hover:text-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-bodydark1 dark:hover:text-white md:min-h-10"
    >
      <ArrowLeft aria-hidden="true" size={16} className="shrink-0" />
      <span>
        <span className="sr-only">Back to </span>Applications
      </span>
    </Link>
    <h2 className="text-title-sm font-semibold text-black dark:text-white">New application</h2>
    <p className="mt-1 text-sm text-body dark:text-bodydark">
      I-type ang application na galing sa Facebook, walk-in o tawag. Ang may{' '}
      <span className="font-bold" style={{ color: '#DC2626' }}>*</span> lang ang kailangan.
    </p>
  </div>
);

/**
 * Saving, then back to the list. BorrowerDetails closes the form (setShowForm(false))
 * after a save and on Back; after a save the list opens with ?saved=1 and says so.
 */
const useSaveThenList = (createApplication: (input: LoanApplicationInput) => Promise<{ success: boolean }>) => {
  const router = useRouter();
  const saved = useRef(false);

  const submit = async (values: ApplicationFormValues) => {
    // Spaces pass `required`, and the server would read them as null: stop here instead.
    if (hasBlankBasic(values)) {
      toast.error(BLANK_BASICS);
      return { success: false };
    }
    const channel = values.channel as LoanApplicationChannel; // its own required rule has run
    const result = await createApplication(toApplicationInput(values, channel, String(values.branch_sub_id ?? '')));
    saved.current = result.success;
    return result;
  };
  const close = (show: boolean) => {
    if (!show) router.push(saved.current ? `${LIST}?saved=1` : LIST);
  };
  return { submit, close };
};

/**
 * New application: New Borrower's own Details form (BorrowerDetails.tsx) with only the
 * basics required, "Saan galing" at the top of Borrower Information, and a branch
 * picker fed by getApplicationBranches. Call Center, Owner and Admin (who may choose
 * any branch; Call Center any of its group's, since 2026-10-08) must pick one; branch staff start on their home branch.
 */
const NewApplication: React.FC = () => {
  const picklists = useApplicationPicklists();
  const { branchChoices, branchError, loadBranches, saving, createApplication } = useNewApplication();
  const { submit, close } = useSaveThenList(createApplication);
  const canChooseAny = useCanUpload();

  return (
    <div className="space-y-4">
      <NewApplicationHeader />
      <div className={NAME_INPUTS_IN_CAPITALS}>
        {branchError && (
          <div className="mb-4">
            <LoadError message={branchError} onRetry={loadBranches} />
          </div>
        )}
        <BorrowerDetails
          {...picklists}
          variant="application"
          offerCheckBorrower
          requiredFields={APPLICATION_REQUIRED_FIELDS}
          // Empty while loading, so New Borrower's assigned-branch picker never flashes.
          branchChoices={branchChoices ?? []}
          loadingMyAccessibleBranches={branchChoices === undefined}
          preselectHomeBranch={canChooseAny === false}
          renderExtraFields={({ register, errors }) => (
            <SaanGalingField register={register} errors={errors} canChooseGoogleForm={canChooseAny} />
          )}
          onSubmitBorrower={submit}
          borrowerLoading={saving}
          singleData={undefined}
          setSingleData={noop}
          setShowForm={close}
          fetchDataBorrower={noop}
        />
      </div>
    </div>
  );
};

export default NewApplication;
