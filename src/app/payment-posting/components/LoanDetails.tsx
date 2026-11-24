import React, { useEffect, useMemo, useState } from 'react';
import { manilaToday } from '@/utils/sourceTracker';
import { scheduleRowViews } from '@/utils/scheduleRowState';
import { ROW_MARKER, ScheduleRowStatus, ScheduleSummary } from './ScheduleRowStatus';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { addAmounts } from '@/utils/financial';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatNumberComma } from '@/utils/helper';
import { CreditCard, RefreshCcw, Save, RotateCw } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import PaymentCollectionForm from './Form/PaymentCollectionForm';
import OtherPaymentForm from './Form/OtherPaymentForm';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import Button from '@/components/Button';
import { Card, CardHeader, CardBody } from '@/components/Card';
import { KeyValueColumns, KeyValueList, KeyValueRow } from '@/components/KeyValueList';
interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  onSubmitOthCollectionPayment: (d: OtherCollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  fnReversePayment: (d: any, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
  /** The summary card's title bar (CardHeader), supplied by PaymentScheduleForm. */
  header?: React.ReactNode;
}

const LoanDetails: React.FC<OMProps> = ({ header, loanSingleData, onSubmitCollectionPayment, onSubmitOthCollectionPayment, fnReversePayment, paymentLoading }) => {

  const [selectedMoSched, setSelectedMoSched] = useState<BorrLoanRowData>();
  const [selectedMoSchedOthPay, setSelectedMoSchedOthPay] = useState<BorrLoanRowData>();
  const [selectedUdiSched, setSelectedUdiSched] = useState<BorrLoanRowData>();
  const rowViews = useMemo(() => scheduleRowViews(loanSingleData?.loan_schedules, manilaToday()), [loanSingleData]);
  // Each installment's UDI schedule, matched by due date (2026-11-21). Matching by position went
  // wrong on a loan with more installments than UDI schedules: every later installment sent the
  // next date's UDI, and the server now refuses a full payment that names another date's UDI.
  // Installments sharing a due date take that date's UDI schedules in order; a date with a single
  // UDI schedule serves every installment on it.
  const udiByInstallment = useMemo(() => {
    const udis = loanSingleData?.loan_udi_schedules ?? [];
    const taken: Record<string, number> = {};
    return (loanSingleData?.loan_schedules ?? []).map((schedule) => {
      const day = String(schedule?.due_date ?? '').slice(0, 10);
      const sameDay = udis.filter((udi) => String(udi?.due_date ?? '').slice(0, 10) === day);
      const nth = taken[day] ?? 0;
      taken[day] = nth + 1;
      return sameDay[nth] ?? sameDay[0];
    });
  }, [loanSingleData]);

  // PARKED: this sum is missing a `+` before loan_details[5] and [6], so those two lines are
  // statements of their own and never reach the total (it shows 1,200 less than the loan page).
  // Left as is on purpose until Rafael decides; do not add the `+` here without his say.
  const totalDeduction = addAmounts(
    loanSingleData?.loan_details[2]?.credit ?? 0,
    loanSingleData?.loan_details[3]?.credit ?? 0,
    loanSingleData?.loan_details[4]?.credit ?? 0,
  ).toNumber();

  // A paid installment's penalty charged at the last due (option B, 2026-11-23) is collected through
  // Process Payment as Collection X + Penalty X: the installment stays paid and X books penalty income.
  const [prefillPenalty, setPrefillPenalty] = useState<string>();

  const handleProceedToPay = (amortData: any, udiData: any) => {
    setPrefillPenalty(undefined);
    setSelectedMoSchedOthPay(undefined);
    setSelectedMoSched(amortData);
    setSelectedUdiSched(udiData);
  }

  const handleCollectPenalty = (amortData: any, udiData: any, penalty: string) => {
    setPrefillPenalty(penalty);
    setSelectedMoSchedOthPay(undefined);
    setSelectedMoSched(amortData);
    setSelectedUdiSched(udiData);
  }
  
  const handleProceedToOtherPay = (amortData: any, udiData: any) => {
    setSelectedMoSched(undefined);
    setSelectedMoSchedOthPay(amortData);
    setSelectedUdiSched(udiData);
  }

  const handleReversePayment = async (row: any) => {
    const result = await fnReversePayment(row, String(loanSingleData?.id));

    // The hook already handles success/error notifications and data refetch
    // No additional form closing needed here since this isn't a modal form
  }

  useEffect(() => {
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        {header}
        <CardBody>
      <KeyValueColumns>
        <KeyValueList>
          <KeyValueRow label="Borrower" valueClass="uppercase">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</KeyValueRow>
          <KeyValueRow label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</KeyValueRow>
          <KeyValueRow label="Status">{ loanStatus(loanSingleData?.status) }</KeyValueRow>
          <KeyValueRow label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</KeyValueRow>
          <KeyValueRow label="Loan Ref #:">{loanSingleData?.loan_ref}</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Term">{loanSingleData?.term} Mo/s.</KeyValueRow>
          <KeyValueRow label="Total Deduction">{formatNumber(totalDeduction)}</KeyValueRow>
          <KeyValueRow label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</KeyValueRow>
          <KeyValueRow label="Loan Proceeds" total>{formatNumber(Number(loanSingleData?.loan_proceeds))}</KeyValueRow>
        </KeyValueList>
        <KeyValueList>
          <KeyValueRow label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</KeyValueRow>
        </KeyValueList>
      </KeyValueColumns>
        </CardBody>
      </Card>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {/* First Column - Payment Schedule */}
          <div>
            <Card>
              <CardHeader
                as="h4"
                title={<><span className="font-semibold">Loan Ref:</span> {loanSingleData?.loan_ref}</>}
              />
              <ScheduleSummary views={rowViews} rows={loanSingleData?.loan_schedules} />

              <div className="grid grid-cols-2 sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6">
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Due Date</p>
                </div>
                <div className="hidden sm:flex items-center justify-end">
                  <p className="text-xs sm:text-sm font-semibold">Amortization</p>
                </div>
                <div className="flex items-center justify-end">
                  <p className="text-xs sm:text-sm font-semibold">Interest</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs sm:text-sm font-semibold">Actions</p>
                </div>
              </div>

              {loanSingleData?.loan_schedules?.map((item, i) => {
                const view = rowViews[i];
                const paid = view?.state === 'paid';
                const carried = Number(item?.carried_penalty ?? 0) > 0 ? String(item?.carried_penalty) : null;
                return (
                <div
                  className={`relative grid grid-cols-2 sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6 ${ROW_MARKER[view?.state ?? 'upcoming']}`}
                  key={i}
                >
                  <div className="flex flex-col justify-center gap-1">
                    <p className={`text-xs sm:text-sm tabular-nums ${paid ? 'text-body dark:text-bodydark' : 'text-black dark:text-white'}`}>{item?.due_date}</p>
                    {view && <ScheduleRowStatus view={view} />}
                    {carried && (
                      <p className="text-xs font-medium text-[#8A5A00] dark:text-warning tabular-nums">
                        Penalty due ₱{formatNumberComma(Number(carried))}
                        <span className="font-normal text-body dark:text-bodydark"> · charged at last due</span>
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center justify-end">
                    {/* What is still due, as the server sends it: 0.00 once paid -- the zero staff check after
                        posting (2026-10-14). What was paid is on the badge's line. */}
                    <p className={`text-xs sm:text-sm tabular-nums ${paid ? 'text-body dark:text-bodydark' : 'text-black dark:text-white'}`}>
                      {formatNumberComma(Number(item?.amount))}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className={`text-xs sm:text-sm tabular-nums ${paid ? 'text-body dark:text-bodydark' : 'text-black dark:text-white'}`}>
                      {formatNumberComma(Number(udiByInstallment[i]?.amount ?? 0))}
                    </p>
                  </div>

                  {/* Button Group */}
                  <div className="col-span-2 flex flex-wrap justify-end gap-2 sm:col-span-1">
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                      onClick={() => handleProceedToOtherPay(item, udiByInstallment[i])}
                    >
                      <CreditCard size={15} />
                      <span className="hidden md:inline">Other Payments</span>
                      <span className="md:hidden">Other</span>
                    </Button>

                    {/* A paid row says so in its badge; the disabled "Paid" button is gone. */}
                    {!paid && (
                      <Button
                        variant="secondary"
                        className="flex-1 sm:flex-none whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                        onClick={() => handleProceedToPay(item, udiByInstallment[i])}
                      >
                        <CreditCard size={15} />
                        <span className="hidden lg:inline">Proceed to Pay</span>
                        <span className="lg:hidden">Pay</span>
                      </Button>
                    )}

                    {paid && carried && (
                      <Button
                        variant="secondary"
                        className="flex-1 sm:flex-none whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm border-warning text-[#8A5A00] dark:text-warning"
                        aria-label={`Collect the ₱${formatNumberComma(Number(carried))} penalty on the installment due ${item?.due_date}`}
                        onClick={() => handleCollectPenalty(item, udiByInstallment[i], carried)}
                      >
                        <CreditCard size={15} />
                        <span className="hidden lg:inline">Collect penalty</span>
                        <span className="lg:hidden">Penalty</span>
                      </Button>
                    )}

                    {/* Reverse only where there is a payment to reverse. */}
                    {view?.hasPayments && (
                    <Button
                      variant="danger"
                      className="flex-1 sm:flex-none whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                      onClick={() => handleReversePayment(item)}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <RotateCw size={15} className="animate-spin" />
                          <span className="hidden sm:inline">Reversing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCcw size={15} />
                          Reverse
                        </>
                      )}
                    </Button>
                    )}
                  </div>
                </div>
                );
              })}
            </Card>
          </div>

        {/* Second Column - Payment Form */}
        {(selectedMoSched || selectedMoSchedOthPay) && (
        <div>
          {selectedMoSched && (
            <div className={`${selectedMoSched ? 'fade-in' : 'fade-out'}`}>
              {/* key: a fresh form per installment, so no box or computed Interest carries over
                  from the row clicked before (the Interest box is read-only). */}
              <PaymentCollectionForm key={`${selectedMoSched?.id}-${prefillPenalty ?? ''}`} prefillPenalty={prefillPenalty} selectedMoSched={selectedMoSched} setSelectedMoSched={setSelectedMoSched} selectedUdiSched={selectedUdiSched} onSubmitCollectionPayment={onSubmitCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
          {selectedMoSchedOthPay && (
            <div className={`${selectedMoSchedOthPay ? 'fade-in' : 'fade-out'}`}>
              <OtherPaymentForm key={selectedMoSchedOthPay?.id} selectedMoSchedOthPay={selectedMoSchedOthPay} setSelectedMoSchedOthPay={setSelectedMoSchedOthPay} selectedUdiSched={selectedUdiSched} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default LoanDetails;