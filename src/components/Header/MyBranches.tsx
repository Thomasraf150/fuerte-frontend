import { useEffect, useRef, useState, type ReactNode } from "react";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import LoanApplicationQueries from "@/graphql/LoanApplicationQueries";
import { useAuthStore } from "@/store/authStore";
import { graphqlFetch } from "@/utils/graphqlFetch";

/** The Owner's role code: the one role that reaches every branch. */
const OWNER_ROLE_CODE = "OWN";
/** Call Center: its branches are the applications' scope, not branch access (BranchAccessService::callCenterBranchSubIds). */
const CALL_CENTER_ROLE_CODE = "CALLCTR";

type BranchSub = { id: string | number; name: string };

/** The slice of the stored login user the header reads. */
export type HeaderUser = {
  role?: { code?: string } | null;
  branch_sub?: { id?: number; name?: string } | null;
  assignedBranchSubIds?: number[];
} | null | undefined;

/**
 * What the header says about where the user works. The home sub-branch alone read as "this is my
 * only branch" to staff with Cross-Branch Access (2026-10-22), so a user who sees more says so.
 * `extra` is how many branches beyond home; 0 for one branch, and for the Owner (`all`).
 */
export function branchScopeOf(user: HeaderUser, liveCount?: number) {
  const all = user?.role?.code === OWNER_ROLE_CODE;
  const count = liveCount ?? user?.assignedBranchSubIds?.length ?? 0;
  return { all, home: user?.branch_sub?.name ?? "", extra: all ? 0 : Math.max(0, count - 1) };
}

/** One answer per sign-in, by token: the header remounts with every page (each wraps DefaultLayout). */
const answers = new Map<string, BranchSub[]>();

/**
 * The user's branches as the server counts them now. The stored login has ids only, goes stale when
 * the Owner changes someone's access, and is empty for Call Center, whose reach (home plus Cross-
 * Branch Access) is its own scope: getApplicationBranches answers that, getMyAccessibleBranchSubs
 * everyone else. The Owner needs no list. A failure is tried again when the menu opens, never in a
 * loop while it stays open.
 */
export function useMyBranches(user: HeaderUser, menuOpen: boolean) {
  const role = user?.role?.code;
  const token = useAuthStore.getState().GET_AUTH_TOKEN() ?? "";
  const skip = !role || role === OWNER_ROLE_CODE;
  const [branches, setBranches] = useState<BranchSub[] | null>(() => answers.get(token) ?? null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (menuOpen) setAttempt((n) => n + 1);
  }, [menuOpen]);

  useEffect(() => {
    if (skip || branches || inFlight.current) return;
    inFlight.current = true;
    setFailed(false);
    const callCenter = role === CALL_CENTER_ROLE_CODE;
    graphqlFetch<{ getApplicationBranches?: BranchSub[] | null; getMyAccessibleBranchSubs?: BranchSub[] | null }>(
      callCenter
        ? LoanApplicationQueries.GET_APPLICATION_BRANCHES_QUERY
        : BranchQueryMutations.GET_MY_ACCESSIBLE_BRANCH_SUBS_QUERY,
    )
      .then((result) => {
        const list = callCenter ? result.data?.getApplicationBranches : result.data?.getMyAccessibleBranchSubs;
        if (!Array.isArray(list)) throw new Error(result.errors?.[0]?.message ?? "no list");
        answers.set(token, list);
        setBranches(list);
      })
      .catch((error) => {
        console.warn("[useMyBranches] the list of the user's branches did not load", {
          message: error instanceof Error ? error.message : String(error),
        });
        setFailed(true);
      })
      .finally(() => {
        inFlight.current = false;
      });
    // `attempt` is the retry: it moves only when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, attempt]);

  return { branches, failed };
}

/** "+3 more": the cue under the name that the home branch is not the only one. */
export function MoreBranchesChip({ extra }: { extra: number }) {
  if (extra < 1) return null;
  return (
    <span className="ml-0.5 inline-block rounded-full bg-olive-100 px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-olive-800 dark:bg-olive-900 dark:text-olive-200">
      +{extra} more
    </span>
  );
}

type ListProps = {
  user: HeaderUser;
  branches: BranchSub[] | null;
  failed: boolean;
};

/** The menu's "Your branches" section: every branch the user sees, home first and marked. */
export function MyBranchesList({ user, branches, failed }: ListProps) {
  const scope = branchScopeOf(user, branches?.length);
  const homeId = Number(user?.branch_sub?.id);

  if (scope.all) {
    return (
      <Section title="Your branches">
        <p className="text-sm">All branches. Your role sees every branch.</p>
      </Section>
    );
  }

  if (scope.extra === 0) {
    return (
      <Section title="Your branch">
        {scope.home ? (
          <ul>
            <BranchRow name={scope.home} home />
          </ul>
        ) : (
          <p className="text-sm">No branch set.</p>
        )}
      </Section>
    );
  }

  const sorted = branches
    ? [...branches].sort((a, b) => Number(Number(b.id) === homeId) - Number(Number(a.id) === homeId))
    : null;

  return (
    <Section title={`Your branches · ${scope.extra + 1}`}>
      {sorted ? (
        <ul className="-mr-2 max-h-48 overflow-y-auto pr-2">
          {sorted.map((b) => (
            <BranchRow key={b.id} name={b.name} home={Number(b.id) === homeId} />
          ))}
        </ul>
      ) : (
        <p className="text-sm">
          {failed ? "Could not load the list. Reopen this menu to try again." : "Loading your branches…"}
        </p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-body dark:text-bodydark2">
        {title}
      </p>
      {children}
    </div>
  );
}

function BranchRow({ name, home = false }: { name: string; home?: boolean }) {
  return (
    <li className="flex list-none items-center justify-between gap-2 py-1 text-sm font-medium text-black dark:text-white">
      <span className="min-w-0 truncate">{name}</span>
      {home ? (
        <span className="shrink-0 rounded-full bg-olive-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-olive-800 dark:bg-olive-900 dark:text-olive-200">
          Home
        </span>
      ) : null}
    </li>
  );
}
