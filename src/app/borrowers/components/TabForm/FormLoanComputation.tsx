import React, { useEffect } from 'react';
import { BorrLoanComputationRes, BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import FormInput from '@/components/FormInput';
import PesoSign from '@/components/PesoSign';

interface ParentFormBr {
  setValue: any;
  register: any;
  watch: any;
  handleCompTblDecimal: (e: any, name: string) => void;
  dataComputedLoans: any;
}

const FormLoanComputation: React.FC<ParentFormBr> = ({ setValue, handleCompTblDecimal, register, watch, dataComputedLoans }) => {

  // const handleComputationMisc = (e: any, name: string) => {
  //   const value = e.target.value;
  //   const formattedValue = formatToTwoDecimalPlaces(value);
  //   setValue(name, formattedValue);
  // }
  // Note: Removed useEffect that pre-filled ob, penalty, rebates with "0.00"
  // These fields now use placeholder="0.00" for better UX (no pre-filled values to delete)
  // Database still receives "0.00" for empty fields via ensureNumericString() in FormLoans.tsx

  return (

    <div className="">
      <section>
        <div className="mx-auto max-w-screen-xl border-dashed border-2 border-sky-500 px-3 py-4 sm:px-6 sm:py-4 lg:px-4">
          <div className="mx-auto max-w-3xl">
            <h4 className="font-bold text-gray-200 text-xl sm:text-2xl">Computation</h4>
            <div className="mt-4 sm:mt-8">
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">PN Amount</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark">Monthly</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white font-semibold">{formatNumber(Number(dataComputedLoans?.monthly_amort))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark">Terms</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white font-semibold">{dataComputedLoans?.terms}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark">PN</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white font-semibold">{formatNumber(Number(dataComputedLoans?.pn))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">Deductions</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">U.D.I {`(${dataComputedLoans?.deduction_rate?.udi}%)`}</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.udi))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Processing Fee {`(${dataComputedLoans?.deduction_rate?.processing}%)`}</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.processing))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Agent Fee {`(${dataComputedLoans?.deduction_rate?.agent_fee}%)`}</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.agent_fee))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Collection Fee {`(${dataComputedLoans?.deduction_rate?.collection}%)`}</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.collection))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Insurance Fee {`(${dataComputedLoans?.deduction_rate?.insurance}%)`}</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.insurance))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Insurance MFee</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.insurance_fee))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Notarial Fee</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.deductions?.notarial))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3 bg-gray-50 dark:bg-meta-4">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">Total Deductions</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">{formatNumber(Number(dataComputedLoans?.total_deductions))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">Loan Proceeds</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-bold">{formatNumber(Number(dataComputedLoans?.loan_proceeds))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">Less</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Outstanding Balance</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {formatNumber(Number(watch('ob')) || 0)}
                    </h3>
                  </div>
                </li>
                {/* Hidden input to maintain form registration for Outstanding Balance */}
                <input type="hidden" {...register('ob')} />
                <li className="flex flex-col sm:flex-row sm:items-center gap-2 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Penalty</h3>
                  </div>
                  <div className="w-full sm:w-48">
                    <FormInput
                      label=""
                      id="penalty"
                      type="text"
                      icon={PesoSign}
                      register={register('penalty')}
                      placeholder="0.00"
                      formatType="currency"
                      className="text-right"
                      onChange={(e) => handleCompTblDecimal(e, 'penalty')}
                    />
                  </div>
                </li>
                
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">Add-On</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex flex-col sm:flex-row sm:items-center gap-2 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Rebates</h3>
                  </div>
                  <div className="w-full sm:w-48">
                    <FormInput
                      label=""
                      id="rebates"
                      type="text"
                      icon={PesoSign}
                      register={register('rebates')}
                      placeholder="0.00"
                      formatType="currency"
                      className="text-right"
                      onChange={(e) => handleCompTblDecimal(e, 'rebates')}
                    />
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Addon Amount ({`${Number(dataComputedLoans?.addon_terms)}`} mos.)</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.addon_amount))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3">
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm text-strokedark dark:text-bodydark">Addon UDI ({`${Number(dataComputedLoans?.addon_udi_rate)}%`})</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-gray-900 dark:text-white"><span>- </span>{formatNumber(Number(dataComputedLoans?.addon_udi))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3 bg-gray-50 dark:bg-meta-4">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">Addon Total</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">{formatNumber(Number(dataComputedLoans?.addon_total))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">New Proceeds of Loan</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-4 border p-3 bg-green-50 dark:bg-green-900/20">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base text-strokedark dark:text-bodydark font-bold">Amount</h3>
                  </div>
                  <div className="flex items-center justify-end">
                    <h3 className="text-base sm:text-lg text-green-600 dark:text-green-400 font-bold">{formatNumber(Number(dataComputedLoans?.new_loan_proceeds))}</h3>
                  </div>
                </li>
              </ul>

              {/* <div className="mt-8 flex justify-end border-t border-gray-100 pt-8">
                <div className="w-screen max-w-lg space-y-4">
                  <dl className="space-y-0.5 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd>£250</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>VAT</dt>
                      <dd>£25</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Discount</dt>
                      <dd>-£20</dd>
                    </div>
                    <div className="flex justify-between !text-base font-medium">
                      <dt>Total</dt>
                      <dd>£200</dd>
                    </div>
                  </dl>

                </div>
              </div> */}

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FormLoanComputation;