/**
 * Shared two-level (Main Branch -> Sub-Branch) grouping for the Summary
 * Ticket breakdown tables. Both `SummaryTicketByBranch` and
 * `NetMovementsByBranch` consume rows shaped like `BranchHierarchyItem`
 * and need identical group/sort logic; the only thing that varies is
 * which numeric fields each row contributes to the totals.
 */

export const UNGROUPED_MAIN_BRANCH_KEY = -1;
export const UNGROUPED_MAIN_BRANCH_LABEL = 'Unassigned Main Branch';

export interface BranchHierarchyItem {
  main_branch_id: number | null;
  main_branch_name: string | null;
  branch_sub_id: number;
  branch_name: string;   // sub-branch name (legacy column alias from SP)
  branch_code: string;   // sub-branch code (legacy column alias from SP)
}

export interface SubBranchGroup<T extends BranchHierarchyItem> {
  branch_sub_id: number;
  sub_branch_name: string;
  branch_code: string;
  details: T[];
  totals: Record<string, number>;
}

export interface MainBranchGroup<T extends BranchHierarchyItem> {
  main_branch_id: number | null;
  main_branch_name: string;
  subBranches: SubBranchGroup<T>[];
  totals: Record<string, number>;
}

/**
 * Groups a flat array of breakdown rows into Main-Branch -> Sub-Branch -> rows.
 * Sub-branches are sorted alphabetically within each main branch; main branches
 * are sorted alphabetically. Totals are accumulated at both levels using the
 * caller-supplied `extractTotals` function — the keys it returns determine
 * which totals each level tracks (e.g. `{debit, credit}` or `{amount}`).
 */
export function groupBreakdownByMainBranch<T extends BranchHierarchyItem>(
  data: T[],
  extractTotals: (item: T) => Record<string, number>,
): MainBranchGroup<T>[] {
  const totalKeys = data.length > 0 ? Object.keys(extractTotals(data[0])) : [];
  const blankTotals = () => Object.fromEntries(totalKeys.map(k => [k, 0]));

  const mainGroups: Record<number, MainBranchGroup<T> & { _subByKey: Record<number, SubBranchGroup<T>> }> = {};

  for (const item of data) {
    const mainKey = item.main_branch_id ?? UNGROUPED_MAIN_BRANCH_KEY;
    if (!mainGroups[mainKey]) {
      mainGroups[mainKey] = {
        main_branch_id: item.main_branch_id ?? null,
        main_branch_name: item.main_branch_name ?? UNGROUPED_MAIN_BRANCH_LABEL,
        subBranches: [],
        totals: blankTotals(),
        _subByKey: {},
      };
    }
    const main = mainGroups[mainKey];

    const subKey = item.branch_sub_id;
    if (!main._subByKey[subKey]) {
      main._subByKey[subKey] = {
        branch_sub_id: item.branch_sub_id,
        sub_branch_name: item.branch_name,
        branch_code: item.branch_code,
        details: [],
        totals: blankTotals(),
      };
    }
    const sub = main._subByKey[subKey];

    sub.details.push(item);
    const rowTotals = extractTotals(item);
    for (const k of totalKeys) {
      sub.totals[k] += rowTotals[k];
      main.totals[k] += rowTotals[k];
    }
  }

  return Object.values(mainGroups)
    .map(main => {
      const subBranches = Object.values(main._subByKey).sort((a, b) =>
        a.sub_branch_name.localeCompare(b.sub_branch_name),
      );
      const { _subByKey, ...rest } = main;
      return { ...rest, subBranches };
    })
    .sort((a, b) => a.main_branch_name.localeCompare(b.main_branch_name));
}
