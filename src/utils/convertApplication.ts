/**
 * Create as borrower (/borrowers/new?application=<id>): the pure parts, with no React and
 * no network, so the Playwright runner tests them directly
 * (tests/e2e/26-new-application/create-as-borrower.spec.ts):
 *   - parseApplicationId, applicationIdFromSearch: an application's id from text (the page's
 *     address, the ?application= parameter), when it is a usable one;
 *   - NOT_FOUND_MESSAGE, isNotFoundMessage: the server's one sentence for an application that
 *     is missing or not the user's to open;
 *   - applicationNumber: the number staff see for an application (#000123);
 *   - notConvertibleReason: why an application cannot become a borrower yet;
 *   - withApplication: saveBorrower's variables for converting one;
 *   - branchChoicesFor: the Branch picker's one choice, the application's branch.
 */
import type { LoanApplicationRecord, SelectOption } from '@/utils/DataTypes';

/** The largest id GraphQL's Int takes: getLoanApplication(id: Int!) refuses anything above it. */
const MAX_ID = 2_147_483_647;

/**
 * An application's id from text: digits only, a whole number from 1 up to the largest Int.
 * Anything else ("abc", "", "0", "-3", "7abc", "1.5", "1e3", " 7", an id above Int) is no id.
 * "007" is 7. The one parser for the page's address and for ?application=.
 */
export function parseApplicationId(value: string | null | undefined): number | null {
  if (value === null || value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id >= 1 && id <= MAX_ID ? id : null;
}

/**
 * The application the URL names: the `application` parameter, when parseApplicationId reads
 * it as an id. Anything else is no id, and New Borrower opens as it always has. A repeated
 * parameter reads as its first.
 */
export function applicationIdFromSearch(search: string): number | null {
  return parseApplicationId(new URLSearchParams(search).get('application'));
}

/**
 * The server's one sentence for an application that is missing, deleted or not the user's to
 * open (ApplicationEditService::NOT_FOUND, the same for all three so an id cannot be used to
 * find out which applications exist). The application page and New Borrower both match it
 * here: one definition, so they cannot drift apart.
 */
export const NOT_FOUND_MESSAGE = 'Application not found.';

/** Whether a refusal is that sentence, in whatever case and with whatever words around it. */
export const isNotFoundMessage = (message: string | null | undefined): boolean => /application not found/i.test(message ?? '');

/** What staff see as an application's number: its id to six digits, "#000123". A longer id is not cut. */
export const applicationNumber = (id: number): string => `#${String(id).padStart(6, '0')}`;

/**
 * Why an application cannot become a borrower yet, or null when it can. The checks run in
 * the order the server's do (ApplicationConversionService::assertConvertible), so the page
 * and the server name the same reason when more than one holds. Who may convert, and whether
 * the application is visible, are the server's to say: getLoanApplication already refuses
 * what the user may not see.
 *
 * 'other-branch' is the server's last check (OTHER_BRANCH): the borrower is filed on the
 * application's branch, and everyone but the Owner must have that branch. It needs to know
 * which branches the user has (`access`), so it is judged only when that is known: without it,
 * or when the list did not load, the server still refuses at the save.
 */
export type ConversionBlock = 'converted' | 'no-branch' | 'not-interviewed' | 'other-branch';

/**
 * Which branches the signed-in user may create a borrower in, as far as the page can tell:
 *   any      the Owner: the server files an Owner's borrower on the application's own branch;
 *   some     everyone else: the branches they have (getMyAccessibleBranchSubs). It is close to the
 *            list the server checks the borrower's branch against, but not identical: it leaves out
 *            deleted branches, and a user with a single branch is stamped with their home branch.
 *            The server still decides; this only spares a refusal after the form is filled;
 *   unknown  the list has not come, or did not load: no judgement is made.
 */
export type BranchAccess = { kind: 'any' } | { kind: 'some'; branchSubIds: readonly number[] } | { kind: 'unknown' };

/** Why Create as borrower is not for this user: the application is on a branch they do not have. */
export const OTHER_BRANCH_TITLE = 'This application is on another branch';
export const OTHER_BRANCH_HINT = 'Ask that branch, or the Owner, to create the borrower.';
/** The same, as the one sentence the application page prints under the button. */
export const OTHER_BRANCH_REASON = `${OTHER_BRANCH_TITLE}. ${OTHER_BRANCH_HINT}`;

export function notConvertibleReason(
  application: Pick<LoanApplicationRecord, 'status' | 'branch_sub_id' | 'borrower_id'>,
  access?: BranchAccess,
): ConversionBlock | null {
  if (application.status === 'borrower_created' || application.borrower_id != null) return 'converted';
  if (application.branch_sub_id == null) return 'no-branch';
  if (application.status !== 'interviewed') return 'not-interviewed';
  if (access?.kind === 'some' && !access.branchSubIds.includes(application.branch_sub_id)) return 'other-branch';
  return null;
}

/** What converting adds to a save: the application, and the branch the borrower must be in. */
export interface ApplicationConversion {
  applicationId: number;
  branchSubId: number;
}

/**
 * The Branch picker's one choice while converting (BorrowerDetails' `branchChoices`): the
 * application's branch, by the id the save sends and the name the application carries. Offered
 * alone, the picker shows that branch and cannot be pointed at another, whoever is signed in.
 * The name falls back to the id for an application whose branch came without one.
 */
export const branchChoicesFor = (
  application: Pick<LoanApplicationRecord, 'branch_sub'>,
  branchSubId: number,
): SelectOption[] => [{ value: String(branchSubId), label: application.branch_sub?.name ?? `Branch ${branchSubId}` }];

/**
 * saveBorrower's variables for converting an application: the plain variables, plus
 * `application_id` (the operation's own top-level argument) and the application's branch in
 * inputBorrInfo. The branch goes for everyone, a user with one branch included, who sends none
 * otherwise: the server refuses a borrower in any branch but the application's, and without
 * it a user whose home branch differs would be refused. The input is not changed.
 */
export function withApplication<V extends { inputBorrInfo: object }>(
  variables: V,
  { applicationId, branchSubId }: ApplicationConversion,
) {
  return {
    ...variables,
    inputBorrInfo: { ...variables.inputBorrInfo, branch_sub_id: String(branchSubId) },
    application_id: applicationId,
  };
}
