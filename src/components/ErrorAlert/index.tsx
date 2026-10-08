"use client";

import React from 'react';
import { AlertCircle, RotateCw } from 'react-feather';
import Button from '@/components/Button';

/**
 * A failed load, said in plain words (Phase 8, 2026-10-08). The audit found staff being shown
 * "getCheckVoucher field was null", "./docker.sh prod-deploy" and "Cannot read properties of
 * undefined". Guidance: errors say what happened and what to do next (GOV.UK error messages,
 * NN/g error-message guidelines); colour is never the only signal (WCAG 1.4.1: icon + text).
 *
 * The message itself stays VISIBLE when it is plain words ("The server is temporarily unavailable…
 * your data is safe", "Unauthenticated"): staff need the reason, and parseGraphQLResponse already
 * writes those for people. Only developer jargon (stack-ish text, deploy commands, GraphQL field
 * names) folds under "Details for IT", where it can still be read out for a bug report.
 */

/** Text no branch staffer can act on. */
const TECHNICAL = /docker|artisan|lighthouse|graphql|field (was|is) null|cannot read propert|undefined|typeerror|referenceerror|sqlstate|stack trace|\.php\b|\bat \w+ \(/i;

/** "Error loading general vouchers: <reason>" → "<reason>": the title already says what failed. */
const reasonOf = (detail: string): string => detail.replace(/^error loading [^:]+:\s*/i, '').trim();
interface ErrorAlertProps {
  /** What failed, as staff would say it: "The vouchers didn't load." */
  title: string;
  /** What to do next. Defaults to the retry-then-tell-IT sentence. */
  children?: React.ReactNode;
  /** The raw error message: shown as the reason when it is plain words, else under "Details for IT". */
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const DEFAULT_NEXT = 'Check that you are online, then press Retry. If it happens again, tell IT which page you were on.';

const ErrorAlert: React.FC<ErrorAlertProps> = ({ title, children, detail, onRetry, retryLabel = 'Retry', className = '' }) => {
  const technical = Boolean(detail && TECHNICAL.test(detail));
  const reason = detail && !technical ? reasonOf(detail) : '';
  return (
  <div
    role="alert"
    className={`flex gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-black dark:border-danger/60 dark:bg-danger/20 dark:text-white ${className}`}
  >
    <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger dark:text-[#F2988E]" aria-hidden="true" />
    <div className="min-w-0 flex-1 space-y-2">
      <p className="font-semibold">{title}</p>
      {reason && <p>{reason}</p>}
      <p>{children ?? DEFAULT_NEXT}</p>
      {(onRetry || technical) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {onRetry && (
            <Button variant="secondary" size="sm" type="button" onClick={onRetry}>
              <RotateCw size={14} aria-hidden="true" />
              <span>{retryLabel}</span>
            </Button>
          )}
          {technical && (
            <details className="min-w-0 text-xs text-body dark:text-bodydark">
              <summary className="cursor-pointer select-none py-2 font-semibold underline underline-offset-2">
                Details for IT
              </summary>
              <code className="mt-1 block whitespace-pre-wrap break-words">{detail}</code>
            </details>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

export default ErrorAlert;
