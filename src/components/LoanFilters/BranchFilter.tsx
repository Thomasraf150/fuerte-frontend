"use client";

import React, { useEffect, useMemo, useState } from "react";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import { useAuthStore } from "@/store";
import ReactSelect from "@/components/ReactSelect";
import { SelectOption } from "@/utils/DataTypes";

/** Sentinel option: empty value === "no branch filter". */
const ALL_BRANCHES_OPTION: SelectOption = { value: "", label: "All Branches" };

interface BranchFilterProps {
  branchSubId: number | null;
  onBranchSubIdChange: (branchSubId: number | null) => void;
}

interface BranchSubData {
  id: number;
  name: string;
}

const BranchFilter: React.FC<BranchFilterProps> = ({
  branchSubId,
  onBranchSubIdChange,
}) => {
  const [branches, setBranches] = useState<BranchSubData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get authentication token following useCoa pattern
        const { GET_AUTH_TOKEN } = useAuthStore.getState();

        const response = await fetch(
          process.env.NEXT_PUBLIC_API_GRAPHQL || "http://localhost:8000/fuerte-api",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GET_AUTH_TOKEN()}`,
            },
            body: JSON.stringify({
              query: BranchQueryMutations.GET_ALL_SUB_BRANCH_QUERY,
              variables: {
                orderBy: "name_asc",
              },
            }),
          }
        );

        const result = await response.json();

        if (result.errors) {
          const errorMsg = result.errors[0]?.message || "Failed to fetch branches";
          console.error('[BranchFilter] GraphQL errors:', result.errors);
          setError(errorMsg);
          return;
        }

        if (result.data?.getAllBranch) {
          const fetchedBranches = result.data.getAllBranch;
          setBranches(fetchedBranches);
        } else {
          setBranches([]);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to fetch branches";
        console.error('[BranchFilter] Fetch error:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // "All Branches" first, then every sub-branch. Values are strings because
  // SelectOption.value is a string; they're parsed back to numbers on change.
  const branchOptions = useMemo<SelectOption[]>(
    () => [
      ALL_BRANCHES_OPTION,
      ...branches.map((branch) => ({
        value: String(branch.id),
        label: branch.name,
      })),
    ],
    [branches]
  );

  // Never render blank: an unset filter maps back to the "All Branches" option.
  const selectedOption =
    branchOptions.find((option) => option.value === String(branchSubId ?? "")) ??
    ALL_BRANCHES_OPTION;

  const handleBranchChange = (option: SelectOption | null) => {
    const rawValue = option?.value ?? "";
    onBranchSubIdChange(rawValue === "" ? null : parseInt(rawValue, 10));
  };

  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
        Branch/Area
      </label>
      <ReactSelect
        aria-label="Filter by branch"
        options={branchOptions}
        value={selectedOption}
        onChange={handleBranchChange}
        placeholder="All Branches"
        isDisabled={loading || !!error}
        isLoading={loading}
        loadingMessage={() => "Loading branches..."}
        noOptionsMessage={() =>
          error ? "Error loading branches" : "No branches found"
        }
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default BranchFilter;
