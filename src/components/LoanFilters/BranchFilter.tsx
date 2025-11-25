"use client";

import React, { useEffect, useState } from "react";
import BranchQueryMutations from "@/graphql/BranchQueryMutation";
import { useAuthStore } from "@/store";

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
                orderBy: "name",
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

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    onBranchSubIdChange(value);
  };

  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
        Branch/Area
      </label>
      <div className="relative z-20 bg-transparent dark:bg-form-input">
        <select
          value={branchSubId ?? ""}
          onChange={handleBranchChange}
          disabled={loading || !!error}
          className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
            branchSubId
              ? "text-black dark:text-white"
              : "text-body dark:text-bodydark"
          } ${loading || error ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="" className="text-body dark:text-bodydark">
            {loading ? "Loading branches..." : error ? "Error loading branches" : "All Branches"}
          </option>
          {!loading && !error && branches.map((branch) => (
            <option
              key={branch.id}
              value={branch.id}
              className="text-body dark:text-bodydark"
            >
              {branch.name}
            </option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.8">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill=""
              ></path>
            </g>
          </svg>
        </span>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default BranchFilter;
