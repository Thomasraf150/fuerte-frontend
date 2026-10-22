import { toast as toastify, ToastContent, ToastOptions } from 'react-toastify';

/**
 * The app's one way to tell staff how an action went (2026-10-22).
 *
 * Success and info stay toasts: a short "Saved" that goes away by itself is right for news that
 * needs nothing done. Errors and warnings used to be toasts too, gone after 3 seconds, so a long
 * server refusal ("The outstanding balance of loan MA-0514 is now ₱14900.00, not ₱15000.00…")
 * vanished before it could be read, and a field that recomputed on every keystroke stacked six of
 * them. They now open NoticeDialog, which stays until staff press OK.
 *
 * Callers keep the react-toastify shape (`toast.error(message)`), so switching a file over is its
 * import line only.
 */

export type NoticeKind = 'error' | 'warning';

export interface Notice {
  id: number;
  kind: NoticeKind;
  message: string;
  /** How many times this same message was raised while it waited: shown, never stacked. */
  count: number;
}

type Listener = () => void;

let queue: readonly Notice[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((listener) => listener());

const toText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (content instanceof Error) return content.message;
  return content == null ? '' : String(content);
};

function raise(kind: NoticeKind, content: unknown): number {
  const message = toText(content).trim() || 'Something went wrong. Please try again.';
  const same = queue.find((notice) => notice.kind === kind && notice.message === message);
  if (same) {
    queue = queue.map((notice) => (notice === same ? { ...notice, count: notice.count + 1 } : notice));
    emit();
    return same.id;
  }
  const notice: Notice = { id: nextId++, kind, message, count: 1 };
  queue = [...queue, notice];
  emit();
  return notice.id;
}

export function dismissNotice(id: number): void {
  queue = queue.filter((notice) => notice.id !== id);
  emit();
}

export function subscribeNotices(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getNotices = (): readonly Notice[] => queue;

const EMPTY: readonly Notice[] = [];
export const getServerNotices = (): readonly Notice[] => EMPTY;

/** A repeated success replaces itself instead of stacking: the toast id is its text. */
const once = (content: ToastContent, options?: ToastOptions): ToastOptions => ({
  ...(typeof content === 'string' ? { toastId: content } : {}),
  ...options,
});

export const toast = {
  success: (content: ToastContent, options?: ToastOptions) => toastify.success(content, once(content, options)),
  info: (content: ToastContent, options?: ToastOptions) => toastify.info(content, once(content, options)),
  error: (content: unknown, _options?: ToastOptions) => raise('error', content),
  warn: (content: unknown, _options?: ToastOptions) => raise('warning', content),
  warning: (content: unknown, _options?: ToastOptions) => raise('warning', content),
};
