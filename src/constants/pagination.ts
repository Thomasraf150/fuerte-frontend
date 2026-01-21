/**
 * Pagination constants matching backend limits.
 * Keep in sync with fuerte-backend/config/pagination.php
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
 */

// Maximum records per page for standard queries (borrowers, loans, etc.)
export const MAX_PAGE_SIZE = 100;

// Maximum records for dropdown/reference data queries (loan codes, products, clients)
export const MAX_DROPDOWN_SIZE = 200;

// Default page size when not specified
export const DEFAULT_PAGE_SIZE = 20;

// Minimum records per page
export const MIN_PAGE_SIZE = 1;

// Standard page size options for UI dropdowns
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// Type for page size options
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/**
 * Enforce pagination limits on a requested page size.
 * Caps values silently to maintain backwards compatibility.
 *
 * @param requestedSize - The requested page size
 * @param isDropdown - Whether this is for dropdown/reference data (uses higher limit)
 * @returns The enforced page size within limits
 */
export function enforcePageLimit(
  requestedSize: number,
  isDropdown: boolean = false
): number {
  const max = isDropdown ? MAX_DROPDOWN_SIZE : MAX_PAGE_SIZE;
  return Math.min(Math.max(MIN_PAGE_SIZE, requestedSize), max);
}

/**
 * Validate if a page size is within allowed limits.
 *
 * @param pageSize - The page size to validate
 * @param isDropdown - Whether this is for dropdown/reference data
 * @returns true if valid, false if exceeds limits
 */
export function isValidPageSize(
  pageSize: number,
  isDropdown: boolean = false
): boolean {
  const max = isDropdown ? MAX_DROPDOWN_SIZE : MAX_PAGE_SIZE;
  return pageSize >= MIN_PAGE_SIZE && pageSize <= max;
}
