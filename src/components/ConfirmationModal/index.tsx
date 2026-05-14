import React from 'react';
import { AlertCircle } from 'react-feather';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showConfirmationModal = async (
  title: string,
  text: string,
  confText: string,
  showCancel: boolean = true,
  useHtml: boolean = false
): Promise<boolean> => {
  const result = await MySwal.fire({
    title: title,
    ...(useHtml ? { html: text } : { text: text }),
    icon: 'warning',
    showCancelButton: showCancel,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confText,
  });

  return result.isConfirmed;
};

/**
 * Confirmation modal that also captures an optional reason textarea.
 * Used for delete actions that route through the deletion-approval
 * workflow — ADMIN/OWNER bypass the queue (reason is ignored backend-side),
 * everyone else has the reason shown to the approver.
 *
 * Returns the reason string on confirm (empty string allowed), or null on cancel.
 */
export const showDeletionRequestPrompt = async (
  title: string,
  text: string,
  confirmText: string = 'Submit'
): Promise<string | null> => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'warning',
    input: 'textarea',
    inputLabel: 'Reason (optional — shown to the approver)',
    inputPlaceholder: 'e.g. duplicate entry, wrong borrower, encoded by mistake',
    inputAttributes: { 'aria-label': 'Reason for deletion' },
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
  });

  if (!result.isConfirmed) {
    return null;
  }
  return typeof result.value === 'string' ? result.value : '';
};

/**
 * Show a blocking "processing" overlay. The returned function closes it.
 * Use between the user's confirm click and the toast on the response, so
 * the screen doesn't look frozen during the network round-trip.
 *
 *   const done = showProcessingModal('Deleting borrower…');
 *   try { ... } finally { done(); }
 */
export const showProcessingModal = (title: string = 'Working…'): (() => void) => {
  MySwal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      // @ts-ignore — Swal types may not expose showLoading on the wrapped instance
      Swal.showLoading();
    },
  });
  return () => Swal.close();
};

export type AlreadyPendingInfo = {
  request_id: string | number;
  requested_by_name: string | null;
  reason: string | null;
  created_at: string;
  is_mine: boolean;
  entity_label?: string;
};

export type AlreadyPendingAction = 'view' | 'withdraw' | 'close';

/**
 * Replaces the generic "duplicate request" error toast with an informative
 * modal that shows who already requested the deletion, when, and why.
 * Styled in the editorial/ledger language used by /approvals so it feels
 * like part of the same system.
 *
 * Returns the action the user took so the caller can react (e.g. navigate
 * to /approvals on 'view', call the cancel mutation on 'withdraw').
 */
export const showAlreadyPendingModal = async (
  info: AlreadyPendingInfo
): Promise<AlreadyPendingAction> => {
  const ago = formatAgo(info.created_at);
  const headerLine = info.is_mine
    ? `You already filed this deletion request ${ago}.`
    : `${info.requested_by_name ?? 'Another user'} filed this deletion ${ago}.`;

  // JSX content — auto-escapes user-supplied values (entity_label,
  // requested_by_name, reason) so there's no manual HTML escaping
  // surface area and no XSS footgun if a field carries a `<` later.
  const body = (
    <div style={{ textAlign: 'left', padding: '4px 4px 2px', color: '#0f172a' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#b45309',
          marginBottom: 10,
        }}
      >
        <AlertCircle size={18} style={{ marginRight: 6 }} />
        Already in the queue
      </div>

      {info.entity_label && (
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.25, margin: '0 0 6px', color: '#0f172a' }}>
          {info.entity_label}
        </div>
      )}

      <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.45 }}>{headerLine}</div>

      {info.reason ? (
        <div
          style={{
            margin: '14px 0 6px',
            padding: '10px 14px',
            borderLeft: '3px solid #3085d6',
            background: '#f1f5f9',
            borderRadius: '0 4px 4px 0',
            fontSize: 14,
            color: '#0f172a',
            lineHeight: 1.45,
          }}
        >
          {info.reason}
        </div>
      ) : (
        <p style={{ margin: '14px 0 6px', fontSize: 12, color: '#64748b' }}>No reason supplied</p>
      )}

      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#64748b',
          marginTop: 10,
        }}
      >
        Request #{String(info.request_id).padStart(5, '0')}
      </div>
    </div>
  );

  const result = await MySwal.fire({
    title: '',
    html: body,
    showCancelButton: true,
    showDenyButton: info.is_mine,
    confirmButtonText: 'View in Approvals →',
    cancelButtonText: 'Close',
    denyButtonText: 'Delete request',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#64748b',
    denyButtonColor: '#dc2626',
    reverseButtons: false,
    background: '#ffffff',
  });

  if (result.isConfirmed) return 'view';
  if (result.isDenied) return 'withdraw';
  return 'close';
};

/**
 * Confirmation modal with an optional decision-note textarea.
 * Used by the approve / reject actions on the Approvals page so the
 * note prompts match Fuerte's modal language instead of the native
 * browser prompt.
 *
 * Returns the note string on confirm (empty string allowed), or null
 * if the user cancelled.
 */
export const showDecisionNotePrompt = async (
  title: string,
  inputLabel: string,
  confirmText: string,
  options: {
    text?: string;
    confirmColor?: string;
    placeholder?: string;
  } = {}
): Promise<string | null> => {
  const result = await MySwal.fire({
    title,
    text: options.text ?? '',
    icon: 'question',
    input: 'textarea',
    inputLabel,
    inputPlaceholder: options.placeholder ?? '',
    inputAttributes: { 'aria-label': inputLabel },
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: options.confirmColor ?? '#3085d6',
    cancelButtonColor: '#64748b',
    background: '#ffffff',
  });

  if (!result.isConfirmed) return null;
  return typeof result.value === 'string' ? result.value : '';
};

function formatAgo(iso: string): string {
  const t = new Date(iso.replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return iso;
  const seconds = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

