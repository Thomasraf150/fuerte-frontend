import moment from 'moment';
import { GraphQLConnectionError, parseGraphQLResponse } from './graphqlFetch';
import { useAuthStore } from '@/store';

/**
 * Formats a date range intelligently:
 * - Single day: "September 1, 2025"
 * - Date range: "September 1, 2025 - September 30, 2025"
 */
export const formatDateRange = (
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): string => {
  if (!startDate || !endDate) return '';

  const start = moment(startDate);
  const end = moment(endDate);

  // If same day, show single date
  if (start.isSame(end, 'day')) {
    return start.format('LL');
  }

  // Otherwise show range
  return `${start.format('LL')} - ${end.format('LL')}`;
};

export const loanStatus = (status: number | undefined) => {
  switch (status) {
    case 0:
      return 'For Approval';
      break;
    case 1:
      return 'Approved';
      break;
    case 2:
      return 'For Releasing';
      break;
    case 3:
      return 'Released';
      break;
    default:
      
      break;
  }
};

/**
 * GraphQL fetch with 429 backoff retry. Delegates response parsing (auth
 * failure, non-JSON detection, safe JSON parse) to `parseGraphQLResponse`
 * so the four failure modes stay in one place.
 *
 * Retries network errors and HTTP 429 with exponential backoff. Other
 * non-OK responses bubble up as `GraphQLConnectionError` for the caller's
 * try/catch to handle.
 */
export const fetchWithRecache = async (
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 1000,
): Promise<any> => {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  // Attach the bearer token centrally so every GraphQL call is authenticated
  // (the backend enforces auth per-resolver). Only added when the caller didn't
  // already set Authorization and a token exists — logged-out public calls
  // (e.g. the maintenance check) send none, and hooks that set their own
  // Authorization header are left untouched. Scoped to the Fuerte GraphQL
  // endpoint so the API token is never sent to any other URL.
  if (!headers.has('Authorization') && url === process.env.NEXT_PUBLIC_API_GRAPHQL) {
    const token = useAuthStore.getState().GET_AUTH_TOKEN();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRecache(url, options, retries - 1, delay * 2);
    }
    throw new GraphQLConnectionError(
      'Cannot reach the server. Please check your connection and retry.',
    );
  }

  if (response.status === 429 && retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRecache(url, options, retries - 1, delay * 2);
  }

  return parseGraphQLResponse(response);
};


export const formatToTwoDecimalPlaces = (value: string) => {
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return num.toFixed(2);
  }
  return '';
};

/**
 * Today's date as a LOCAL-timezone 'YYYY-MM-DD' string.
 *
 * Use this instead of `new Date().toISOString().slice(0,10)` when building a
 * business-date filter: toISOString() is UTC, so in Asia/Manila (UTC+8) it
 * returns YESTERDAY between 00:00–07:59 local, sending the wrong `?date=` to
 * date-keyed screens (e.g. Collection List drill-down against a DATE column).
 */
export const todayLocalISO = (): string => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/**
 * Parse a numeric input that may contain thousands-separator commas
 * (e.g. "1,234.56") into a finite number. Returns 0 for null/undefined/empty
 * strings or non-numeric input — never NaN.
 */
export const parseNumericInput = (raw: unknown): number => {
  const cleaned = (raw ?? '').toString().replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

export const toCamelCase = (str: string) => {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatNumberComma = (num: number) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};