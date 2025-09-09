import React, { useEffect } from 'react';
import { BorrLoanComputationRes, BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';

interface ParentFormBr {
  setValue: any;
  register: any;
  handleCompTblDecimal: (e: any, name: string) => void;
  dataComputedLoans: any;
}

const FormLoanComputation: React.FC<ParentFormBr> = ({ setValue, handleCompTblDecimal, register, dataComputedLoans }) => {

  // const handleComputationMisc = (e: any, name: string) => {
  //   const value = e.target.value;
  //   const formattedValue = formatToTwoDecimalPlaces(value);
  //   setValue(name, formattedValue);
  // }
  useEffect(() => {
    if (dataComputedLoans) {
      setValue('ob', dataComputedLoans?.ob);
      setValue('penalty', dataComputedLoans?.penalty);
      setValue('rebates', dataComputedLoans?.rebates);
    }
  }, [setValue, dataComputedLoans]);

  return (

    <div className="">
      <section>
        <div className="mx-auto max-w-screen-xl border-dashed border-2 border-sky-500 px-4 py-8 sm:px-6 sm:py-4 lg:px-4">
          <div className="mx-auto max-w-3xl">
            <h4 className=" font-bold text-gray-200 sm:text-2xl">Computation</h4>
            <div className="mt-8">
              <ul className="space-y-4">
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">PN Amount</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Monthly</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.monthly_amort))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Terms</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{dataComputedLoans?.terms}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">PN</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.pn))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">Deductions</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">U.D.I {`(${dataComputedLoans?.deduction_rate?.udi}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.udi))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Processing Fee {`(${dataComputedLoans?.deduction_rate?.processing}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.processing))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Agent Fee {`(${dataComputedLoans?.deduction_rate?.agent_fee}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.agent_fee))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Collection Fee {`(${dataComputedLoans?.deduction_rate?.collection}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.collection))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Insurance Fee {`(${dataComputedLoans?.deduction_rate?.insurance}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.insurance))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Insurance MFee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.insurance_fee))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Notarial Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.deductions?.notarial))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Total Deductions</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">{formatNumber(Number(dataComputedLoans?.total_deductions))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Loan Proceeds</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">{formatNumber(Number(dataComputedLoans?.loan_proceeds))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">Less</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Outstanding Balance.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <input
                      type="text"
                      className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      {...register('ob')}
                      onBlur={(e) => { return handleCompTblDecimal(e, 'ob'); }}
                      placeholder="Enter amount"
                    />
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Penalty</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <input
                      type="text"
                      className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      {...register('penalty')}
                      onBlur={(e) => { return handleCompTblDecimal(e, 'penalty'); }}
                      placeholder="Enter amount"
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
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Rebates.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <input
                      type="text"
                      className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      {...register('rebates')}
                      onBlur={(e) => { return handleCompTblDecimal(e, 'rebates'); }}
                      placeholder="Enter amount"
                    />
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon Amount ({`${Number(dataComputedLoans?.addon_terms)}`} mos.).</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark">{formatNumber(Number(dataComputedLoans?.addon_amount))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon UDI ({`${Number(dataComputedLoans?.addon_udi_rate)}%`}).</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark"><span>- </span>{formatNumber(Number(dataComputedLoans?.addon_udi))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon Total.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark">{formatNumber(Number(dataComputedLoans?.addon_total))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black"></span>
                    <span className="shrink-0 px-6">New Proceeds of Loan</span>
                    <span className="h-px flex-1 bg-black"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Amount</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">{formatNumber(Number(dataComputedLoans?.new_loan_proceeds))}</h3>
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