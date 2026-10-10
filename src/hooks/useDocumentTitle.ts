'use client';

import { useEffect } from 'react';
import { APP_NAME, TITLE_SEPARATOR } from '@/utils/appTitle';

/**
 * Names a record page's tab once the record has loaded, CHR's shape "{page} · {record}", ending
 * like every title: "Post payment · TESTPLAN, ANA UNO · MA-0512 · Fuerte Lending". Record pages
 * are Client Components (the login token lives in the browser, so the server cannot fetch the
 * record as CHR's generateMetadata does); their layout.tsx gives the fallback ("Loan") until this
 * runs. Empty parts are dropped; nothing happens until there is a title. On leaving the page the
 * fallback comes back, so a record's name never lingers on the next record of the same route
 * (Next writes no new <title> there: the layout's title is the same).
 */
export function useDocumentTitle(...parts: Array<string | null | undefined | false>): void {
  const title = parts.filter((p): p is string => typeof p === 'string' && p.trim() !== '').join(TITLE_SEPARATOR);
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    const mine = title + TITLE_SEPARATOR + APP_NAME;
    document.title = mine;
    return () => {
      // Only if the tab still shows ours: on a different route Next has already written the next
      // page's title before this cleanup runs, and restoring would put "Loan" back over it.
      if (document.title === mine) document.title = previous;
    };
  }, [title]);
}

/**
 * A loan page's title parts: "{page} · {borrower} · {loan ref}" ("Unreleased loan" before
 * release; no page word on the loan's own page, as in CHR). Empty until the loan has loaded, so
 * the layout's fallback shows meanwhile.
 */
export const loanTitle = (
  page: string | null,
  loan: { loan_ref?: string | null; borrower?: { firstname?: string | null; lastname?: string | null } | null } | null | undefined,
): Array<string | null> => (loan ? [page, borrowerTitle(loan.borrower), loan.loan_ref || 'Unreleased loan'] : []);

/** "LASTNAME, FIRSTNAME", as the lists show a borrower; null until the borrower is known. */
export const borrowerTitle = (b: { firstname?: string | null; lastname?: string | null } | null | undefined): string | null =>
  b && (b.lastname || b.firstname) ? [b.lastname, b.firstname].filter(Boolean).join(', ') : null;
