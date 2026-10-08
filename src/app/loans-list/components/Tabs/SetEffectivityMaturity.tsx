import React, { useState } from 'react';
import OnceAMonth from '../TabForm/OnceAMonth';
import TwiceAMonth from '../TabForm/TwiceAMonth';
import ThriceAMonth from '../TabForm/ThriceAMonth';
import DayOfTheWeek from '../TabForm/DayOfTheWeek';
import TwiceAMonthOtherWeek from '../TabForm/TwiceAMonthOtherWeek';
import ManualDate from '../TabForm/ManualDate';
import { formatNumber } from '@/utils/formatNumber';
import useLoans from '@/hooks/useLoans';
import { BorrLoanRowData } from '@/utils/DataTypes';
import { Calendar } from 'react-feather';
import { LoadingSpinner } from '@/components/LoadingStates';
import Button from '@/components/Button';
import { useStableLoading } from '@/hooks/useStableLoading';

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
  const { submitApproveRelease, handleUpdateMaturity, fetchLoans, loading } = useLoans();
  const showLoadingOverlay = useStableLoading(loading);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    setDateListSelected([]);
    setNewMonthlyList(undefined);
    setUdiComputedList(undefined);
    setPaycount(0);
  };
  
  const catchSubmitApproval = (status: number) => {
    submitApproveRelease(loanSingleData, dateListSelected ?? [], udiComputedList ?? [], newMonthlyList ?? [], status, handleRefetchData);
  }

  const selectedData = (data: string[], pc: number) => {
    if (!pc || pc <= 0 || !Number.isFinite(pc)) return;
    const interest: string[] = [];
    const monthly: string[] = [];
    setPaycount(pc);

    const totalPn = Number(loanSingleData?.pn_amount ?? 0) + Number(loanSingleData?.addon_amount ?? 0);
    const udiDetail = loanSingleData?.loan_details?.find((d: any) => d.description === 'udi');
    const totalUdi = Number(udiDetail?.credit ?? 0);

    // Truncate per-month to 2 decimals (matching formatNumber behavior)
    const perMonthPn = Math.floor(totalPn * 100 / pc) / 100;
    const perMonthUdi = Math.floor(totalUdi * 100 / pc) / 100;

    data.forEach((_element: any, index: number) => {
      if (index === data.length - 1) {
        // Last payment absorbs the cent remainder so total is exact
        const lastPn = Math.round((totalPn - perMonthPn * (pc - 1)) * 100) / 100;
        const lastUdi = Math.round((totalUdi - perMonthUdi * (pc - 1)) * 100) / 100;
        monthly.push(formatNumber(lastPn));
        interest.push(formatNumber(lastUdi));
      } else {
        monthly.push(formatNumber(perMonthPn));
        interest.push(formatNumber(perMonthUdi));
      }
    });

    setUdiComputedList(interest);
    setNewMonthlyList(monthly);
    setDateListSelected(data);
  }

  if (loanSingleData?.loan_schedules && loanSingleData.loan_schedules.length > 0) {
    return (
      <div>
        <div className="mb-2 flex">
          {loanSingleData?.acctg_entry === null && loanSingleData?.status === 3 ? (
          <Button
              variant="primary"
              className="w-full sm:w-auto"
              type="button"
              onClick={() => handleUpdateMaturity(loanSingleData?.id, 'change_effectivity', handleRefetchData)}
            >
              <Calendar size={17} />
              <span>Update Maturity</span>
            </Button>
          ) : ('')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-boxdark p-4 rounded">
          <div className="flow-root border border-stroke dark:border-strokedark py-3 shadow-sm md:mr-3 bg-white dark:bg-boxdark">
            <dl className="-my-3 divide-y divide-stroke dark:divide-strokedark text-sm">
              <div className="grid grid-cols-1">
                <dt className="border-b border-stroke bg-whiten p-4 text-center text-sm font-bold uppercase tracking-wide text-primary dark:border-strokedark dark:bg-meta-4 dark:text-olive-300">Monthly Amortization</dt>
                {/* <dd className="text-black dark:text-white sm:col-span-2">Mr</dd> */}
              </div>
              <div className="grid grid-cols-2 gap-4 p-3">
                <dt className="font-medium text-center text-black dark:text-bodydark">Date</dt>
                <dt className="font-medium text-center text-black dark:text-bodydark">Monthly</dt>
              </div>
              {loanSingleData.loan_schedules && loanSingleData.loan_schedules.map((item, i) => {
              return (
                <div className="grid grid-cols-2 gap-4 p-3" key={i}>
                  <dd className="text-black dark:text-bodydark text-center">{item.due_date}</dd>
                  <dt className="text-center font-medium tabular-nums text-black dark:text-white">{formatNumber(Number(item.amount))}</dt>
                </div>
              )
            })}
            </dl>
          </div>
          <div className="flow-root border border-stroke dark:border-strokedark py-3 shadow-sm bg-white dark:bg-boxdark">
            <dl className="-my-3 divide-y divide-stroke dark:divide-strokedark text-sm">
              <div className="grid grid-cols-1">
                <dt className="border-b border-stroke bg-whiten p-4 text-center text-sm font-bold uppercase tracking-wide text-primary dark:border-strokedark dark:bg-meta-4 dark:text-olive-300">UDI Schedule</dt>
                {/* <dd className="text-black dark:text-white sm:col-span-2">Mr</dd> */}
              </div>
              <div className="grid grid-cols-2 gap-4 p-3">
                <dt className="font-medium text-center text-black dark:text-bodydark">Date</dt>
                <dt className="font-medium text-center text-black dark:text-bodydark">Monthly</dt>
              </div>
              {loanSingleData.loan_udi_schedules && loanSingleData.loan_udi_schedules.map((item, i) => {
              return (
                <div className="grid grid-cols-2 gap-4 p-3" key={i}>
                  <dd className="text-black dark:text-bodydark text-center">{item.due_date}</dd>
                  <dt className="text-center font-medium tabular-nums text-black dark:text-white">{formatNumber(Number(item.amount))}</dt>
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
    <div className="relative" data-testid="set-effectivity-section">
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-50 flex items-center justify-center rounded-lg" data-testid="set-effectivity-loading-overlay">
          <LoadingSpinner size="lg" message="Saving loan schedule..." />
        </div>
      )}
      <div className="relative block overflow-hidden rounded-lg border border-stroke p-4 mb-4 sm:p-6 lg:p-4">
      <span
        className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-yellow-300 via-orange-300 to-green-500"
      ></span>
    
      <div className="sm:flex sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-bold text-black dark:text-white sm:text-xl">
            Confirm
          </h3>
    
        </div>
      </div>
    
      <div className="mt-1 mb-3">
        <p className="text-pretty text-sm text-body">
          Confirm Approve Loan of with an amount of <strong>{ formatNumber(Number(loanSingleData?.pn_amount ?? 0)) }</strong>
        </p>
      </div>
      </div>
      <h3 className="text-md font-semibold mb-3">Payment Method</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div>
        <label
          htmlFor="once_a_month"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'once_a_month' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Once a month</p>
          </div>
    
          <input
            type="radio"
            name="once_a_month"
            value="once_a_month"
            id="once_a_month"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'once_a_month'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div>
        <label
          htmlFor="twice_a_month"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'twice_a_month' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Twice a month</p>
          </div>
    
          <input
            type="radio"
            name="twice_a_month"
            value="twice_a_month"
            id="twice_a_month"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'twice_a_month'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div>
        <label
          htmlFor="thrice_a_month"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'thrice_a_month' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Thrice a month</p>
          </div>

          <input
            type="radio"
            name="thrice_a_month"
            value="thrice_a_month"
            id="thrice_a_month"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'thrice_a_month'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div>
        <label
          htmlFor="day_of_the_week"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'day_of_the_week' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Day of the week</p>
          </div>
    
          <input
            type="radio"
            name="day_of_the_week"
            value="day_of_the_week"
            id="day_of_the_week"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'day_of_the_week'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div>
        <label
          htmlFor="manual_date"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'manual_date' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Manual Date</p>
          </div>
    
          <input
            type="radio"
            name="manual_date"
            value="manual_date"
            id="manual_date"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'manual_date'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div>
        <label
          htmlFor="twice_a_month_oth_week"
          className={`flex cursor-pointer justify-between gap-4 rounded-lg border p-4 text-sm font-medium shadow-sm hover:border-primary ${
            selectedOption === 'twice_a_month_oth_week' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-stroke'
          }`}
        >
          <div>
            <p className="text-black dark:text-white">Twice a month (other week)</p>
          </div>
    
          <input
            type="radio"
            name="twice_a_month_oth_week"
            value="twice_a_month_oth_week"
            id="twice_a_month_oth_week"
            className="h-5 w-5 border-stroke text-blue-500"
            checked={selectedOption === 'twice_a_month_oth_week'}
            onChange={handleOptionChange}
          />
        </label>
      </div>
      <div className='col-span-full'>
        <span className="flex items-center">
          <span className="h-px flex-1 bg-stroke dark:bg-strokedark"></span>
        </span>
      </div>
      {/* Payment method options - each renders a selector + preview table */}
      {[
        { key: 'once_a_month', title: 'Payment for Once a Month', Component: OnceAMonth },
        { key: 'twice_a_month', title: 'Payment for twice a month', Component: TwiceAMonth },
        { key: 'thrice_a_month', title: 'Payment for thrice a month (e.g. 1/11/21)', Component: ThriceAMonth },
        { key: 'day_of_the_week', title: 'Payment for day of the week (weekly)', Component: DayOfTheWeek },
        { key: 'manual_date', title: 'Payment for manual date', Component: ManualDate },
        { key: 'twice_a_month_oth_week', title: 'Payment for twice a month other week', Component: TwiceAMonthOtherWeek },
      ].map(({ key, title, Component }) =>
        selectedOption === key && (
          <React.Fragment key={key}>
            <div className="col-span-full lg:col-span-1">
              <Component term={Number(loanSingleData?.term)} addon_term={Number(loanSingleData?.addon_terms)} selectedData={selectedData} handleApproveRelease={catchSubmitApproval} loading={loading} />
            </div>
            <div className="col-span-full lg:col-span-2 xl:col-span-4">
              <div className="flow-root border border-stroke py-3 shadow-sm">
                <dl className="-my-3 divide-y divide-stroke text-sm">
                  <div className="grid grid-cols-1">
                    <dt className="border-b border-stroke bg-whiten p-4 text-center text-sm font-bold uppercase tracking-wide text-primary dark:border-strokedark dark:bg-meta-4 dark:text-olive-300">{title}</dt>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 sm:gap-4">
                    <dt className="font-medium text-center text-black dark:text-white">Date</dt>
                    <dt className="font-medium text-center text-black dark:text-white">Monthly</dt>
                    <dt className="font-medium text-center text-black dark:text-white">Interest</dt>
                  </div>
                  {dateListSelected && dateListSelected.map((date, i) => (
                    <div className="grid grid-cols-3 gap-2 p-3 tabular-nums sm:gap-4" key={i}>
                      <dt className="font-medium text-center text-black dark:text-white">{date}</dt>
                      <dd className="text-black dark:text-white text-center">{newMonthlyList?.[i] ?? formatNumber((Number(loanSingleData?.pn_amount ?? 0) + Number(loanSingleData?.addon_amount ?? 0)) / (paycount || 1))}</dd>
                      <dt className="font-medium text-center text-black dark:text-white">{udiComputedList?.[i] ?? formatNumber(Number(loanSingleData?.loan_details?.find((d: any) => d.description === 'udi')?.credit ?? 0) / (paycount || 1))}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </React.Fragment>
        )
      )}
      </div>
    </div>
  );
};

export default SetEffectivityMaturity;






