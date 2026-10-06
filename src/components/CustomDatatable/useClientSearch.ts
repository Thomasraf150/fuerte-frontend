"use client";

import { useMemo, useState } from 'react';

/**
 * The header search for a CLIENT-SIDE list: the rows whose values (or nested values) contain
 * the query. A server-side list gets its rows back untouched (the server searches). Moved out of
 * CustomDatatable/index.tsx unchanged.
 */
export function useClientSearch<T extends object>(data: T[], isServerSide: boolean): {
  query: string;
  setQuery: (query: string) => void;
  rows: T[];
} {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    if (isServerSide || !query) {
      return data;
    }

    console.log("Client-side filtering data with query:", query);
    const searchValue = query.toLowerCase();

    return data.filter((item) =>
      Object.keys(item).some((key) => {
        const value = item[key as keyof T];

        // Handle nested objects safely
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some((nestedValue) =>
            nestedValue &&
            nestedValue.toString().toLowerCase().includes(searchValue)
          );
        }

        // Handle primitive values
        return (
          value &&
          value.toString().toLowerCase().includes(searchValue)
        );
      })
    );
  }, [data, query, isServerSide]);

  return { query, setQuery, rows };
}
