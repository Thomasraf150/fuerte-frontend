"use client";

import { useCallback, useRef, useState } from 'react';
import LoanApplicationQueries from '@/graphql/LoanApplicationQueries';
import { graphqlFetch, handleSessionExpired } from '@/utils/graphqlFetch';
import { useAuthStore } from '@/store/authStore';
import type { ServerSidePaginationProps } from '@/components/CustomDatatable';
import { usePagination } from './usePagination';
import { ApplicationUploadResult, LoanApplicationRow, LoanApplicationStatus, NewApplicationRef } from '@/utils/DataTypes';
import { readGoogleFormPdf } from '@/utils/googleFormPdf/readGoogleFormPdf';

const API = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:8080/api

/** Mirrors the backend's `max:10240` rule, so a large file fails before a slow upload. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
/** Mirrors the paste endpoint's `max:1000000` rule. */
const MAX_PASTE_CHARS = 1_000_000;

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

/** The JSON body of the upload, PDF and paste endpoints, on success or failure. */
interface UploadBody {
  status?: boolean;
  message?: string;
  added?: number;
  already_here?: number;
  skipped?: ApplicationUploadResult['skipped'];
  flagged?: ApplicationUploadResult['flagged'];
  /** Read with readNewApplications: an answer from before this field existed has none. */
  new_applications?: unknown;
}

/** How a failure the server did not explain is worded, per way in. */
interface Wording {
  unfinished: string;
  retry: string;
}

/**
 * The backend dedupes every response it has already stored, so after any unclear
 * failure the honest, safe advice is to send it again. We cannot promise "nothing
 * was saved" when we never saw the server's answer.
 */
const UPLOAD_WORDING: Wording = {
  unfinished: 'The upload did not finish',
  retry: 'Upload the same file again. Applicants already added are never added twice.',
};
const PASTE_WORDING: Wording = {
  unfinished: 'Adding the pasted rows did not finish',
  retry: 'Paste the same rows again. Applicants already added are never added twice.',
};

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

const authHeader = (): Record<string, string> => {
  const token = useAuthStore.getState().GET_AUTH_TOKEN();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Sends the file exactly as chosen. A network failure becomes a plain sentence. */
async function postResponsesFile(file: File): Promise<Response> {
  const body = new FormData();
  body.append('file', file);
  try {
    return await fetch(`${API}/applications/upload`, {
      method: 'POST',
      // No Content-Type: the browser sets the multipart boundary. Accept JSON so
      // validation and auth failures come back as JSON, not a redirect.
      headers: { Accept: 'application/json', ...authHeader() },
      body,
    });
  } catch (error) {
    console.error('[useLoanApplications] upload could not reach the server', error);
    throw new Error(`Cannot reach the server. Check your connection. ${UPLOAD_WORDING.retry}`);
  }
}

/** POSTs JSON to the applications API. A network failure becomes a plain sentence. */
async function postJson(path: string, body: unknown, wording: Wording): Promise<Response> {
  try {
    return await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[useLoanApplications] could not reach the server', { path, error });
    throw new Error(`Cannot reach the server. Check your connection. ${wording.retry}`);
  }
}

const isPdf = (file: File): boolean => /\.pdf$/i.test(file.name) || file.type === 'application/pdf';

/** Reads the PDF in the browser and sends its answers. The file itself never leaves the page. */
async function postPdfAnswers(file: File): Promise<Response> {
  const { answers, problems } = await readGoogleFormPdf(file);
  // Problems name question titles only, never an answer.
  if (problems.length) console.warn('[useLoanApplications] the PDF reader could not classify', problems);
  return postJson('/applications/pdf', { file_name: file.name.slice(0, 255), answers }, UPLOAD_WORDING);
}

/** The body as JSON. An HTML error page from a proxy or a PHP crash becomes a plain sentence, never echoed. */
async function readJsonBody(res: Response, wording: Wording): Promise<UploadBody | null> {
  try {
    return JSON.parse(await res.text()) as UploadBody | null;
  } catch {
    console.error('[useLoanApplications] the server returned a non-JSON response', { status: res.status });
    throw new Error(`${wording.unfinished} (HTTP ${res.status}). ${wording.retry}`);
  }
}

/**
 * The applications the intake just added, as links need them: a whole id above zero and a name.
 * No field, or something else in its place, reads as none; an entry that is not one is left out,
 * so the panel never draws a link to nowhere.
 */
const readNewApplications = (value: unknown): NewApplicationRef[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: { id?: unknown; full_name?: unknown } | null) => {
    const id = Number(item?.id);
    return Number.isSafeInteger(id) && id > 0 && typeof item?.full_name === 'string' ? [{ id, full_name: item.full_name }] : [];
  });
};

const toResult = (body: UploadBody): ApplicationUploadResult => ({
  added: Number(body.added) || 0,
  already_here: Number(body.already_here) || 0,
  skipped: body.skipped ?? [],
  flagged: body.flagged ?? [],
  new_applications: readNewApplications(body.new_applications),
});

/** The server's answer to an upload, PDF or paste, or an Error whose message is safe to show as it is. */
async function readUploadResponse(res: Response, wording: Wording = UPLOAD_WORDING): Promise<ApplicationUploadResult> {
  if (res.status === 401) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please sign in again.');
  }
  // The `applications` limiter (10 a minute per user) answers before the controller runs, so nothing was saved.
  if (res.status === 429) {
    throw new Error('Too many uploads and pastes in one minute. Wait a minute, then try again — nothing from this one was saved.');
  }
  const body = await readJsonBody(res, wording);
  if (!body || body.status !== true) {
    console.warn('[useLoanApplications] the server refused', { status: res.status });
    // `||`, not `??`: some framework JSON errors carry an empty `message`.
    throw new Error(body?.message || `${wording.unfinished}. ${wording.retry}`);
  }
  return toResult(body);
}

/** The fixed parts of the table's server-side pagination props. */
const TABLE_OPTIONS = {
  // The table's search box has no label; this placeholder is its accessible name.
  searchPlaceholder: 'Search name or mobile',
  pageSizeOptions: [10, 20, 50, 100],
  recordType: 'application',
  recordTypePlural: 'applications',
};

/** The ways in: the Google Forms download (.zip/.csv), one response saved as a PDF, and rows pasted from the Sheet. */
const useIntake = () => {
  const [uploading, setUploading] = useState(false);
  const [pasting, setPasting] = useState(false);

  /** POST the download exactly as Google gave it, or read a response PDF and POST its answers. */
  const uploadResponses = useCallback(async (file: File): Promise<ApplicationUploadResult> => {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error('The file is larger than 10 MB.');
    setUploading(true);
    try {
      return await readUploadResponse(isPdf(file) ? await postPdfAnswers(file) : await postResponsesFile(file));
    } finally {
      setUploading(false);
    }
  }, []);

  /** POST rows copied from the responses Sheet exactly as pasted: tabs and line breaks are the columns and rows. */
  const pasteRows = useCallback(async (text: string): Promise<ApplicationUploadResult> => {
    if (text.length > MAX_PASTE_CHARS) {
      throw new Error('Paste fewer rows at a time, or upload the Google Forms download instead.');
    }
    setPasting(true);
    try {
      return await readUploadResponse(await postJson('/applications/paste', { text }, PASTE_WORDING), PASTE_WORDING);
    } finally {
      setPasting(false);
    }
  }, []);

  return { uploading, uploadResponses, pasting, pasteRows };
};

/** The Applications list (server-side paging, search, status filter) and the ways to add applicants. */
const useLoanApplications = () => {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>('all');
  const [loaded, setLoaded] = useState<LoadedApplications | null>(null);
  const intake = useIntake();
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
    statusFilter, setStatusFilter, serverSidePaginationProps, ...intake,
  };
};

export default useLoanApplications;
