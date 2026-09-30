"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'react-feather';
import BorrowerDetails from '@/app/borrowers/components/TabForm/BorrowerDetails';
import { MAX_COMPANY_DROPDOWN_SIZE, MAX_DROPDOWN_SIZE } from '@/constants/pagination';
import useBorrowerBase from '@/hooks/useBorrowerBase';
import useNewApplication from '@/hooks/useNewApplication';
import {
  APPLICATION_REQUIRED_FIELDS, hasBlankBasic, toApplicationInput, type ApplicationFormValues, type LoanApplicationInput,
} from '@/utils/applicationForm';
import type { LoanApplicationChannel } from '@/utils/DataTypes';
import LoadError from './LoadError';
import SaanGalingField from './SaanGalingField';
import { useCanUpload } from './useCanUpload';

const LIST = '/applications';
const BLANK_BASICS = 'Kailangan ang pangalan, mobile, amount at purpose.';

const noop = () => {};

/** The back link, the title and the one-line promise: only the starred fields are needed. */
const NewApplicationHeader: React.FC = () => (
  <div className="border-b border-stroke px-3 pb-4 pt-2 dark:border-strokedark sm:px-5 md:px-7">
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
 * The Chief, Area, Sub Area and Office lists, loaded as New Borrower loads them
 * (borrowers/[id]/page.tsx). None is required here, so a list that fails does not
 * stop the basics from being saved.
 */
const useApplicationPicklists = () => {
  const { dataChief, dataArea, dataSubArea, dataBorrCompany, fetchDataChief, fetchDataArea, fetchDataSubArea, fetchDataBorrCompany } =
    useBorrowerBase();
  useEffect(() => {
    Promise.allSettled([
      fetchDataChief(MAX_DROPDOWN_SIZE, 1),
      fetchDataArea(MAX_DROPDOWN_SIZE, 1),
      fetchDataBorrCompany(MAX_COMPANY_DROPDOWN_SIZE, 1),
    ]).then((results) => {
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (!failed) return;
      console.error('[NewApplication] picklists did not load', { failed });
      toast.error('The Chief, Area or Office list did not load. The basics can still be saved.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once: the fetchers are new functions on every render
  }, []);
  return { dataChief, dataArea, dataSubArea, dataBorrCompany, fetchDataChief, fetchDataArea, fetchDataSubArea, fetchDataBorrCompany };
};

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
 * any branch) must pick one; branch staff start on their home branch.
 */
const NewApplication: React.FC = () => {
  const picklists = useApplicationPicklists();
  const { branchChoices, branchError, loadBranches, saving, createApplication } = useNewApplication();
  const { submit, close } = useSaveThenList(createApplication);
  const canChooseAny = useCanUpload();

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <NewApplicationHeader />
      <div className="py-3 sm:p-3 md:p-5">
        {branchError && (
          <div className="mx-2 mb-2 sm:mx-3">
            <LoadError message={branchError} onRetry={loadBranches} />
          </div>
        )}
        <BorrowerDetails
          {...picklists}
          variant="application"
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
