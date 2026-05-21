"use client";

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store';
import { fetchWithRecache } from '@/utils/helper';

/**
 * Options for a single PDF download.
 *
 * The flow is fixed (open popup → call GraphQL → navigate popup → toast).
 * Callers customize only the parts that actually differ between print
 * features: the mutation, the response shape, and the user-facing strings.
 */
interface DownloadOpts {
  /** GraphQL mutation document that returns a URL string. */
  query: string;
  /** Variables passed verbatim to the mutation. */
  variables: Record<string, unknown>;
  /** Pulls the PDF URL out of response.data — each mutation names it differently. */
  extractUrl: (data: any) => string | null | undefined;
  /** Loading text rendered in the popup while the PDF is generated. */
  loadingTitle?: string;
  /** Optional success toast after the popup navigates to the PDF. */
  successMessage?: string;
  /** Error toast shown on any failure. */
  errorMessage?: string;
}

const LOADER_HTML = (title: string) => `
  <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif;
               display: flex; align-items: center; justify-content: center;
               height: 100vh; margin: 0; background: #f5f5f5; }
        .loader { text-align: center; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db;
                   border-radius: 50%; width: 40px; height: 40px;
                   animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin {
          0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="loader">
        <div class="spinner"></div>
        <h2>${title}</h2>
        <p>Please wait while we prepare your document.</p>
      </div>
    </body>
  </html>
`;

/**
 * Shared PDF-download flow for backend-rendered PDFs (DomPDF → /storage/pdf/…).
 *
 * Why a hook: every print feature in Fuerte does the same six steps:
 *   1. Open a blank window synchronously (else popup blockers kill it).
 *   2. Paint a loader into that window.
 *   3. POST to the GraphQL endpoint with the auth token.
 *   4. Surface GraphQL errors as toasts and close the popup.
 *   5. On success, navigate the popup to BASE_URL + the returned path.
 *   6. Toast the user.
 *
 * Without this hook those six steps live duplicated in each `use<Feature>`
 * hook. Centralising them keeps copy-paste drift (different error messages,
 * inconsistent loader UI) from creeping in.
 */
export function useDownloadPdf() {
  const [printing, setPrinting] = useState(false);

  const download = async (opts: DownloadOpts): Promise<void> => {
    const {
      query,
      variables,
      extractUrl,
      loadingTitle = 'Generating PDF…',
      successMessage,
      errorMessage = 'Failed to generate PDF.',
    } = opts;

    // Must open synchronously — opening inside the `await` below trips popup
    // blockers in Chrome/Edge because it's no longer a user gesture.
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Please allow popups for this site to view PDFs.');
      return;
    }
    newWindow.document.write(LOADER_HTML(loadingTitle));
    newWindow.document.close();

    try {
      setPrinting(true);
      const token = useAuthStore.getState().GET_AUTH_TOKEN();

      const response = await fetchWithRecache(`${process.env.NEXT_PUBLIC_API_GRAPHQL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.errors?.length) {
        if (!newWindow.closed) newWindow.close();
        toast.error(response.errors[0]?.message || errorMessage);
        return;
      }

      const pdfUrl = extractUrl(response.data);
      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.startsWith('Failed')) {
        if (!newWindow.closed) newWindow.close();
        toast.error(errorMessage);
        return;
      }

      newWindow.location.href = process.env.NEXT_PUBLIC_BASE_URL + pdfUrl;
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch {
      if (!newWindow.closed) newWindow.close();
      toast.error(errorMessage);
    } finally {
      setPrinting(false);
    }
  };

  return { download, printing };
}

export default useDownloadPdf;
