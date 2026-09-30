import { answersFromLayout } from './answersFromLayout';
import { extractLayout, type PdfJsModule } from './extractLayout';
import type { FormReading, PdfLayout } from './layout';

const NO_READER = 'The PDF reader did not load. Reload the page, then choose the file again.';
const UNREADABLE =
  'This PDF could not be opened. Print the response from Google Forms in Chrome or Edge again, or paste the row from the Sheet instead.';
/** A real response reads in a few seconds even on a slow phone; a PDF built to stall the reader never does. */
const READ_TIMEOUT_MS = 60_000;

let worker: Promise<Worker> | null = null;

/** Drops a worker that failed, so the next PDF starts a fresh one. */
function forget(failed: Promise<Worker>): void {
  if (worker === failed) worker = null;
}

/** Ends a read that is stuck: stops its worker and forgets it, so the next PDF starts a fresh one. */
async function stopWorker(): Promise<void> {
  const stuck = worker;
  worker = null;
  const port = await stuck?.catch(() => null);
  port?.terminate();
}

/**
 * extractLayout, or a rejection after READ_TIMEOUT_MS, which also stops the worker.
 * Without it a pathological PDF could leave the upload button on "Uploading…" for good.
 */
async function extractInTime(pdfjs: PdfJsModule, data: Uint8Array): Promise<PdfLayout> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      void stopWorker();
      reject(Object.assign(new Error(`The PDF was still being read after ${READ_TIMEOUT_MS / 1000}s.`), { name: 'ReadTimeout' }));
    }, READ_TIMEOUT_MS);
  });
  try {
    return await Promise.race([extractLayout(pdfjs, data), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The pdf.js worker, started on first use and kept for the next PDF.
 *
 * `new Worker(new URL(...))` is webpack's worker syntax: webpack bundles the worker
 * file as a script of its own. (Handing pdf.js the file's URL instead makes Next 14's
 * minifier fail on the copied .mjs.) pdf.js does not watch a worker it is handed, so
 * this does: it waits for the worker's "ready" message, and listens for errors for as
 * long as the worker lives. A worker that fails to start, or crashes later, is
 * terminated and forgotten, so the next PDF gets a fresh one instead of a dead one.
 */
function startWorker(): Promise<Worker> {
  if (worker) return worker;
  const starting = new Promise<Worker>((resolve, reject) => {
    const started = new Worker(new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url));
    started.addEventListener('message', () => resolve(started), { once: true });
    started.addEventListener('error', (event) => {
      started.terminate();
      forget(starting);
      reject(new Error(event.message || 'The pdf.js worker stopped.'));
    });
  });
  // Also forgets a Worker that could not even be created.
  starting.catch(() => forget(starting));
  worker = starting;
  return starting;
}

/**
 * pdf.js is large and only this path needs it, so it loads the first time a PDF is
 * chosen. The legacy build carries its own polyfills, so Chrome and Edge 109 (the last
 * versions on Windows 7 and 8.1) can read PDFs too.
 */
async function loadPdfJs(): Promise<PdfJsModule> {
  try {
    const [pdfjs, port] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), startWorker()]);
    pdfjs.GlobalWorkerOptions.workerPort = port;
    return pdfjs;
  } catch (error) {
    console.error('[googleFormPdf] pdf.js did not load', error);
    throw new Error(NO_READER);
  }
}

/**
 * Reads one Google Form response, printed to PDF, in the browser. Only the answers
 * leave the page; the file itself is never sent. Every Error it throws carries a
 * sentence that can be shown as it is.
 */
export async function readGoogleFormPdf(file: File): Promise<FormReading> {
  const pdfjs = await loadPdfJs();
  let layout: PdfLayout;
  try {
    layout = await extractInTime(pdfjs, new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    // A damaged, password-protected or stalling file. Only the error's name is logged: pdf.js
    // messages can quote the file, and its name and contents stay out of the log.
    console.warn('[googleFormPdf] the PDF could not be read', { error: error instanceof Error ? error.name : 'unknown' });
    throw new Error(UNREADABLE);
  }
  return answersFromLayout(layout);
}
