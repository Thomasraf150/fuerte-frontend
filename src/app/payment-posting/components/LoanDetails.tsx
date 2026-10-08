import React, { useEffect, useState } from 'react';
import { BorrLoanRowData, CollectionFormValues, OtherCollectionFormValues } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import { loanStatus, formatNumberComma } from '@/utils/helper';
import { CheckCircle, CreditCard, RefreshCcw, Save, RotateCw } from 'react-feather';
import useLoans from '@/hooks/useLoans';
import PaymentCollectionForm from './Form/PaymentCollectionForm';
import OtherPaymentForm from './Form/OtherPaymentForm';
import usePaymentPosting from '@/hooks/usePaymentPosting';
import Button from '@/components/Button';
import { Card, CardHeader, CardBody } from '@/components/Card';
/** One label and its figure (receipt row): the figure right-aligned in tabular numerals. */
const Row: React.FC<{ label: string; children: React.ReactNode; total?: boolean; valueClass?: string }> = ({ label, children, total = false, valueClass = '' }) => (
  <div className={`flex items-baseline justify-between gap-4 py-1.5 text-sm ${total ? 'mt-1 border-t border-stroke pt-2 font-bold dark:border-strokedark' : ''}`}>
    <dt className={total ? 'text-black dark:text-white' : 'text-body dark:text-bodydark'}>{label}</dt>
    <dd className={`text-right tabular-nums text-black dark:text-white ${valueClass}`}>{children}</dd>
  </div>
);

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">{children}</dl>
);

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

  const totalDeduction = Number(loanSingleData?.loan_details[2]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[3]?.credit ?? 0) + 
                        Number(loanSingleData?.loan_details[4]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[5]?.credit ?? 0)
                        Number(loanSingleData?.loan_details[6]?.credit ?? 0);

  const handleProceedToPay = (amortData: any, udiData: any) => {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel>
          <Row label="Borrower" valueClass="uppercase">{loanSingleData?.borrower?.lastname + ', ' + loanSingleData?.borrower?.firstname}</Row>
          <Row label="PN Amount">{ formatNumber(Number(loanSingleData?.pn_amount)) }</Row>
          <Row label="Status">{ loanStatus(loanSingleData?.status) }</Row>
          <Row label="Monthly">{formatNumber(Number(loanSingleData?.monthly))}</Row>
          <Row label="Loan Ref #:">{loanSingleData?.loan_ref}</Row>
        </Panel>
        <Panel>
          <Row label="Term">{loanSingleData?.term} Mo/s.</Row>
          <Row label="Total Deduction">{formatNumber(totalDeduction)}</Row>
          <Row label="Total Interest">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit))}</Row>
          <Row label="Loan Proceeds" total>{formatNumber(Number(loanSingleData?.loan_proceeds))}</Row>
        </Panel>
        <Panel>
          <Row label="Transaction Date">{formatDate(String(loanSingleData?.created_at))}</Row>
        </Panel>
        {/* Add more grid items as needed */}
      </div>
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

              <div className="grid grid-cols-[auto_auto_1fr] sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6">
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Due Date</p>
                </div>
                <div className="hidden sm:flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Amortization</p>
                </div>
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm font-semibold">Interest</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-semibold">Actions</p>
                </div>
              </div>

              {loanSingleData?.loan_schedules?.map((item, i) => (
                <div
                  className="grid grid-cols-[auto_auto_1fr] sm:grid-cols-[minmax(100px,auto)_minmax(100px,auto)_minmax(80px,auto)_1fr] gap-2 sm:gap-4 border-t border-stroke px-2 sm:px-4 py-2 dark:border-strokedark md:px-6"
                  key={i}
                >
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">{item?.due_date}</p>
                  </div>
                  <div className="hidden sm:flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">{formatNumberComma(Number(item?.amount))}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm text-black dark:text-white">
                      {formatNumberComma(Number(loanSingleData?.loan_udi_schedules[i]?.amount))}
                    </p>
                  </div>

                  {/* Button Group */}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                      onClick={() => handleProceedToOtherPay(item, loanSingleData?.loan_udi_schedules[i])}
                    >
                      <CreditCard size={15} />
                      <span className="hidden md:inline">Other Payments</span>
                      <span className="md:hidden">Other</span>
                    </Button>

                    {item?.amount > 0 ? (
                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                        onClick={() => handleProceedToPay(item, loanSingleData?.loan_udi_schedules[i])}
                      >
                        <CreditCard size={15} />
                        <span className="hidden lg:inline">Proceed to Pay</span>
                        <span className="lg:hidden">Pay</span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
                        disabled
                      >
                        <CheckCircle size={15} />
                        Paid
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      className="w-full sm:w-auto whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm"
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
                  </div>
                </div>
              ))}
            </Card>
          </div>

        {/* Second Column - Payment Form */}
        {(selectedMoSched || selectedMoSchedOthPay) && (
        <div>
          {selectedMoSched && (
            <div className={`${selectedMoSched ? 'fade-in' : 'fade-out'}`}>
              <PaymentCollectionForm selectedMoSched={selectedMoSched} setSelectedMoSched={setSelectedMoSched} selectedUdiSched={selectedUdiSched} onSubmitCollectionPayment={onSubmitCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
          {selectedMoSchedOthPay && (
            <div className={`${selectedMoSchedOthPay ? 'fade-in' : 'fade-out'}`}>
              <OtherPaymentForm selectedMoSchedOthPay={selectedMoSchedOthPay} setSelectedMoSchedOthPay={setSelectedMoSchedOthPay} selectedUdiSched={selectedUdiSched} onSubmitOthCollectionPayment={onSubmitOthCollectionPayment} paymentLoading={paymentLoading}/>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default LoanDetails;