import { showConfirmationModal } from '@/components/ConfirmationModal';
import BorrowerQueryMutations from '@/graphql/BorrowerQueryMutations';
import { BorrowerInfo } from '@/utils/DataTypes';
import { graphqlFetch } from '@/utils/graphqlFetch';

interface AuthData {
  authToken?: string;
  user?: {
    branch_sub_id?: number;
    assignedBranchSubIds?: number[];
    id?: number;
  };
}

interface ProblemFlag {
  isProblem: boolean;
  shortfall: string;
  cutoffsMissed: number;
  uaCutoffs: number;
  problemLoanCount: number;
  oldestUnpaidDueDate: string | null;
}

interface CrossBranchResult {
  existsElsewhere: boolean;
  branches: string[];
  isProblem: boolean;
  worstCutoffsMissed: number;
  matchCount: number;
  existsInMyBranches: boolean;
  myBranches: string[];
  myBranchIsProblem: boolean;
  myBranchWorstCutoffs: number;
  myBranchMatchCount: number;
}

/**
 * Safely parse auth store from localStorage with error handling
 */
const getAuthDataFromStorage = (): AuthData => {
  try {
    const storedAuthStore = localStorage.getItem('authStore') ?? '{}';
    const parsed = JSON.parse(storedAuthStore);
    return parsed['state'] ?? {};
  } catch (error) {
    console.error('Failed to parse authStore from localStorage:', error);
    return {};
  }
};

const pesos = (raw: string | number | null | undefined): string => {
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
};

/**
 * Problem-account badge. Always RED when flagged — the 2-cut-off rule already
 * means "problem na", so there is no softer tier worth communicating. Copy leans
 * on "no collection" because that is exactly what the branch managers use to
 * define a problem account.
 */
const problemBadgeHtml = (p: ProblemFlag | null | undefined): string => {
  if (!p || !p.isProblem) return '';
  const since = p.oldestUnpaidDueDate ? ` · unpaid since ${p.oldestUnpaidDueDate}` : '';
  return (
    `<div style="margin-top:10px;padding:10px 12px;border-radius:6px;background:#FEF2F2;border-left:4px solid #DC2626;">` +
      `<strong style="color:#DC2626;">⚠ PROBLEM ACCOUNT</strong><br/>` +
      `<span style="color:#991B1B;">${p.uaCutoffs} cut-off${p.uaCutoffs === 1 ? '' : 's'} with no collection · ₱${pesos(p.shortfall)} shortfall${since}</span>` +
    `</div>`
  );
};

const goodStandingHtml = (): string =>
  `<div style="margin-top:10px;padding:10px 12px;border-radius:6px;background:#F0FDF4;border-left:4px solid #16A34A;">` +
    `<strong style="color:#16A34A;">✓ Not a problem account</strong>` +
  `</div>`;

/**
 * Cross-branch section: another branch already holds a matching name/contact.
 * Deliberately shows only the branch name(s) + problem flag — never the other
 * borrower's details.
 */
/**
 * Match inside the caller's OWN accessible branches, found by the looser
 * first+last probe. This exists because the strict duplicate check requires an
 * exact middlename too — so "Alma Yubos" missed "Alma ABANSE Yubos" and the
 * modal wrongly reported "safe to continue".
 */
const inMyBranchesHtml = (c: CrossBranchResult | null | undefined, alreadyShownAsDuplicate: boolean): string => {
  if (!c || !c.existsInMyBranches || alreadyShownAsDuplicate) return '';
  const problemLine = c.myBranchIsProblem
    ? `<br/><span style="color:#DC2626;font-weight:600;">⚠ Problem account: YES (${c.myBranchWorstCutoffs} cut-offs)</span>`
    : '';
  const where = c.myBranches.length ? `<strong>${c.myBranches.join(', ')}</strong>` : 'your branch';
  return (
    `<div style="margin-top:10px;padding:10px 12px;border-radius:6px;background:#FFFBEB;border-left:4px solid #D97706;">` +
      `<strong style="color:#B45309;">⚠ Similar name already in your branch</strong><br/>` +
      `${c.myBranchMatchCount} existing borrower${c.myBranchMatchCount === 1 ? '' : 's'} in ${where} ${c.myBranchMatchCount === 1 ? 'matches' : 'match'} this first + last name.` +
      problemLine +
      `<br/><em style="font-size:0.85em;color:#6B7280;">Middle name may differ — open Borrowers and verify before creating.</em>` +
    `</div>`
  );
};

const crossBranchHtml = (c: CrossBranchResult | null | undefined): string => {
  if (!c || !c.existsElsewhere) return '';
  const problemLine = c.isProblem
    ? `<span style="color:#DC2626;font-weight:600;">⚠ Problem account: YES (${c.worstCutoffsMissed} cut-offs)</span>`
    : `Problem account: No`;
  return (
    `<div style="margin-top:10px;padding:10px 12px;border-radius:6px;background:#FFFBEB;border-left:4px solid #D97706;">` +
      `<strong style="color:#B45309;">⚠ Also found in another branch</strong><br/>` +
      `Branch(es): <strong>${c.branches.join(', ') || 'another branch'}</strong><br/>` +
      `${problemLine}<br/>` +
      `<em style="font-size:0.85em;color:#6B7280;">Name / contact match only — verify identity with that branch.</em>` +
    `</div>`
  );
};

const buildDuplicateBody = (duplicate: any): string => {
  const borrower = duplicate.duplicateBorrower;
  const middlename = borrower.middlename ? ` ${borrower.middlename}` : '';
  const duplicateTypes = duplicate.duplicateType?.split(',') || [];

  let matched = '';
  if (duplicateTypes.length === 2) matched = '<strong>contact number</strong> and <strong>full name</strong>';
  else if (duplicateTypes.includes('contact_number')) matched = '<strong>contact number</strong>';
  else if (duplicateTypes.includes('full_name')) matched = '<strong>full name</strong>';

  return (
    `<p>A borrower with the same ${matched} already exists in your branch:</p>` +
    `<br/>` +
    `<p><strong>Full Name:</strong> ${borrower.firstname}${middlename} ${borrower.lastname}</p>` +
    `<p><strong>Contact Number:</strong> ${borrower.borrower_details?.contact_no || 'N/A'}</p>` +
    problemBadgeHtml(duplicate.duplicateProblem)
  );
};

/**
 * Check for duplicate borrowers within the same branch (runs at save time).
 *
 * @param data - Borrower information to check
 * @returns Promise<boolean> - true if no duplicates (proceed), false if duplicate found (stop)
 */
export const checkBorrowerDuplicates = async (data: BorrowerInfo): Promise<boolean> => {
  const { CHECK_BORROWER_DUPLICATE } = BorrowerQueryMutations;

  const authData = getAuthDataFromStorage();
  const branchSubId =
    (data as any).branch_sub_id ?? authData.user?.branch_sub_id ?? null;

  try {
    const variables = {
      firstname: data.firstname,
      middlename: data.middlename || null,
      lastname: data.lastname,
      dob: data.dob,
      email: data.email || null,
      contact_no: data.contact_no || null,
      excludeId: data.id || null,
      branch_sub_id: branchSubId,
    };

    const result = await graphqlFetch(CHECK_BORROWER_DUPLICATE, variables);

    if (result.data?.checkBorrowerDuplicate?.isDuplicate) {
      const duplicate = result.data.checkBorrowerDuplicate;

      await showConfirmationModal(
        'Duplicate Borrower Found',
        buildDuplicateBody(duplicate) +
        `<br/>` +
        `<p>Please verify if this is the same person. The borrower was not created to prevent duplicates.</p>`,
        'Close',
        false, // Hide cancel button - only show Close
        true   // Use HTML formatting
      );

      return false; // Duplicate found
    }

    return true; // No duplicates, proceed
  } catch (error) {
    console.error('Duplicate check error:', error);
    // On error, allow to proceed but warn the user
    const { toast } = await import('react-toastify');
    toast.warn('Duplicate check failed — please verify manually');
    return true;
  }
};

/**
 * Assemble the Check-Borrower modal body from every bucket we probed.
 *
 * The green "safe to continue" is only ever shown when ALL of them came back
 * empty — the exact-match duplicate check alone is not enough to make that
 * promise, and claiming it wrongly is the worst thing this feature can do.
 */
const buildCheckBody = (duplicate: any, cross: CrossBranchResult | undefined): string => {
  const isExactDuplicate = Boolean(duplicate?.isDuplicate);
  const sameBranch = isExactDuplicate ? buildDuplicateBody(duplicate) : '';
  const myBranches = inMyBranchesHtml(cross, isExactDuplicate);
  const otherBranch = crossBranchHtml(cross);

  if (!sameBranch && !myBranches && !otherBranch) {
    return (
      `<div style="padding:10px 12px;border-radius:6px;background:#F0FDF4;border-left:4px solid #16A34A;">` +
      `<strong style="color:#16A34A;">✓ No existing borrower found</strong><br/>` +
      `No match by name or contact number in your branch or any other branch. Safe to continue.` +
      `</div>`
    );
  }

  const noExact = !sameBranch
    ? `<p style="font-size:0.9em;color:#6B7280;">No exact duplicate (name + middle name + contact) in your branch — but see below.</p>`
    : '';

  return (
    (sameBranch || noExact) +
    myBranches +
    otherBranch +
    `<br/><p style="font-size:0.9em;color:#6B7280;">This is only a check — nothing has been saved. Continue filling the form if this is a new person.</p>`
  );
};

/**
 * Manual "Check Borrower" button on the create-borrower form. Runs the
 * same-branch duplicate check (with problem badge) AND the minimal cross-branch
 * probe in parallel, then shows one informational modal. Purely advisory — it
 * never blocks or creates anything.
 */
export const checkBorrowerNow = async (data: BorrowerInfo): Promise<void> => {
  const { CHECK_BORROWER_DUPLICATE, CHECK_BORROWER_CROSS_BRANCH } = BorrowerQueryMutations;
  const { toast } = await import('react-toastify');

  const firstname = (data.firstname || '').trim();
  const lastname = (data.lastname || '').trim();
  const contactNo = (data.contact_no || '').trim();

  if ((!firstname || !lastname) && !contactNo) {
    toast.info('Enter a first and last name (or a contact number) to check.');
    return;
  }

  const authData = getAuthDataFromStorage();
  const branchSubId =
    (data as any).branch_sub_id ?? authData.user?.branch_sub_id ?? null;

  try {
    const [dupRes, crossRes] = await Promise.all([
      graphqlFetch(CHECK_BORROWER_DUPLICATE, {
        firstname,
        middlename: data.middlename || null,
        lastname,
        dob: data.dob || '1900-01-01',
        email: data.email || null,
        contact_no: contactNo || null,
        excludeId: data.id || null,
        branch_sub_id: branchSubId,
      }),
      graphqlFetch(CHECK_BORROWER_CROSS_BRANCH, {
        firstname: firstname || null,
        middlename: data.middlename || null,
        lastname: lastname || null,
        contact_no: contactNo || null,
      }),
    ]);

    const duplicate = dupRes.data?.checkBorrowerDuplicate;
    const cross: CrossBranchResult | undefined = crossRes.data?.checkBorrowerCrossBranch;

    await showConfirmationModal('Borrower Check', buildCheckBody(duplicate, cross), 'Close', false, true);
  } catch (error) {
    console.error('Borrower check error:', error);
    toast.warn('Borrower check failed — please try again.');
  }
};

/**
 * Get authenticated user data from localStorage
 */
export const getAuthUserData = (): AuthData => {
  return getAuthDataFromStorage();
};
