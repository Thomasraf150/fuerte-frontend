import BranchQueryMutations from '@/graphql/BranchQueryMutation';
import { useAuthStore } from '@/store/authStore';
import type { BranchAccess } from '@/utils/convertApplication';
import { graphqlFetch } from '@/utils/graphqlFetch';

/** The Owner's role code: the one role that reaches every branch. */
const OWNER_ROLE_CODE = 'OWN';

/**
 * Which branches the signed-in user may create a borrower in (see BranchAccess). The Owner needs
 * no list: the server files an Owner's borrower on the application's own branch. Everyone else
 * gets the list the server checks the borrower's branch against, getMyAccessibleBranchSubs.
 *
 * Never rejects and never blocks: when the list does not come (no connection, an error, an
 * answer without it) the access is "unknown", the caller judges nothing, and the server still
 * refuses. A failure is logged without any name or number: the list holds branch ids only.
 */
export async function fetchBranchAccess(): Promise<BranchAccess> {
  if (useAuthStore.getState().user?.role?.code === OWNER_ROLE_CODE) return { kind: 'any' };
  try {
    const result = await graphqlFetch<{ getMyAccessibleBranchSubs?: { id: string | number }[] | null }>(
      BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY,
    );
    const branches = result.data?.getMyAccessibleBranchSubs;
    if (result.errors?.length || !Array.isArray(branches)) {
      console.warn('[fetchBranchAccess] the list of the user\'s branches did not come', { message: result.errors?.[0]?.message });
      return { kind: 'unknown' };
    }
    return { kind: 'some', branchSubIds: branches.map((branch) => Number(branch.id)) };
  } catch (error) {
    console.warn('[fetchBranchAccess] the list of the user\'s branches did not load', {
      message: error instanceof Error ? error.message : String(error),
    });
    return { kind: 'unknown' };
  }
}
