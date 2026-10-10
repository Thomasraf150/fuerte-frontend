import React from 'react';
import { formatNumber } from '@/utils/formatNumber';
import FormInput from '@/components/FormInput';
import PesoSign from '@/components/PesoSign';

interface ParentFormBr {
  setValue: any;
  register: any;
  watch: any;
  handleCompTblDecimal: (e: any, name: string) => void;
  dataComputedLoans: any;
  /** True while a Compute request is in flight: figures show as placeholder bars, not stale or 0.00. */
  computing?: boolean;
}

// Note: ob, penalty and rebates are not pre-filled with "0.00"; they show placeholder="0.00", and
// FormLoans.tsx's ensureNumericString() still sends "0.00" for an empty field.

const money = (value: unknown): string => formatNumber(Number(value ?? 0));

/**
 * A figure not yet computed: a short bar where the number will print, so the receipt never shows
 * 0.00 while Compute runs. The labels stay put; only the figures shimmer, in a staggered wave.
 */
const PendingFigure: React.FC<{ size?: 'sm' | 'lg'; delay?: number }> = ({ size = 'sm', delay = 0 }) => (
  <span
    aria-hidden="true"
    className={`inline-block animate-pulse rounded bg-stroke align-middle motion-reduce:animate-none dark:bg-strokedark ${size === 'lg' ? 'h-7 w-36' : 'h-3.5 w-16'}`}
    style={{ animationDelay: `${delay * 70}ms` }}
  />
);

/** A titled group of the receipt: "PN Amount", "Deductions", "Less", "Add-On", "New Proceeds of Loan". */
const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-3 first:pt-0">
    <h5 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-primary dark:text-olive-300">{title}</h5>
    <dl>{children}</dl>
  </div>
);

/** One label and its figure, the figure right-aligned in tabular numerals so the columns line up. */
const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; total?: boolean }> = ({ label, value, total = false }) => (
  <div className={`flex items-baseline justify-between gap-4 py-1 text-sm ${total ? 'mt-1 border-t border-stroke pt-2 font-bold dark:border-strokedark' : ''}`}>
    <dt className={total ? 'text-black dark:text-white' : 'text-body dark:text-bodydark'}>{label}</dt>
    <dd className="tabular-nums text-black dark:text-white">{value}</dd>
  </div>
);

/** An editable amount on the receipt (Outstanding Balance, Penalty, Rebates): unchanged fields, laid out as rows. */
const AmountRow: React.FC<{ name: 'ob' | 'penalty' | 'rebates'; label: string } & Pick<ParentFormBr, 'register' | 'watch' | 'handleCompTblDecimal'>> = (
  { name, label, register, watch, handleCompTblDecimal },
) => (
  <div className="flex flex-col gap-1 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
    <label htmlFor={name} className="text-sm text-body dark:text-bodydark">{label}</label>
    <div className="w-full sm:w-48">
      <FormInput
        label=""
        id={name}
        type="text"
        icon={PesoSign}
        register={register(name)}
        value={watch(name)}
        placeholder="0.00"
        formatType="currency"
        className="text-right"
        onChange={(e) => handleCompTblDecimal(e, name)}
      />
    </div>
  </div>
);

/**
 * The loan computation as a receipt (UI modernisation B, 2026-10-07): the same labels, figures,
 * order and editable fields as before, laid out as label/value rows with right-aligned figures
 * ("Right-align numeric columns"), ruled subtotals, and the borrower's new proceeds as the one big
 * number ("Make the most important element biggest", NN/g).
 */
const FormLoanComputation: React.FC<ParentFormBr> = ({ handleCompTblDecimal, register, watch, dataComputedLoans: c, computing = false }) => {
  const editable = { register, watch, handleCompTblDecimal };
  // While computing, each figure is a bar (n staggers the shimmer) and rates drop out of the labels,
  // so nothing on the receipt reads "0.00" or "(0%)" before the server has answered.
  let n = 0;
  const fig = (value: React.ReactNode) => (computing ? <PendingFigure delay={n++} /> : value);
  const pct = (rate: unknown, unit = '%') => (computing ? '' : ` (${Number(rate ?? 0)}${unit})`);
  return (
    <section
      className="border border-stroke bg-whiter p-4 sm:p-5 dark:border-strokedark dark:bg-meta-4"
      aria-labelledby="loan-computation-title"
      aria-busy={computing}
    >
      <h4 id="loan-computation-title" className="mb-3 font-display text-xl text-black dark:text-white">Computation</h4>
      {/* Always mounted, only the text changes: a live region that appears WITH its text is often not read. */}
      <span role="status" className="sr-only">{computing ? 'Computing the loan…' : ''}</span>
      <div className="divide-y divide-stroke dark:divide-strokedark">
        <Group title="PN Amount">
          <Row label="Monthly" value={fig(money(c?.monthly_amort))} />
          <Row label="Terms" value={fig(c?.terms ?? '')} />
          <Row label="PN" value={fig(money(c?.pn))} total />
        </Group>
        <Group title="Deductions">
          <Row label={`U.D.I${pct(c?.deduction_rate?.udi)}`} value={fig(money(c?.deductions?.udi))} />
          <Row label={`Processing Fee${pct(c?.deduction_rate?.processing)}`} value={fig(money(c?.deductions?.processing))} />
          <Row label={`Agent Fee${pct(c?.deduction_rate?.agent_fee)}`} value={fig(money(c?.deductions?.agent_fee))} />
          <Row label={`Collection Fee${pct(c?.deduction_rate?.collection)}`} value={fig(money(c?.deductions?.collection))} />
          <Row label={`Insurance Fee${pct(c?.deduction_rate?.insurance)}`} value={fig(money(c?.deductions?.insurance))} />
          <Row label="Insurance MFee" value={fig(money(c?.deductions?.insurance_fee))} />
          <Row label="Notarial Fee" value={fig(money(c?.deductions?.notarial))} />
          <Row label="Total Deductions" value={fig(money(c?.total_deductions))} total />
          <Row label="Loan Proceeds" value={fig(money(c?.loan_proceeds))} total />
        </Group>
        <Group title="Less">
          <AmountRow name="ob" label="Outstanding Balance" {...editable} />
          <AmountRow name="penalty" label="Penalty" {...editable} />
        </Group>
        <Group title="Add-On">
          <AmountRow name="rebates" label="Rebates" {...editable} />
          <Row label={`Addon Amount${pct(c?.addon_terms, ' mos.')}`} value={fig(money(c?.addon_amount))} />
          <Row label={`Addon UDI${pct(c?.addon_udi_rate)}`} value={fig(`- ${money(c?.addon_udi)}`)} />
          <Row label="Addon Total" value={fig(money(c?.addon_total))} total />
        </Group>
        <Group title="New Proceeds of Loan">
          <div className="flex items-baseline justify-between gap-4 pt-1">
            <dt className="text-sm font-bold text-black dark:text-white">Amount</dt>
            <dd className="font-display text-2xl tabular-nums text-primary dark:text-olive-300">
              {computing ? <PendingFigure size="lg" delay={n} /> : money(c?.new_loan_proceeds)}
            </dd>
          </div>
        </Group>
      </div>
    </section>
  );
};

export default FormLoanComputation;
