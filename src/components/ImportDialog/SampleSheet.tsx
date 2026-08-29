'use client';

import { CheckCircle, XCircle } from 'react-feather';
import type { ImportSample } from '@/hooks/useImport';

/**
 * An on-screen sample of a valid import file, drawn as a spreadsheet.
 *
 * Why this exists: every word of guidance we had lived on the "START HERE"
 * sheet INSIDE the downloaded .xlsx. Staff on budget Android phones have to
 * download the file and navigate a 3-sheet workbook before they learn what a
 * row looks like — so they arrived at the drop zone with nothing to copy.
 *
 * It is deliberately drawn as a spreadsheet rather than described in prose:
 * the column-letter band, the row-number gutter and the monospace cells are
 * the same shapes the clerk is looking at in Excel, so this is recognised
 * rather than read.
 *
 * The grid is now SERVED, not hardcoded — the backend builds it from the very
 * column definitions the workbook is generated from (ImportTemplateInterface::
 * sampleGrid). Two hand-maintained copies of a column list drift the moment
 * anyone edits one of them, and the picture and the file have to agree. It also
 * means a new import type gets its sample here with no frontend change at all.
 *
 * Row numbers start at the server's firstDataRow (2), because the header
 * occupies Excel row 1 — numbering from 1 pointed the caption at the header row
 * and at the wrong loan once the clerk opened the real file.
 */

/** Right/wrong pairs. Format rules, so they hold for every type. */
const WRITE_LIKE_THIS = ['2026-08-27', '905.00'];
const NOT_LIKE_THIS = ['27/08/2026 · Aug 27 2026', '905.123 · (905.00)'];

function RuleColumn({
  tone,
  title,
  lines,
}: {
  tone: 'ok' | 'bad';
  title: string;
  lines: string[];
}) {
  const ok = tone === 'ok';
  const Icon = ok ? CheckCircle : XCircle;
  return (
    <div
      className={`rounded border px-3 py-2 ${
        ok ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
      }`}
    >
      <p
        className={`mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
          ok ? 'text-success' : 'text-danger'
        }`}
      >
        <Icon size={12} className="shrink-0" />
        {title}
      </p>
      <ul className="space-y-0.5">
        {lines.map((l) => (
          <li
            key={l}
            className="font-mono text-[11px] leading-snug text-black dark:text-white"
          >
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SampleSheet({ sample }: { sample: ImportSample }) {
  const { columns, rows, firstDataRow } = sample;
  const optionalNames = columns.filter((c) => c.optional).map((c) => c.name);

  return (
    <section aria-label="Sample spreadsheet" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h4 className="text-sm font-medium text-black dark:text-white">
          What your file should look like
        </h4>
        <span className="text-xs text-bodydark2">example only</span>
      </div>

      {/* min-w-0 keeps this from forcing the dialog wider than the screen;
          the grid scrolls inside itself instead. */}
      <div className="min-w-0 overflow-x-auto rounded border border-stroke dark:border-strokedark">
        <table className="min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="bg-whiten dark:bg-form-input">
              {/* Row-number gutter. Sticky so the numbers stay put while the
                  clerk swipes sideways through the columns. */}
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-stroke bg-whiten px-1 dark:border-strokedark dark:bg-form-input"
              >
                <span className="sr-only">Row</span>
              </th>
              {columns.map((col) => (
                <th
                  key={col.name}
                  scope="col"
                  className="border-b border-l border-stroke px-1.5 py-1 align-bottom dark:border-strokedark"
                >
                  <span className="block text-center text-[10px] font-normal leading-tight text-bodydark2">
                    {col.letter}
                  </span>
                  <span
                    className={`block whitespace-nowrap text-[11px] leading-tight ${
                      col.optional
                        ? 'font-normal text-body dark:text-bodydark'
                        : 'font-semibold text-black dark:text-white'
                    }`}
                  >
                    {col.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, r) => (
              <tr key={r} className="bg-white dark:bg-boxdark">
                <td className="sticky left-0 z-10 border-b border-stroke bg-whiten px-1 text-center text-[10px] tabular-nums text-bodydark2 last:border-b-0 dark:border-strokedark dark:bg-form-input">
                  {firstDataRow + r}
                </td>
                {columns.map((col, i) => (
                  <td
                    key={col.name}
                    className={`whitespace-nowrap border-b border-l border-stroke px-1.5 py-1.5 font-mono text-[11px] text-black dark:border-strokedark dark:text-white ${
                      col.numeric ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {cells[i] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Touch browsers hide the scrollbar until the finger is down, so columns
          off-screen are invisible without being named. */}
      <p className="text-[11px] text-bodydark2 sm:hidden">
        Swipe the grid sideways for all {columns.length} columns.
      </p>

      {optionalNames.length > 0 && (
        <p className="text-xs leading-snug text-body dark:text-bodydark">
          Bold headings are required.{' '}
          {optionalNames.map((n, i) => (
            <span key={n}>
              {i > 0 && ', '}
              <span className="font-mono">{n}</span>
            </span>
          ))}{' '}
          may be left blank.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <RuleColumn tone="ok" title="Write it like this" lines={WRITE_LIKE_THIS} />
        <RuleColumn tone="bad" title="Not like this" lines={NOT_LIKE_THIS} />
      </div>

      <p className="text-xs leading-snug text-body dark:text-bodydark">
        The column names must match, but their order does not — and any extra
        columns you keep are ignored.
      </p>
    </section>
  );
}
