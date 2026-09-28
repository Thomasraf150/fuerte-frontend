"use client";

import { useCallback, useRef, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch, handleSessionExpired } from '@/utils/graphqlFetch';
import { useAuthStore } from '@/store/authStore';
import type { ServerSidePaginationProps } from '@/components/CustomDatatable';
import { usePagination } from './usePagination';
import { ApplicationUploadResult, LoanApplicationRow, LoanApplicationStatus } from '@/utils/DataTypes';

const API = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8080/api

/** Mirrors the backend's `max:10240` rule, so a large file fails before a slow upload. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ApplicationStatusFilter = 'all' | LoanApplicationStatus;

/**
 * What the rows on screen were actually fetched with. The page words its result
 * line and its empty state from this rather than from the filter and the search
 * box, which run ahead of the data (search is debounced, requests take time).
 */
export interface LoadedApplications {
  total: number;
  status: ApplicationStatusFilter;
  search: string;
}

interface ApplicationsPage {
  data: LoanApplicationRow[];
  paginatorInfo: { total: number; currentPage: number; lastPage: number; hasMorePages: boolean };
}

/** The upload endpoint's JSON body, on success or failure. */
interface UploadBody {
  status?: boolean;
  message?: string;
  added?: number;
  already_here?: number;
  skipped?: ApplicationUploadResult['skipped'];
  flagged?: ApplicationUploadResult['flagged'];
}

/**
 * The backend dedupes every response it has already stored, so after any unclear
 * failure the honest, safe advice is to upload again. We cannot promise "nothing
 * was saved" when we never saw the server's answer.
 */
const RETRY_ADVICE = 'Upload the same file again. Applicants already added are never added twice.';

/** One page of the list, or an Error whose message the page can show. */
async function fetchApplicationsPage(
  first: number,
  page: number,
  search?: string,
  status?: string,
): Promise<ApplicationsPage> {
  const result = await graphqlFetch<{ getLoanApplications: ApplicationsPage | null }>(
    LoanApplicationQueries.GET_LOAN_APPLICATIONS_QUERY,
    {
      // first/page always go: the rules reject an explicit null. search/status only when set.
      first,
      page,
      ...(search ? { search } : {}),
      ...(status && status !== 'all' ? { status } : {}),
    },
  );
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || 'Could not load applications.');
  }
  if (!result.data?.getLoanApplications) {
    throw new Error('The server returned no application data. Please retry.');
  }
  return result.data.getLoanApplications;
}

/** Sends the file exactly as chosen. A network failure becomes a plain sentence. */
async function postResponsesFile(file: File): Promise<Response> {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();
  const body = new FormData();
  body.append('file', file);
  try {
    return await fetch(`${API}/applications/upload`, {
      method: 'POST',
      // No Content-Type: the browser sets the multipart boundary. Accept JSON so
      // validation and auth failures come back as JSON, not a redirect.
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
    });
  } catch (error) {
    console.error('[useLoanApplications] upload could not reach the server', error);
    throw new Error(`Cannot reach the server. Check your connection. ${RETRY_ADVICE}`);
  }
}

/** The upload's response, or an Error whose message is safe to show as it is. */
async function readUploadResponse(res: Response): Promise<ApplicationUploadResult> {
  if (res.status === 401) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please sign in again.');
  }
  let body: UploadBody | null;
  try {
    body = JSON.parse(await res.text()) as UploadBody | null;
  } catch {
    // An HTML error page from a proxy or a PHP crash: log the status, never echo the page.
    console.error('[useLoanApplications] upload returned a non-JSON response', { status: res.status });
    throw new Error(`The upload did not finish (HTTP ${res.status}). ${RETRY_ADVICE}`);
  }
  if (!body || body.status !== true) {
    console.warn('[useLoanApplications] upload refused', { status: res.status });
    // `||`, not `??`: some framework JSON errors carry an empty `message`.
    throw new Error(body?.message || `The upload did not finish. ${RETRY_ADVICE}`);
  }
  return {
    added: Number(body.added) || 0,
    already_here: Number(body.already_here) || 0,
    skipped: body.skipped ?? [],
    flagged: body.flagged ?? [],
  };
}

/** The fixed parts of the table's server-side pagination props. */
const TABLE_OPTIONS = {
  // The table's search box has no label; this placeholder is its accessible name.
  searchPlaceholder: 'Search name or mobile',
  pageSizeOptions: [10, 20, 50, 100],
  recordType: 'application',
  recordTypePlural: 'applications',
};

/** The Applications list (server-side paging, search, status filter) and the Google Form upload. */
const useLoanApplications = () => {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState<LoadedApplications | null>(null);
  // usePagination bumps its request id and calls this function in the same tick, once per
  // request, and applies only the newest response. Counting calls here picks out the same
  // response, so `loaded` always describes the rows on screen. Revisit if it ever retries or prefetches.
  const latestRequest = useRef(0);

  const fetchApplications = useCallback(async (first: number, page: number, search?: string, status?: string) => {
    const request = ++latestRequest.current;
    const found = await fetchApplicationsPage(first, page, search, status);
    if (request === latestRequest.current) {
      const fetchedStatus = (status ?? 'all') as ApplicationStatusFilter;
      setLoaded({ total: found.paginatorInfo.total, status: fetchedStatus, search: search ?? '' });
    }
    return found;
  }, []);

  const { data, loading, error, pagination, searchQuery, goToPage, changePageSize, setSearchQuery, refresh } =
    usePagination<LoanApplicationRow>({ fetchFunction: fetchApplications, config: { initialPageSize: 20 }, statusFilter });

  /** POST the Google Form download (.zip or .csv) exactly as Google gave it. */
  const uploadResponses = useCallback(async (file: File): Promise<ApplicationUploadResult> => {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('The file is larger than 10 MB.');
    setUploading(true);
    try {
      return await readUploadResponse(await postResponsesFile(file));
    } finally {
      setUploading(false);
    }
  }, []);

  const serverSidePaginationProps: ServerSidePaginationProps = {
    ...pagination,
    ...TABLE_OPTIONS,
    onPageChange: goToPage,
    onPageSizeChange: changePageSize,
    searchQuery,
    onSearchChange: setSearchQuery,
  };

  return {
    applications: data, loading, error, refresh, loaded,
    statusFilter, setStatusFilter, uploading, uploadResponses, serverSidePaginationProps,
  };
};

export default useLoanApplications;
