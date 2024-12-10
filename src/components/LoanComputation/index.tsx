import React, { useEffect } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';

interface ParentFormBr {
  dataComputedLoans: BorrLoanRowData | undefined
}

const LoanComputation: React.FC<ParentFormBr> = ({ dataComputedLoans }) => {

  const totalDeduction = Number(dataComputedLoans?.loan_details[2]?.credit ?? 0) + 
                          Number(dataComputedLoans?.loan_details[3]?.credit ?? 0) + 
                          Number(dataComputedLoans?.loan_details[4]?.credit ?? 0) + 
                          Number(dataComputedLoans?.loan_details[5]?.credit ?? 0) +
                          Number(dataComputedLoans?.loan_details[6]?.credit ?? 0);

  useEffect(() => {
    console.log(dataComputedLoans, ' dataComputedLoans');
  }, [dataComputedLoans]);

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
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.monthly))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Terms</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{dataComputedLoans?.term}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">PN</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.pn_amount))}</h3>
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
                    <h3 className="text-sm text-strokedark">U.D.I {`(${dataComputedLoans?.loan_product?.udi}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[2]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Processing Fee {`(${dataComputedLoans?.loan_product?.processing}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[3]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Collection Fee {`(${dataComputedLoans?.loan_product?.collection}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[4]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Insurance Fee {`(${dataComputedLoans?.loan_product?.insurance}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[5]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Notarial Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[6]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Total Deductions</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">{formatNumber(totalDeduction)}</h3>
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
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[1]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Penalty</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[9]?.credit))}</h3>
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
                    <h3 className="text-sm text-gray-900">{formatNumber(Number(dataComputedLoans?.loan_details[8]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon Terms</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark">{dataComputedLoans?.addon_terms}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon Amount</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark">{formatNumber(Number(dataComputedLoans?.loan_details[10]?.debit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon UDI</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark"><span>- </span>{formatNumber(Number(dataComputedLoans?.loan_details[11]?.credit))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Addon Total.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark">{formatNumber(Number(dataComputedLoans?.loan_details[12]?.credit))}</h3>
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
                    <h3 className="text-sm text-strokedark font-bold">{formatNumber(Number(dataComputedLoans?.loan_proceeds))}</h3>
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

export default LoanComputation;