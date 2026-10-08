import '@/css/print.css';

/**
 * Class helpers for the financial statements (Trial Balances, General Ledger, Balance Sheet,
 * Income Statement, Customer Ledger), so they all read the same way (Phase 5, 2026-10-08).
 * Sources: uxr-research.md section 4 and R2.1.
 *
 *  - a hairline under the header row, a single rule above each subtotal, a double rule under the
 *    grand total; no vertical lines, no zebra stripes, no coloured header bands;
 *  - amounts AND their headers right-aligned, `tabular-nums`, Hanken Grotesk (font-satoshi),
 *    never Fraunces for figures; totals bold;
 *  - sub-accounts indented by level, group rows bold;
 *  - the first (account) column stays pinned on phones while the amounts scroll sideways.
 *
 * Usage: `<table className={rt.table}>`, `<th className={rt.thNum}>`, `<tr className={rt.subtotal}>`
 * with `<td className={rt.tdNum}>`, and `<tr className={rt.grand}>` for the grand total.
 */
const PAD = 'px-3 py-2 sm:px-4';
const PIN = 'sticky left-0 z-[1] bg-white md:static dark:bg-boxdark';

export const rt = {
  /** The scroll container. Wide reports scroll sideways inside it. */
  wrap: 'report-table overflow-x-auto',
  table: 'w-full border-collapse font-satoshi text-sm text-black dark:text-bodydark',
  thead: 'border-b border-stroke dark:border-strokedark',
  /** Header cell: small uppercase ink label. Text columns left, amount columns right. */
  th: `${PAD} text-left text-xs font-semibold uppercase tracking-wide text-black dark:text-white`,
  thNum: `${PAD} text-right text-xs font-semibold uppercase tracking-wide text-black tabular-nums dark:text-white`,
  /** First header cell on phones: pinned like the first body cell. */
  thPin: `${PAD} text-left text-xs font-semibold uppercase tracking-wide text-black dark:text-white ${PIN}`,
  td: `${PAD}`,
  tdPin: `${PAD} ${PIN}`,
  tdNum: `${PAD} text-right tabular-nums`,
  /** Group / parent row: bold label (the section heading, e.g. ASSETS). */
  group: `${PAD} pt-5 font-semibold text-black dark:text-white`,
  groupPin: `${PAD} pt-5 font-semibold text-black dark:text-white ${PIN}`,
  /** Row class: a single rule above a subtotal, bold. */
  subtotal: 'border-t border-black/70 font-semibold text-black dark:border-bodydark dark:text-white',
  /** Row class: single rule above (1px double renders solid), 3px double rule under the grand total, bold. */
  grand: 'border-b-[3px] border-t border-double border-black/70 font-bold text-black dark:border-bodydark dark:text-white',
  // Left on phones: a wide report scrolls, and a centred line would sit off-screen ("No data a…").
  emptyRow: `${PAD} py-8 text-left text-body md:text-center dark:text-bodydark`,
} as const;

/** Indent by hierarchy level (16px per level), for the first cell of a row. */
export const indent = (level: number): { paddingLeft: string } => ({
  paddingLeft: `calc(1rem + ${Math.max(0, level) * 16}px)`,
});
