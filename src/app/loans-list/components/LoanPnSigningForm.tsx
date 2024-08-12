"use client";

import React, { useEffect, useState } from 'react';
import { Edit3, X } from 'react-feather';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { formatNumber } from '@/utils/formatNumber';
import { formatDate } from '@/utils/formatDate';
import OnceAMonth from './TabForm/OnceAMonth';

interface BorrInfoProps {
  singleData: BorrLoanRowData | undefined;
  setShowForm: (v: boolean) => void;
}

const LoanPnSigningForm: React.FC<BorrInfoProps> = ({ singleData, setShowForm }) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [dateListSelected, setDateListSelected] = useState<[]>();

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const [selectedOption, setSelectedOption] = useState<string>('once_a_month');

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const selectedData = (data: any) => {
    // console.log(data, 'datadata');
    setDateListSelected(data);
  }

  const totalDeduction = Number(singleData?.loan_details[2]?.credit ?? 0) + 
                          Number(singleData?.loan_details[3]?.credit ?? 0) + 
                          Number(singleData?.loan_details[4]?.credit ?? 0)
                          Number(singleData?.loan_details[5]?.credit ?? 0)
                          Number(singleData?.loan_details[6]?.credit ?? 0);

  useEffect(() => {
    console.log(singleData, 'singleData');
  }, [singleData]);

  return (
    <div className="w-full">
      <div className="border-b flex justify-between items-center border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          {singleData?.loan_product?.description} 
        </h3>
        <span className="text-right cursor-pointer text-boxdark-2" onClick={() => { return setShowForm(false); }}><X size={17}/></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Borrower</td>
                <td className="px-4 py-2 text-gray-900">{singleData?.borrower?.lastname + ', ' + singleData?.borrower?.firstname}</td>
              </tr>
              <tr className="">
              <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">PN Amount</td>
                <td className="px-4 py-2 text-gray-900">{ formatNumber(Number(singleData?.pn_amount)) }</td>
              </tr>
              <tr>
              <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Status</td>
                <td className="px-4 py-2 text-gray-900">{ singleData?.status === 0 ? 'For Approval' : singleData?.status === 1 ? 'Approved' : 'Released' }</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Monthly</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(singleData?.monthly))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Term</td>
                <td className="px-4 py-2 text-gray-900">{singleData?.term} Mo/s.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Total Deduction</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(totalDeduction)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Total Interest</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(singleData?.loan_details[2]?.credit))}</td>
              </tr>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Loan Proceeds</td>
                <td className="px-4 py-2 text-gray-900">{formatNumber(Number(singleData?.loan_proceeds))}</td>
              </tr>
             
            </tbody>
          </table>
        </div>
        <div className="bg-gray-200 p-4 rounded">
          <table className="min-w-full bg-gray-100 border-gray-300 border-separate border-spacing-y-1">
            <thead>
              <tr>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="">
                <td className="px-4 py-2 font-semibold text-gray-700 bg-neutral-100 text-form-strokedark">Transaction Date</td>
                <td className="px-4 py-2 text-gray-900">{formatDate(String(singleData?.created_at))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Add more grid items as needed */}
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-col md:flex-row border-b mt-3">
        <button
          onClick={() => handleTabClick(1)}
          className={`p-4 text-sm font-medium flex items-center ${
            activeTab === 1
              ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          } focus:outline-none`}
        >
          <span className="mr-2"><Edit3 size={18} /></span> <span>Set Effectivity/Maturity</span>
        </button>
        <button
          onClick={() => handleTabClick(2)}
          className={`p-4 text-sm font-medium flex items-center ${
            activeTab === 2
              ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          } focus:outline-none`}
        >
          <span className="mr-2"><Edit3 size={18} /></span> <span>PN Signing</span>
        </button>
        <button
          onClick={() => handleTabClick(3)}
          className={`p-4 text-sm font-medium flex items-center ${
            activeTab === 3
              ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          } focus:outline-none`}
        >
          <span className="mr-2"><Edit3 size={18} /></span> <span>Bank Details Entry</span>
        </button>
        <button
          onClick={() => handleTabClick(4)}
          className={`p-4 text-sm font-medium flex items-center ${
            activeTab === 4
              ? 'border-b-2 md:border-b-0 md:border-r-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          } focus:outline-none`}
        >
          <span className="mr-2"><Edit3 size={18} /></span> <span>Approve and Release</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-white">
        {activeTab === 1 && (
          <div>
            <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 mb-4 sm:p-6 lg:p-4">
              <span
                className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-yellow-300 via-orange-300 to-green-500"
              ></span>

              <div className="sm:flex sm:justify-between sm:gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                    Confirm
                  </h3>

                </div>
              </div>

              <div className="mt-1 mb-3">
                <p className="text-pretty text-sm text-gray-500">
                  Confirm Approve Loan of with an amount of <strong>{ formatNumber(Number(singleData?.pn_amount)) }</strong>
                </p>
              </div>
            </div>
            <h3 className="text-md font-semibold mb-3">Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label
                  htmlFor="once_a_month"
                  className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-gray-200 ${
                    selectedOption === 'once_a_month' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-gray-700">Once a month</p>
                  </div>

                  <input
                    type="radio"
                    name="once_a_month"
                    value="once_a_month"
                    id="once_a_month"
                    className="h-5 w-5 border-gray-300 text-blue-500"
                    checked={selectedOption === 'once_a_month'}
                    onChange={handleOptionChange}
                  />
                </label>
              </div>
              <div>
                <label
                  htmlFor="twice_a_month"
                  className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-gray-200 ${
                    selectedOption === 'twice_a_month' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-gray-700">Twice a month</p>
                  </div>

                  <input
                    type="radio"
                    name="twice_a_month"
                    value="twice_a_month"
                    id="twice_a_month"
                    className="h-5 w-5 border-gray-300 text-blue-500"
                    checked={selectedOption === 'twice_a_month'}
                    onChange={handleOptionChange}
                  />
                </label>
              </div>
              <div>
                <label
                  htmlFor="day_of_the_week"
                  className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-gray-200 ${
                    selectedOption === 'day_of_the_week' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-gray-700">Day of the week</p>
                  </div>

                  <input
                    type="radio"
                    name="DeliveryOption"
                    value="day_of_the_week"
                    id="day_of_the_week"
                    className="h-5 w-5 border-gray-300 text-blue-500"
                    checked={selectedOption === 'day_of_the_week'}
                    onChange={handleOptionChange}
                  />
                </label>
              </div>
              <div>
                <label
                  htmlFor="manual_date"
                  className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-gray-200 ${
                    selectedOption === 'manual_date' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-gray-700">Manual Date</p>
                  </div>

                  <input
                    type="radio"
                    name="DeliveryOption"
                    value="manual_date"
                    id="manual_date"
                    className="h-5 w-5 border-gray-300 text-blue-500"
                    checked={selectedOption === 'manual_date'}
                    onChange={handleOptionChange}
                  />
                </label>
              </div>
              <div>
                <label
                  htmlFor="twice_a_month_oth_week"
                  className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-gray-200 ${
                    selectedOption === 'twice_a_month_oth_week' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-gray-700">Twice a month</p>
                  </div>

                  <input
                    type="radio"
                    name="DeliveryOption"
                    value="twice_a_month_oth_week"
                    id="twice_a_month_oth_week"
                    className="h-5 w-5 border-gray-300 text-blue-500"
                    checked={selectedOption === 'twice_a_month_oth_week'}
                    onChange={handleOptionChange}
                  />
                </label>
              </div>
              <div className='col-span-5'>
                <span className="flex items-center">
                  <span className="h-px flex-1 bg-slate-500"></span>
                </span>
              </div>
              {selectedOption === 'once_a_month' && (
                <>
                  <div>
                      <OnceAMonth term={Number(singleData?.term)} selectedData={selectedData} />
                  </div>
                  <div className="col-span-2">
                    <div className="flow-root  border border-gray-100 py-3 shadow-sm">
                      <dl className="-my-3 divide-y divide-gray-100 text-sm">
                        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-4">
                          <dt className="col-span-3 font-medium p-4 bg-black text-white text-center">Payment for Once a Month</dt>
                          {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                          <dt className="font-medium text-center text-gray-900">Date</dt>
                          <dt className="font-medium text-center text-gray-900">Monthly</dt>
                          <dd className="text-gray-700 text-center">Interest</dd>
                        </div>
                        {dateListSelected && dateListSelected.map((date) => {
                          return (
                            <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                              <dt className="font-medium text-center text-gray-900">{date}</dt>
                              <dd className="text-gray-700 text-center">{formatNumber(Number(singleData?.monthly))}</dd>
                              <dt className="font-medium text-center text-gray-900">{formatNumber(Number(singleData?.loan_details[2]?.credit) / Number(singleData?.term))}</dt>
                            </div>
                          )
                        })
                        }
                      </dl>
                    </div>
                  </div>
                </>
              )}
            </div>


            

          </div>
        )}
        {activeTab === 2 && (
          <div>
            <h2 className="text-xl font-semibold">PN Signing</h2>
            <p>This is the content for PN Signing.</p>
          </div>
        )}
        {activeTab === 3 && (
          <div>
            <h2 className="text-xl font-semibold">Bank Details Entry</h2>
            <p>This is the content for Bank Details Entry.</p>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <h2 className="text-xl font-semibold">Approve and Release</h2>
            <p>This is the content for Approve and Release.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPnSigningForm;