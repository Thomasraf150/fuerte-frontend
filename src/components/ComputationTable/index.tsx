import React from 'react';
import FormInput from '@/components/FormInput';

interface ComputationTableProps {
  register?: any;
  handleCompTblDecimal?: (e: any, name: string) => void;
}

const ComputationTable: React.FC<ComputationTableProps> = ({ register, handleCompTblDecimal }) => {
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
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Terms</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">3</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">PN</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">3,000.00</h3>
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
                    <h3 className="text-sm text-strokedark">U.D.I</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Processing Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Collection Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Insurance Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark">Notarial Fee</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-gray-900">1,000.00</h3>
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Total Deductions</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">1,000.00</h3>
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
                    <h3 className="text-sm text-strokedark">Outstanding Bal.</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    {register ? (
                      <FormInput
                        id="outstanding_balance"
                        type="text"
                        register={register('outstanding_balance')}
                        enableNumberFormatting={true}
                        onBlur={handleCompTblDecimal ? (e) => handleCompTblDecimal(e, 'outstanding_balance') : undefined}
                        placeholder="Enter amount"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        placeholder="Enter amount"
                      />
                    )}
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div className="flex flex-1 items-center justify-start gap-1">
                    <h3 className="text-sm text-strokedark">Penalty</h3>
                  </div>
                  <div className="flex flex-2 items-center justify-end gap-1">
                    {register ? (
                      <FormInput
                        id="penalty"
                        type="text"
                        register={register('penalty')}
                        enableNumberFormatting={true}
                        onBlur={handleCompTblDecimal ? (e) => handleCompTblDecimal(e, 'penalty') : undefined}
                        placeholder="Enter amount"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        placeholder="Enter amount"
                      />
                    )}
                  </div>
                </li>
                <li className="flex items-center gap-4 border p-2">
                  <div>
                    <h3 className="text-sm text-strokedark font-bold">Loan Proceeds</h3>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <h3 className="text-sm text-strokedark font-bold">1,000.00</h3>
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
                    {register ? (
                      <FormInput
                        id="rebates"
                        type="text"
                        register={register('rebates')}
                        enableNumberFormatting={true}
                        onBlur={handleCompTblDecimal ? (e) => handleCompTblDecimal(e, 'rebates') : undefined}
                        placeholder="Enter amount"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        className="block w-full text-right border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        placeholder="Enter amount"
                      />
                    )}
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
                    <h3 className="text-sm text-strokedark font-bold">1,000.00</h3>
                  </div>
                </li>
              </ul>

              <div className="mt-8 flex justify-end border-t border-gray-100 pt-8">
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

                  <div className="flex justify-end">

                  </div>

                  <div className="flex justify-end">
                    
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComputationTable;