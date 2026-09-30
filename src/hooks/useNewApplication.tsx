"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch } from '@/utils/graphqlFetch';
import type { LoanApplicationInput } from '@/utils/applicationForm';
import type { SelectOption } from '@/utils/DataTypes';

const BRANCHES_FAILED = 'Could not load the branches.';
const SAVE_FAILED = 'Could not save the application.';

interface ApplicationBranch {
  id: string;
  name: string;
}

/** The first GraphQL error's message. graphqlFetch has already put a failed @rules check's own reasons there. */
const firstError = (errors: { message: string }[] | undefined, fallback: string): string | null =>
  errors?.length ? errors[0]?.message || fallback : null;

/** The branch choices, or an Error whose message the page can show. */
async function fetchBranchChoices(): Promise<SelectOption[]> {
  const result = await graphqlFetch<{ getApplicationBranches: ApplicationBranch[] | null }>(
    LoanApplicationQueries.GET_APPLICATION_BRANCHES_QUERY,
  );
  const refused = firstError(result.errors, BRANCHES_FAILED);
  if (refused) throw new Error(refused);
  const branches = result.data?.getApplicationBranches;
  if (!branches) throw new Error(BRANCHES_FAILED);
  return branches.map((branch) => ({ value: String(branch.id), label: branch.name }));
}

/**
 * Posts the application; true once saved. A refusal or a failure shows its message.
 * Success has no toast: the page moves to the list, which says "Na-save ang application."
 */
async function postApplication(input: LoanApplicationInput): Promise<boolean> {
  try {
    const result = await graphqlFetch<{ createLoanApplication: { id: string } | null }>(
      LoanApplicationQueries.CREATE_LOAN_APPLICATION_MUTATION,
      { input },
    );
    if (result.errors?.length || !result.data?.createLoanApplication) {
      console.warn('[useNewApplication] the server refused the application', {
        channel: input.channel,
        branch_sub_id: input.branch_sub_id,
      });
      toast.error(firstError(result.errors, SAVE_FAILED) ?? SAVE_FAILED);
      return false;
    }
    return true;
  } catch (error) {
    // graphqlFetch's own errors (no connection, a server error page) carry a message fit to show.
    console.error('[useNewApplication] the save did not finish', error);
    toast.error(error instanceof Error ? error.message : SAVE_FAILED);
    return false;
  }
}

/**
 * New application (/applications/new): the branch picker's choices, loaded on mount,
 * and saving. Logs carry ids only: the input holds names and mobile numbers.
 */
const useNewApplication = () => {
  /** Undefined while loading; empty after a failed load. */
  const [branchChoices, setBranchChoices] = useState<SelectOption[] | undefined>(undefined);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBranches = useCallback(async () => {
    setBranchChoices(undefined);
    setBranchError(null);
    try {
      setBranchChoices(await fetchBranchChoices());
    } catch (error) {
      console.error('[useNewApplication] the branch choices did not load', error);
      setBranchChoices([]);
      setBranchError(error instanceof Error ? error.message : BRANCHES_FAILED);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  /** Saves the application. A refusal shows the server's message, and the caller keeps the form open. */
  const createApplication = useCallback(async (input: LoanApplicationInput): Promise<{ success: boolean }> => {
    setSaving(true);
    try {
      return { success: await postApplication(input) };
    } finally {
      setSaving(false);
    }
  }, []);

  return { branchChoices, branchError, loadBranches, saving, createApplication };
};

export default useNewApplication;
