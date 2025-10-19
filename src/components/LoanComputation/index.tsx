import React, { useEffect } from 'react';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';

interface ParentFormBr {
  dataComputedLoans: BorrLoanRowData | undefined
}

const LoanComputation: React.FC<ParentFormBr> = ({ dataComputedLoans }) => {

  // {formatNumber(
  //   Number(
  //     dataComputedLoans?.loan_details?.find((entry) =>
  //       entry.description.toLowerCase().includes('collection')
  //     )?.credit || 0 // <-- access credit here
  //   )
  // )}

  const totalDeduction = Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('udi')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('insurance')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('agent fee')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('processing')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('collection')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('notarial')
                            )?.credit || 0 // <-- access credit here
                          ) + 
                          Number(
                            dataComputedLoans?.loan_details?.find((entry) =>
                              entry.description.toLowerCase().includes('penalty')
                            )?.credit || 0 // <-- access credit here
                          );

  useEffect(() => {
    console.log(dataComputedLoans?.loan_details, 'dataComputedLoans?.loan_details');
  }, [dataComputedLoans]);

  return (

    <div className="">
      <section>
        <div className="mx-auto max-w-screen-xl border-dashed border-2 border-sky-500 dark:border-sky-400 px-4 py-8 sm:px-6 sm:py-4 lg:px-4">
          <div className="mx-auto max-w-3xl">
            <h4 className=" font-bold text-gray-200 dark:text-bodydark sm:text-2xl">Computation</h4>
            <div className="mt-8">
              <ul className="space-y-4">
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black dark:bg-strokedark dark:bg-strokedark"></span>
                    <span className="shrink-0 px-6 text-gray-700 dark:text-bodydark text-gray-700 dark:text-bodydark">PN Amount</span>
                    <span className="h-px flex-1 bg-black dark:bg-strokedark dark:bg-strokedark"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Monthly</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.monthly))}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Terms</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{dataComputedLoans?.term}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">PN</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(Number(dataComputedLoans?.pn_amount))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                    <span className="shrink-0 px-6 text-gray-700 dark:text-bodydark">Deductions</span>
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">U.D.I {`(${dataComputedLoans?.loan_product?.udi}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('udi')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Processing Fee {`(${dataComputedLoans?.loan_product?.processing}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('processing')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Agent Fee {`(${dataComputedLoans?.loan_product?.agent_fee}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('agent fee')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Collection Fee {`(${dataComputedLoans?.loan_product?.collection}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('collection')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Insurance Fee {`(${dataComputedLoans?.loan_product?.insurance}%)`}</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('insurance')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Insurance Manual Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('insurance mfee')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Notarial Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                            Number(
                                                              dataComputedLoans?.loan_details?.find((entry) =>
                                                                entry.description.toLowerCase().includes('notarial')
                                                              )?.credit || 0 // <-- access credit here
                                                            )
                                                          )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">Total Deductions</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">{formatNumber(totalDeduction)}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">Loan Proceeds</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">{formatNumber(Number(dataComputedLoans?.loan_proceeds))}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                    <span className="shrink-0 px-6 text-gray-700 dark:text-bodydark">Less</span>
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Outstanding Balance.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('outstanding balance')
                                                                )?.credit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Penalty</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('penalty')
                                                                )?.credit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                    <span className="shrink-0 px-6 text-gray-700 dark:text-bodydark">Add-On</span>
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Rebates.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-gray-900 dark:text-white">{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('rebates')
                                                                )?.debit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Addon Terms</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">{dataComputedLoans?.addon_terms}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Addon Amount</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('addon amount')
                                                                )?.debit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Addon UDI</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark"><span>- </span>{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('addon udi')
                                                                )?.credit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">Addon Total.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    <h3 className="text-sm text-strokedark dark:text-bodydark">{formatNumber(
                                                              Number(
                                                                dataComputedLoans?.loan_details?.find((entry) =>
                                                                  entry.description.toLowerCase().includes('addon total')
                                                                )?.credit || 0 // <-- access credit here
                                                              )
                                                            )}</h3>
                  </div>
                </li>
                <li>
                  <span className="flex items-center">
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                    <span className="shrink-0 px-6 text-gray-700 dark:text-bodydark">New Proceeds of Loan</span>
                    <span className="h-px flex-1 bg-black dark:bg-strokedark"></span>
                  </span>
                </li>
                <li className="flex items-center gap-4 border dark:border-strokedark p-2">
                  <div>
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">Amount</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark dark:text-bodydark font-bold">{formatNumber(Number(dataComputedLoans?.loan_proceeds))}</h3>
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