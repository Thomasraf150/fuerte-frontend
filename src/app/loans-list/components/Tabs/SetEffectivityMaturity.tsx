import React, { useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import OnceAMonth from '../TabForm/OnceAMonth';
import TwiceAMonth from '../TabForm/TwiceAMonth';
import DayOfTheWeek from '../TabForm/DayOfTheWeek';
import TwiceAMonthOtherWeek from '../TabForm/TwiceAMonthOtherWeek';
import ManualDate from '../TabForm/ManualDate';
import { formatNumber } from '@/utils/formatNumber';
import useLoans from '@/hooks/useLoans';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { Calendar } from 'react-feather';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => void;
  // handleApproveRelease: (status: number) => void;
}

const SetEffectivityMaturity: React.FC<OMProps> = ({ loanSingleData, handleRefetchData}) => {

  const [paycount, setPaycount] = useState<number>(0);
  const [dateListSelected, setDateListSelected] = useState<string[]>();
  const [newMonthlyList, setNewMonthlyList] = useState<string[]>();
  const [udiComputedList, setUdiComputedList] = useState<string[]>();
  const [selectedOption, setSelectedOption] = useState<string>();
  const { submitApproveRelease, handleUpdateMaturity, fetchLoans } = useLoans();

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    setDateListSelected([]);
  };
  
  const catchSubmitApproval = (status: number) => {
    submitApproveRelease(loanSingleData, dateListSelected ?? [], udiComputedList ?? [], newMonthlyList ?? [], status, handleRefetchData);
  }

  const selectedData = (data: any, pc: number) => {
    const interest: string[] = [];
    const monthly: string[] = [];
    setPaycount(pc);
    data.forEach((element: any) => {
      interest.push(formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / pc));
      monthly.push(formatNumber((Number(loanSingleData?.pn_amount) + Number(loanSingleData?.addon_amount)) / pc));
    });
    setUdiComputedList(interest);
    setNewMonthlyList(monthly);
    setDateListSelected(data);
  }

  if (loanSingleData?.loan_schedules && loanSingleData.loan_schedules.length > 0) {
    return (
      <div>
        <div className="grid grid-cols-7 mb-2">
          {loanSingleData?.acctg_entry === null && loanSingleData?.status === 3 ? (
          <button
              className="bg-green-500 flex justify-between float-right items-center text-white py-2 px-4 mr-2 rounded hover:bg-green-600 text-sm"
              type="button"
              onClick={() => handleUpdateMaturity(loanSingleData?.id, 'change_effectivity', handleRefetchData)}
            >
              <span className="mt-1 mr-1">
                <Calendar size={17} /> 
              </span>
              <span>Update Maturity</span>
            </button>
          ) : ('')}
        </div>
        <div className="grid grid-cols-3 bg-white dark:bg-boxdark p-4 rounded">
          <div className="flow-root border border-gray-100 dark:border-strokedark py-3 shadow-sm mr-3 bg-white dark:bg-boxdark">
            <dl className="-my-3 divide-y divide-gray-100 dark:divide-strokedark text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                <dt className="col-span-3 font-medium p-4 bg-black dark:bg-meta-4 text-white text-center">Monthly Amortization</dt>
                {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
              </div>
              <div className="grid grid-cols-1 p-3 sm:grid-cols-2 sm:gap-4">
                <dt className="font-medium text-center text-gray-900 dark:text-bodydark">Date</dt>
                <dt className="font-medium text-center text-gray-900 dark:text-bodydark">Monthly</dt>
              </div>
              {loanSingleData.loan_schedules && loanSingleData.loan_schedules.map((item, i) => {
              return (
                <div className="grid grid-cols-1 p-3 sm:grid-cols-2 sm:gap-4" key={i}>
                  <dd className="text-gray-700 dark:text-bodydark text-center">{item.due_date}</dd>
                  <dt className="font-medium text-center text-gray-900 dark:text-white">{formatNumber(Number(item.amount))}</dt>
                </div>
              )
            })}
            </dl>
          </div>
          <div className="flow-root border border-gray-100 dark:border-strokedark py-3 shadow-sm bg-white dark:bg-boxdark">
            <dl className="-my-3 divide-y divide-gray-100 dark:divide-strokedark text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                <dt className="col-span-3 font-medium p-4 bg-black dark:bg-meta-4 text-white text-center">UDI Schedule</dt>
                {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
              </div>
              <div className="grid grid-cols-1 p-3 sm:grid-cols-2 sm:gap-4">
                <dt className="font-medium text-center text-gray-900 dark:text-bodydark">Date</dt>
                <dt className="font-medium text-center text-gray-900 dark:text-bodydark">Monthly</dt>
              </div>
              {loanSingleData.loan_udi_schedules && loanSingleData.loan_udi_schedules.map((item, i) => {
              return (
                <div className="grid grid-cols-1 p-3 sm:grid-cols-2 sm:gap-4" key={i}>
                  <dd className="text-gray-700 dark:text-bodydark text-center">{item.due_date}</dd>
                  <dt className="font-medium text-center text-gray-900 dark:text-white">{formatNumber(Number(item.amount))}</dt>
                </div>
              )
            })}
            </dl>
          </div>
        </div>
      </div>

    );
  };
  
  return (
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
          Confirm Approve Loan of with an amount of <strong>{ formatNumber(Number(loanSingleData?.pn_amount)) }</strong>
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
            name="day_of_the_week"
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
            name="manual_date"
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
            <p className="text-gray-700">Twice a month (other week)</p>
          </div>
    
          <input
            type="radio"
            name="twice_a_month_oth_week"
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
              <OnceAMonth term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval}/>
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
                {dateListSelected && dateListSelected.map((date, i) => {
                  return (
                    <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-gray-900">{date}</dt>
                      <dd className="text-gray-700 text-center">{formatNumber((Number(loanSingleData?.pn_amount) + Number(loanSingleData?.addon_amount)) / paycount)}</dd>
                      <dt className="font-medium text-center text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / paycount)}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </>
      )}
      {selectedOption === 'twice_a_month' && (
        <>
          <div>
              <TwiceAMonth term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval} />
          </div>
          <div className="col-span-2">
            <div className="flow-root  border border-gray-100 py-3 shadow-sm">
              <dl className="-my-3 divide-y divide-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="col-span-3 font-medium p-4 bg-black text-white text-center">Payment for twice a month</dt>
                  {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
                </div>
                <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-center text-gray-900">Date</dt>
                  <dt className="font-medium text-center text-gray-900">Monthly</dt>
                  <dd className="text-gray-700 text-center">Interest</dd>
                </div>
                {dateListSelected && dateListSelected.map((date, i) => {
                  return (
                    <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-gray-900">{date}</dt>
                      <dd className="text-gray-700 text-center">{formatNumber((Number(loanSingleData?.monthly) / 2))} </dd>
                      <dt className="font-medium text-center text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / paycount)}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </>
      )}
      {selectedOption === 'day_of_the_week' && (
        <>
          <div>
              <DayOfTheWeek term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval} />
          </div>
          <div className="col-span-2">
            <div className="flow-root  border border-gray-100 py-3 shadow-sm">
              <dl className="-my-3 divide-y divide-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="col-span-3 font-medium p-4 bg-black text-white text-center">Payment for day of the week (weekly)</dt>
                  {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
                </div>
                <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-center text-gray-900">Date</dt>
                  <dt className="font-medium text-center text-gray-900">Monthly</dt>
                  <dd className="text-gray-700 text-center">Interest</dd>
                </div>
                {dateListSelected && dateListSelected.map((date, i) => {
                  return (
                    <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-gray-900">{date}</dt>
                      <dd className="text-gray-700 text-center">{formatNumber((Number(loanSingleData?.pn_amount) + Number(loanSingleData?.addon_amount)) / paycount)}</dd>
                      <dt className="font-medium text-center text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / paycount)}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </>
      )}
      {selectedOption === 'manual_date' && (
        <>
          <div>
              <ManualDate term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval} />
          </div>
          <div className="col-span-2">
            <div className="flow-root  border border-gray-100 py-3 shadow-sm">
              <dl className="-my-3 divide-y divide-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="col-span-3 font-medium p-4 bg-black text-white text-center">Payment for manual date</dt>
                  {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
                </div>
                <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-center text-gray-900">Date</dt>
                  <dt className="font-medium text-center text-gray-900">Monthly</dt>
                  <dd className="text-gray-700 text-center">Interest</dd>
                </div>
                {dateListSelected && dateListSelected.map((date, i) => {
                  return (
                    <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-gray-900">{date}</dt>
                      <dd className="text-gray-700 text-center">{formatNumber((Number(loanSingleData?.pn_amount) + Number(loanSingleData?.addon_amount)) / paycount)}</dd>
                      <dt className="font-medium text-center text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / paycount)}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </>
      )}
      {selectedOption === 'twice_a_month_oth_week' && (
        <>
          <div>
              <TwiceAMonthOtherWeek term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval} />
          </div>
          <div className="col-span-2">
            <div className="flow-root  border border-gray-100 py-3 shadow-sm">
              <dl className="-my-3 divide-y divide-gray-100 text-sm">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="col-span-3 font-medium p-4 bg-black text-white text-center">Payment for twice a month other week</dt>
                  {/* <dd className="text-gray-700 sm:col-span-2">Mr</dd> */}
                </div>
                <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-center text-gray-900">Date</dt>
                  <dt className="font-medium text-center text-gray-900">Monthly</dt>
                  <dd className="text-gray-700 text-center">Interest</dd>
                </div>
                {dateListSelected && dateListSelected.map((date, i) => {
                  return (
                    <div className="grid grid-cols-3 gap-1 p-3 sm:grid-cols-3 sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-gray-900">{date}</dt>
                      <dd className="text-gray-700 text-center">{formatNumber((Number(loanSingleData?.pn_amount) + Number(loanSingleData?.addon_amount)) / paycount)}</dd>
                      <dt className="font-medium text-center text-gray-900">{formatNumber(Number(loanSingleData?.loan_details[2]?.credit) / paycount)}</dt>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default SetEffectivityMaturity;






