'use client';
import React, { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { AlertCircle, AlertTriangle } from 'react-feather';
import { BRAND } from '@/utils/brandColors';
import { dismissNotice, getNotices, getServerNotices, Notice, subscribeNotices } from '@/utils/notify';

/**
 * Where `toast.error` / `toast.warn` land (utils/notify.ts, 2026-10-22): one message at a time,
 * on top of everything, until staff press OK. The same message raised again while it waits is
 * counted, not stacked; a different one waits its turn behind it.
 *
 * Not SweetAlert: Swal shows one popup at a time, so an error raised while "Are you sure?" or the
 * processing overlay is open would replace it, and that overlay's close() would then shut the
 * error before it was read.
 */

const COPY: Record<Notice['kind'], { title: string; tint: string; ink: string; Icon: typeof AlertCircle }> = {
  error: { title: "That didn't go through", tint: '#F8E4E1', ink: BRAND.danger, Icon: AlertCircle },
  warning: { title: 'Please check this first', tint: '#FBEFD2', ink: BRAND.accentText, Icon: AlertTriangle },
};

/** Peso amounts carry the point of most refusals ("is now ₱14900.00, not ₱15000.00"), so they stand out. */
const PESO = /(₱\s?-?[\d,]+(?:\.\d+)?)/;

/**
 * The server writes amounts bare ("₱27000.00"); staff read them with thousands commas, as the rest
 * of the app shows money ("₱27,000.00", Raf 2026-10-22). The decimals are kept exactly as sent.
 */
const withCommas = (amount: string): string =>
  amount.replace(/(\d[\d,]*)(\.\d+)?/, (_, whole: string, decimals?: string) =>
    whole.replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decimals ?? ''));

function MessageText({ message }: { message: string }) {
  return (
    <>
      {message.split(PESO).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold tabular-nums text-black dark:text-white">{withCommas(part)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

const NoticeDialog: React.FC = () => {
  const notices = useSyncExternalStore(subscribeNotices, getNotices, getServerNotices);
  const current = notices[0];
  const panelRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  // The control that had focus before the first notice opened; it gets focus back after the last.
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    if (current && !openerRef.current) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [current]);

  useEffect(() => {
    if (!current) return;
    okRef.current?.focus();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && panelRef.current?.animate) {
      panelRef.current.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keys and focus are watched on the document, not the overlay: SweetAlert's processing overlay
  // closing under this one hands focus back to the page, and Escape must still reach the popup.
  const open = Boolean(current);
  useEffect(() => {
    if (!open) return;
    const keepFocus = (event: FocusEvent) => {
      if (panelRef.current && event.target instanceof Node && !panelRef.current.contains(event.target)) {
        okRef.current?.focus();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === 'Tab') {
        // Tab moves between the message (scrollable when long) and OK, never to the page behind.
        event.preventDefault();
        const next = document.activeElement === okRef.current ? messageRef.current : okRef.current;
        next?.focus();
      }
    };
    document.addEventListener('focusin', keepFocus);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('focusin', keepFocus);
      document.removeEventListener('keydown', onKey, true);
      // The last notice is gone (listeners off first, or keepFocus would pull focus back to OK).
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!current) return null;

  const close = () => dismissNotice(current.id);
  closeRef.current = close;

  const { title, tint, ink, Icon } = COPY[current.kind];
  const waiting = notices.length - 1;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      style={{ zIndex: 1000000 }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notice-dialog-title"
        aria-describedby="notice-dialog-message"
        className="w-full min-w-0 max-w-full rounded-t-xl border border-stroke bg-white font-satoshi shadow-default dark:border-strokedark dark:bg-boxdark sm:max-w-md sm:rounded-xl"
        style={{ borderTop: `4px solid ${ink}` }}
      >
        <div className="flex items-start gap-4 px-6 pb-2 pt-6">
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full"
            style={{ backgroundColor: tint, color: ink }}
            aria-hidden="true"
          >
            <Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="notice-dialog-title" className="text-lg font-bold leading-snug text-black dark:text-white">
              {title}
            </h2>
            <p
              ref={messageRef}
              id="notice-dialog-message"
              tabIndex={0}
              className="mt-2 max-h-[50vh] overflow-y-auto rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-pre-line break-words text-[15px] leading-relaxed text-body dark:text-bodydark"
            >
              <MessageText message={current.message} />
            </p>
            {(current.count > 1 || waiting > 0) && (
              <p className="mt-3 text-sm text-body dark:text-bodydark">
                {current.count > 1 && <>This came up {current.count} times. </>}
                {waiting > 0 && <>{waiting === 1 ? '1 more message' : `${waiting} more messages`} after this one.</>}
              </p>
            )}
          </div>
        </div>
        {/* On a phone the sheet meets the bottom edge: keep OK above the gesture bar. */}
        <div className="flex justify-end px-6 pt-4" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            ref={okRef}
            type="button"
            onClick={close}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-8 font-semibold text-white hover:bg-olive-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-boxdark sm:w-auto"
          >
            {waiting > 0 ? 'Next' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDialog;
