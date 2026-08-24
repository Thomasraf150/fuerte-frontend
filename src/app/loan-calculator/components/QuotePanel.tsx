'use client';

/**
 * Borrower-facing half of the Loan Calculator.
 *
 * Every peso figure rendered here comes straight from the server's Compute
 * response. The only locally-derived numbers are the per-installment amounts,
 * which reproduce `saveLoanSchedule`'s split exactly (see utils/loanQuote.ts).
 *
 * `monthly_amort` from the response is deliberately NOT rendered — it divides
 * `pn` alone by `loan_product.terms`, so it overstates the payment on every
 * add-on product and on every non-monthly cadence.
 */

import React from 'react';
import { formatNumberComma } from '@/utils/helper';

import type { ComputeResponse, ScheduleRow } from '@/utils/loanQuote';
import { totalPayable } from '@/utils/loanQuote';
import ScheduleTable from './ScheduleTable';

interface QuotePanelProps {
  comp: ComputeResponse;
  schedule: ScheduleRow[];
  productName: string;
  baseDeduction: number;
  cadenceLabel: string;
}

/** A labelled money row with an optional rate badge. */
const FigureRow: React.FC<{
  label: string;
  amount: string | null;
  rate?: string | null;
  muted?: boolean;
}> = ({ label, amount, rate, muted }) => (
  <div className="flex items-baseline justify-between gap-4 py-2">
    <div className="flex items-baseline gap-2">
      <span className={`text-sm ${muted ? 'text-bodydark2' : 'text-black dark:text-white'}`}>
        {label}
      </span>
      {/* Only 5 of the 7 deductions carry a rate — notarial and the manual
          insurance fee are flat peso charges with no percentage. */}
      {rate ? (
        <span className="rounded-sm bg-whiten px-1.5 py-0.5 text-xs font-medium text-body dark:bg-form-input dark:text-bodydark">
          {rate}%
        </span>
      ) : null}
    </div>
    <span className="tabular-nums text-sm text-black dark:text-white">
      {formatNumberComma(Number(amount ?? 0))}
    </span>
  </div>
);

/** The single number the borrower came in for. */
const Headline: React.FC<{ amount: string | null; installment: string; count: number }> = ({
  amount,
  installment,
  count,
}) => (
  <div className="lc-reveal lc-reveal-1 rounded-sm bg-boxdark px-6 py-7 text-white shadow-default dark:bg-boxdark-2">
    <p className="text-xs uppercase tracking-[0.18em] text-bodydark2">Cash you receive today</p>
    <p className="mt-2 flex items-start gap-1 text-4xl font-bold leading-none tabular-nums sm:text-[2.75rem]">
      <span className="mt-1 text-2xl font-medium text-bodydark1">&#8369;</span>
      {formatNumberComma(Number(amount ?? 0))}
    </p>

    <div className="lc-rule my-5 text-white" />

    <p className="text-xs uppercase tracking-[0.18em] text-bodydark2">You pay</p>
    {/* count === 0 means the start date is mid-edit, so there is no schedule to
        divide by. Showing "P0.00 x 0 payments" would be a wrong number in front
        of a borrower — say what is missing instead. */}
    {count === 0 ? (
      <p className="mt-2 text-base font-normal text-bodydark1">
        Pick a start date to see the payment amount.
      </p>
    ) : (
      <p className="mt-2 text-2xl font-semibold leading-none tabular-nums">
        &#8369;{formatNumberComma(Number(installment))}
        <span className="ml-2 text-base font-normal text-bodydark1">
          &times; {count} {count === 1 ? 'payment' : 'payments'}
        </span>
      </p>
    )}
  </div>
);

const QuotePanel: React.FC<QuotePanelProps> = ({
  comp,
  schedule,
  productName,
  baseDeduction,
  cadenceLabel,
}) => {
  const addonTerms = Number(comp.addon_terms ?? 0);
  const hasAddon = addonTerms > 0;
  const firstDue = schedule[0]?.dueDate ?? '—';
  const lastDue = schedule[schedule.length - 1]?.dueDate ?? '—';
  // Row 1 is the truncated quotient; the last row carries the cent remainder.
  const installment = schedule[0]?.amount ?? '0.00';
  const lastInstallment = schedule[schedule.length - 1]?.amount ?? '0.00';
  const remainderDiffers = schedule.length > 1 && lastInstallment !== installment;

  return (
    <div className="lc-print-area space-y-5">
      {/* Paper-only header — the screen already has a breadcrumb. */}
      <div className="lc-print-only">
        <h1 className="text-xl font-bold">Loan Quotation — estimate only</h1>
        <p className="text-sm">{productName}</p>
      </div>

      <Headline amount={comp.new_loan_proceeds} installment={installment} count={schedule.length} />

      {/*
        The calculator always sends ob/penalty/rebates = 0.00, and the resolver
        computes new_loan_proceeds = (loan_proceeds - ob - penalty) + rebates.
        A RENEWING borrower — the common counter case — therefore receives
        materially less than the headline. Say so on screen and on paper rather
        than letting the operator discover it at release.
      */}
      <p className="rounded-sm border border-stroke bg-whiten p-3 text-xs leading-relaxed text-body dark:border-strokedark dark:bg-form-input dark:text-bodydark">
        This assumes you have no outstanding balance. If this is a renewal, the cash released is
        reduced by your current balance and any penalty.
      </p>

      {/* --- The note --- */}
      <div className="lc-reveal lc-reveal-2 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
          The note
        </h3>
        <p className="mb-3 text-xs text-bodydark2">{productName}</p>

        <FigureRow label="Promissory note (PN) amount" amount={comp.pn} />
        <div className="lc-rule text-body" />
        <FigureRow label="Total payable" amount={totalPayable(comp)} />
        <div className="lc-rule text-body" />

        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm text-black dark:text-white">Term</span>
          <span className="tabular-nums text-sm text-black dark:text-white">
            {comp.terms} months
            {hasAddon ? ` + ${addonTerms} add-on` : ''}
          </span>
        </div>
        <div className="lc-rule text-body" />
        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm text-black dark:text-white">Payment schedule</span>
          <span className="text-sm text-black dark:text-white">{cadenceLabel}</span>
        </div>
        <div className="lc-rule text-body" />
        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm text-black dark:text-white">First / last due</span>
          <span className="tabular-nums text-sm text-black dark:text-white">
            {firstDue} &rarr; {lastDue}
          </span>
        </div>

        <p className="mt-4 rounded-sm bg-whiten p-3 text-xs leading-relaxed text-body dark:bg-form-input dark:text-bodydark">
          {baseDeduction === 1
            ? 'The fees below are taken out of your payout — your note is for the amount you applied for.'
            : 'The fees below are added on top of the amount you applied for — you receive the full amount and your note is larger.'}
        </p>
      </div>

      {/* --- Deductions --- */}
      <div className="lc-reveal lc-reveal-3 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
          Deductions
        </h3>

        <FigureRow label="U.D.I (interest)" amount={comp.deductions?.udi ?? '0'} rate={comp.deduction_rate?.udi} />
        <FigureRow label="Processing fee" amount={comp.deductions?.processing ?? '0'} rate={comp.deduction_rate?.processing} />
        {/* Agent fee is > 0 on only 13 of 543 live products — hide the empty row. */}
        {Number(comp.deductions?.agent_fee ?? 0) > 0 ? (
          <FigureRow label="Agent fee" amount={comp.deductions?.agent_fee ?? '0'} rate={comp.deduction_rate?.agent_fee} />
        ) : null}
        <FigureRow label="Collection fee" amount={comp.deductions?.collection ?? '0'} rate={comp.deduction_rate?.collection} />
        {Number(comp.deductions?.insurance ?? 0) > 0 ? (
          <FigureRow label="Insurance" amount={comp.deductions?.insurance ?? '0'} rate={comp.deduction_rate?.insurance} />
        ) : null}
        {Number(comp.deductions?.insurance_fee ?? 0) > 0 ? (
          <FigureRow label="Insurance fee" amount={comp.deductions?.insurance_fee ?? '0'} />
        ) : null}
        {Number(comp.deductions?.notarial ?? 0) > 0 ? (
          <FigureRow label="Notarial fee" amount={comp.deductions?.notarial ?? '0'} />
        ) : null}

        <div className="lc-rule my-1 text-body" />
        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm font-semibold text-black dark:text-white">Total deductions</span>
          <span className="tabular-nums text-sm font-semibold text-black dark:text-white">
            {formatNumberComma(Number(comp.total_deductions ?? 0))}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2">
          <span className="text-sm font-semibold text-black dark:text-white">Loan proceeds</span>
          <span className="tabular-nums text-sm font-semibold text-black dark:text-white">
            {formatNumberComma(Number(comp.loan_proceeds ?? 0))}
          </span>
        </div>

        {hasAddon ? (
          <>
            <div className="lc-rule my-2 text-body" />
            <h4 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wider text-body dark:text-bodydark">
              Add-on ({addonTerms} mos.)
            </h4>
            <FigureRow label="Add-on amount" amount={comp.addon_amount} muted />
            <FigureRow label="Add-on U.D.I" amount={comp.addon_udi} rate={comp.addon_udi_rate} muted />
            <div className="flex items-baseline justify-between gap-4 py-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                Add-on released to you
              </span>
              <span className="tabular-nums text-sm font-semibold text-success">
                +{formatNumberComma(Number(comp.addon_total ?? 0))}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* --- Schedule --- */}
      <div className="lc-reveal lc-reveal-4 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-black dark:text-white">
            Payment schedule
          </h3>
          <span className="text-xs text-bodydark2">
            {schedule.length} {schedule.length === 1 ? 'installment' : 'installments'}
          </span>
        </div>

        <ScheduleTable rows={schedule} />

        {remainderDiffers ? (
          <p className="mt-3 text-xs text-bodydark2">
            The last payment is {formatNumberComma(Number(lastInstallment))} — it carries the
            centavo remainder so the payments add up to the total exactly.
          </p>
        ) : null}
      </div>

      {/* --- Disclaimer: always printed --- */}
      <div className="rounded-sm border border-warning bg-warning bg-opacity-10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
          Estimate only
        </p>
        <p className="mt-1 text-xs leading-relaxed text-body dark:text-bodydark">
          This is a quotation for discussion, not an approval and not a contract. Due dates are
          indicative — the final schedule is set when the loan is released. No application has been
          filed and nothing has been recorded from this screen.
        </p>
      </div>
    </div>
  );
};

export default QuotePanel;
