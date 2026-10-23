import { showOpenApplicationModal } from '@/components/ConfirmationModal';
import { APPLICATION_STATUS_LABEL } from '@/app/applications/components/ApplicationStatusPill';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { applicationNumber } from '@/utils/convertApplication';
import type { BorrowerInfo, LoanApplicationStatus } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { toast } from '@/utils/notify';

/** findOpenApplicationForApplicant's answer: the application, never the applicant's details. */
interface OpenApplicationMatch {
  application_id: number;
  status: LoanApplicationStatus;
  branch_name: string | null;
  can_open: boolean;
}

/** What New Borrower does next: save as before ('none' found, or 'direct' chosen), stop ('back'), or go to the application. */
export type OpenApplicationOutcome =
  | { action: 'none' | 'direct' | 'back' }
  | { action: 'open'; applicationId: number };

/**
 * New Borrower, before a direct save (Rafael 2026-10-23): is this person Marketing's applicant,
 * waiting at Call Center? If so, the staff member is shown the application and chooses: open it
 * (and create the borrower from it, which gives Call Center Approve / Reject), create directly
 * anyway, or go back. Advisory: when the check cannot be made, the save goes ahead with a warning,
 * as the duplicate check does. Logs carry no name or mobile.
 */
export const checkOpenApplication = async (
  data: Pick<BorrowerInfo, 'firstname' | 'lastname' | 'contact_no'>
): Promise<OpenApplicationOutcome> => {
  const firstname = (data.firstname ?? '').trim();
  const lastname = (data.lastname ?? '').trim();
  const contactNo = String(data.contact_no ?? '').trim();
  if (!firstname || !lastname || !contactNo) return { action: 'none' };

  let match: OpenApplicationMatch | null;
  try {
    const result = await graphqlFetch<{ findOpenApplicationForApplicant?: OpenApplicationMatch | null }>(
      LoanApplicationQueries.FIND_OPEN_APPLICATION_FOR_APPLICANT_QUERY,
      { firstname, lastname, contact_no: contactNo },
    );
    if (result.errors?.length) throw new Error(result.errors[0]?.message);
    match = result.data?.findOpenApplicationForApplicant ?? null;
  } catch (error) {
    console.error('Open application check failed:', error instanceof Error ? error.name : 'unknown');
    toast.warn('Could not check the Applications. If Call Center has this applicant, create the borrower from their application.');
    return { action: 'none' };
  }
  if (!match) return { action: 'none' };

  const action = await showOpenApplicationModal({
    number: applicationNumber(match.application_id),
    statusLabel: APPLICATION_STATUS_LABEL[match.status] ?? match.status,
    branchName: match.branch_name,
    canOpen: match.can_open,
  });

  return action === 'open' ? { action: 'open', applicationId: match.application_id } : { action };
};
