'use client';

import { CheckCircle, XCircle } from 'react-feather';

/**
 * An on-screen sample of a valid collections file, shown inside ImportDialog.
 *
 * Why this exists: every word of guidance we had lived on the "START HERE"
 * sheet INSIDE the downloaded .xlsx. Staff on budget Android phones have to
 * download the file and navigate a 3-sheet workbook before they learn what a
 * row looks like — so they arrived at the drop zone with nothing to copy.
 *
 * It is deliberately drawn as a spreadsheet rather than described in prose:
 * the column-letter band, the row-number gutter and the monospace cells are
 * the same shapes the clerk is looking at in Excel, so this is recognised
 * rather than read. The values below are ILLUSTRATIVE ONLY — nothing here is
 * ever uploaded, so no real loan can be posted from this component.
 *
 * The loan refs are deliberately UNISSUED (MA's counter is at 508, so MA-9001
 * and MA-9002 cannot resolve) while still showing the real shape,
 * {branch_sub.code}-{counter padded to ref_no_length}. A clerk who copies one
 * verbatim gets a clean "Loan 'MA-9001' not found" instead of posting money
 * against a live loan. Do NOT "improve" these into real refs: the downloaded
 * .xlsx used to make exactly that mistake — it shipped three sample rows
 * SELECTed live from released loans, which posted real money if the clerk typed
 * below them instead of deleting them. Both files now use these same unissued
 * refs, and the picture and the file must stay in agreement.
 *
 * Every rule stated here was verified against the parser
 * (fuerte-backend app/Services/Import/ImportFileParser.php) — notably the
 * date contract, which accepts ONLY YYYY-MM-DD text, a real Excel date cell,
 * or an Excel serial. Do not copy the older claims from the .xlsx's START
 * HERE sheet, which are out of date.
 */

type Col = {
  letter: string;
  name: string;
  optional?: boolean;
  numeric?: boolean;
};

/** Column order mirrors the generated template exactly (A..G). */
const COLUMNS: Col[] = [
  { letter: 'A', name: 'LOAN_REF' },
  { letter: 'B', name: 'DUE_DATE' },
  { letter: 'C', name: 'COLLECTION_DATE' },
  { letter: 'D', name: 'AMOUNT', numeric: true },
  { letter: 'E', name: 'BANK_CHARGE', optional: true, numeric: true },
  { letter: 'F', name: 'PENALTY', optional: true, numeric: true },
  { letter: 'G', name: 'PAYMENT_TYPE', optional: true },
];

/**
 * Local calendar date, offset in days. Never toISOString() — that is UTC and
 * slips a day for anyone east of Greenwich, which is everyone using this.
 */
function ymd(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Rows 2 and 4 are the SAME loan on two different due dates: that is the one
 * rule staff get wrong most often — one payment settling two installments is
 * two rows, not one row of double the amount.
 */
function sampleRows(): string[][] {
  const paid = ymd(0);
  return [
    ['MA-9001', ymd(-27), paid, '905.00', '0', '', 'Collection'],
    ['MA-9002', ymd(-13), paid, '2330.00', '0', '', 'Collection'],
    ['MA-9001', ymd(-13), paid, '905.00', '0', '', 'Collection'],
  ];
}

/** The Excel-style column-letter + field-name band. */
function HeadCell({ col }: { col: Col }) {
  return (
    <th
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
  );
}

/** One good/bad column of the "write it like this" strip. */
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

export default function SampleSheet() {
  const rows = sampleRows();

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
                  clerk swipes sideways through the seven columns. */}
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-stroke bg-whiten px-1 dark:border-strokedark dark:bg-form-input"
              >
                <span className="sr-only">Row</span>
              </th>
              {COLUMNS.map((c) => (
                <HeadCell key={c.name} col={c} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, r) => (
              <tr key={r} className="bg-white dark:bg-boxdark">
                {/* r + 2, not r + 1: in the real workbook the header occupies
                    Excel row 1, so the first data row is row 2. Numbering from 1
                    here made the caption below point at the header row and at
                    the wrong loan once the clerk opened the actual file. */}
                <td className="sticky left-0 z-10 border-b border-stroke bg-whiten px-1 text-center text-[10px] tabular-nums text-bodydark2 last:border-b-0 dark:border-strokedark dark:bg-form-input">
                  {r + 2}
                </td>
                {COLUMNS.map((c, i) => (
                  <td
                    key={c.name}
                    className={`whitespace-nowrap border-b border-l border-stroke px-1.5 py-1.5 font-mono text-[11px] text-black dark:border-strokedark dark:text-white ${
                      c.numeric ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {cells[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Touch browsers hide the scrollbar until the finger is down, so the
          four columns off-screen are invisible without being named. */}
      <p className="text-[11px] text-bodydark2 sm:hidden">
        Swipe the grid sideways for all seven columns.
      </p>

      <p className="text-xs leading-snug text-body dark:text-bodydark">
        One row = one installment paid.{' '}
        <span className="text-black dark:text-white">
          Rows 2 and 4 are the same loan
        </span>{' '}
        — one payment settling two installments is two rows, never one doubled
        row. Leave <span className="font-mono">BANK_CHARGE</span>,{' '}
        <span className="font-mono">PENALTY</span> and{' '}
        <span className="font-mono">PAYMENT_TYPE</span> blank and they default
        to 0, 0 and Collection.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <RuleColumn
          tone="ok"
          title="Write it like this"
          lines={[`${ymd(0)}`, '905.00', 'MA-9001']}
        />
        <RuleColumn
          tone="bad"
          title="Not like this"
          lines={['27/08/2026 · Aug 27 2026', '905.123 · (905.00)', 'MA-901']}
        />
      </div>

      <p className="text-xs leading-snug text-body dark:text-bodydark">
        The column names must match, but their order does not — and any extra
        columns you keep are ignored. Interest, UDI and voucher numbers are
        worked out by the system: never type them.
      </p>
    </section>
  );
}
