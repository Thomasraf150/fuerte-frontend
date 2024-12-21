"use client";

import React, { useEffect, useState } from 'react';
import CustomDatatable from '@/components/CustomDatatable';
// import soaListColumn from './SoaListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useNotesReceivable from '@/hooks/useNotesReceivable';
import moment from 'moment';
import DatePicker from 'react-datepicker';

// const column = soaListColumn;

const BorrNrSchedList: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { fetchNotesReceivableList, dataNotesReceivable, nrLoading } = useNotesReceivable();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }
 
  const handleWholeRowClick = (data: BorrLoanRowData) => {
    setShowForm(true);
    setSingleData(data);
  }

  // const handleShowForm = (d: boolean) => {
  //   setShowForm(d);
  //   fetchLoans(1000, 1, 0);
  // }

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      // Reset end date if it's before the new start date
      if (endDate && date > endDate) {
        setEndDate(undefined);
      }
    } else {
      setStartDate(undefined);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date || undefined);
    fetchNotesReceivableList(startDate, endDate);
  };

  useEffect(() => {
    fetchNotesReceivableList(moment('2024-01-01').toDate(), moment('2025-01-15').toDate());
  }, [])

  useEffect(() => {
    console.log(dataNotesReceivable, ' dataNotesReceivable')
  }, [dataNotesReceivable]);

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">

              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-black dark:text-white">
                    Notes Receivable
                  </h3>
                </div>
                <div className="p-7">


                <div className="rounded-lg bg-gray-200 mb-4">
                  <label className="mb-2">Select Date Range:</label>
                  <div className="flex space-x-4">
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      placeholderText="Start Date"
                      className="border rounded px-4 py-2"
                    />
                    <DatePicker
                      selected={endDate}
                      onChange={handleEndDateChange}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate} // Prevent selecting an end date before start date
                      placeholderText="End Date"
                      className="border rounded px-4 py-2"
                    />
                  </div>
                </div>
    
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium w-[250px] min-w-[250px] text-gray-600" rowSpan={2}>Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600" rowSpan={2}>Loan Ref</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Notes Receivable</th>
                        {dataNotesReceivable && dataNotesReceivable?.months?.map(
                          (month) => (
                            <th
                              key={month}
                              className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-600"
                              colSpan={10}
                            >
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Total Collected</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-medium text-gray-600" rowSpan={2}>Balance</th>
                      </tr>
                      <tr>
                        {Array(dataNotesReceivable?.months?.length)
                          .fill(null)
                          .flatMap(() =>
                            [
                              "Current Target",
                              "Actual Collection",
                              "UA/SP",
                              "Past Due Target UA/SP",
                              "Actual Collection UA/SP",
                              "Past Due Balance UA/SP",
                              "Advanced Payment",
                              "OB Closed",
                              "Early Full Payments",
                              "Adjustments",
                            ].map((field, idx1) => (
                              <th
                                key={`${field}-${idx1}`}
                                className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-500 w-[150px] min-w-[150px]"
                              >
                                {field}
                              </th>
                            ))
                          )}
                      </tr>
                    </thead>
                    <tbody>
                      {dataNotesReceivable &&
                        dataNotesReceivable.data?.map((item: any, index: number) => {
                          // Calculate Total Collected
                          const totalCollected = item.trans_per_month.reduce((sum: number, value: any) => {
                            const collection = parseFloat(value.actual_collection) || 0; // Ensure value is a number
                            return sum + collection;
                          }, 0);

                          // Calculate Balance
                          const pnAmount = parseFloat(item.pn_amount) || 0; // Ensure Notes Receivable is a number
                          const balance = pnAmount - totalCollected;

                          return (
                            <tr key={index}>
                              {/* Name */}
                              <td className="border border-gray-300 px-4 py-2">
                                {item?.lastname}, {item?.firstname} {item?.middlename}
                              </td>

                              {/* Loan Reference */}
                              <td className="border border-gray-300 px-4 py-2">{item?.loan_ref}</td>

                              {/* Notes Receivable */}
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {pnAmount.toFixed(2)}
                              </td>

                              {/* Monthly Data */}
                              {dataNotesReceivable?.months?.map((month: any, monthIndex: number) => {
                                const monthlyData = item.trans_per_month.find(
                                  (value: any) => value.month === month
                                );

                                return monthlyData ? (
                                  [
                                    "current_target",
                                    "actual_collection",
                                    "ua_sp",
                                    "past_due_target_ua_sp",
                                    "actual_col_ua_sp",
                                    "past_due_balance_ua_sp",
                                    "advanced_payment",
                                    "ob_closed",
                                    "early_full_payments",
                                    "adjustments",
                                  ].map((field, fieldIndex) => (
                                    <td
                                      key={`${monthIndex}-${fieldIndex}`}
                                      className="border border-gray-300 px-2 py-1 text-right text-sm"
                                    >
                                      {monthlyData[field]}
                                    </td>
                                  ))
                                ) : (
                                  Array(10)
                                    .fill(null)
                                    .map((_, emptyIndex) => (
                                      <td
                                        key={`${monthIndex}-empty-${emptyIndex}`}
                                        className="border border-gray-300 px-2 py-1 text-right text-sm"
                                      >
                                        --
                                      </td>
                                    ))
                                );
                              })}

                              {/* Total Collected */}
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {totalCollected.toFixed(2)}
                              </td>

                              {/* Balance */}
                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {balance.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>



                </div>
              </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrNrSchedList;