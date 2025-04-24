"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import CustomDatatable from '@/components/CustomDatatable';
// import soaListColumn from './SoaListColumn';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import useNotesReceivable from '@/hooks/useNotesReceivable';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import useSummaryTicket from '@/hooks/useSummaryTicket';
import useBranches from '@/hooks/useBranches';

// const column = soaListColumn;
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const BorrNrSchedList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loanRef, setLoanRef] = useState<any>('');
  const [singleData, setSingleData] = useState<BorrLoanRowData>();
  const { fetchNotesReceivableList, dataNotesReceivable, nrLoading } = useNotesReceivable();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket } = useSummaryTicket();
  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();
  const [branchSubId, setBranchSubId] = useState<string>('');

  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

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

  const handleBranchChange = (branch_id: string) => {
    // fetchSummaryTixReport(startDate, endDate, branch_id);
    // setBranchSubId(branch_id);
    fetchSubDataList('id_desc', Number(branch_id));
  };

  const handleBranchSubChange = (branch_sub_id: string) => {
    fetchSummaryTixReport(startDate, endDate, branch_sub_id);
    setBranchSubId(branch_sub_id);
  };

  const handleSearch = () => {

  }

  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  useEffect(()=>{
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(b => ({
        value: String(b.id),
        label: b.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBranch([
        { value: '', label: 'Select a Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      
    }
  }, [dataBranch])

  useEffect(()=>{
    if (dataBranchSub && Array.isArray(dataBranchSub)) {
      const dynaOpt: Option[] = dataBranchSub?.map(bSub => ({
        value: String(bSub.id),
        label: bSub.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsSubBranch([
        { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
        ...dynaOpt,
      ]);
      
    }
  }, [dataBranchSub])

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
                  <h3 className="text-sm text-black dark:text-white">
                    Notes Receivable
                  </h3>
                </div>
                <div className="p-7">


                <div className="rounded-lg bg-gray-200 mb-4 p-4">
                  <label className="mb-4 block font-semibold text-gray-800">Select Date Range and Filters:</label>
                  
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Start Date */}
                    <div className="flex flex-col">
                      <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700">
                        Start Date:
                      </label>
                      <DatePicker
                        id="startDate"
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        className="border rounded px-4 py-2"
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col">
                      <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700">
                        End Date:
                      </label>
                      <DatePicker
                        id="endDate"
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="End Date"
                        className="border rounded px-4 py-2"
                      />
                    </div>

                    {/* Loan Ref Input */}
                    <div className="flex flex-col">
                      <label htmlFor="loanRef" className="mb-1 text-sm font-medium text-gray-700">
                        Loan Ref:
                      </label>
                      <input
                        id="loanRef"
                        type="text"
                        placeholder="Loan Ref"
                        value={loanRef}
                        onChange={(e) => setLoanRef(e.target.value)}
                        className="border rounded px-4 py-2 w-40"
                      />
                    </div>

                    {/* Branch Select */}
                    <div className="flex flex-col min-w-[200px]">
                      <label htmlFor="branchSelect" className="mb-1 text-sm font-medium text-gray-700">
                        Branch:
                      </label>
                      <Controller
                        name="branch_id"
                        control={control}
                        rules={{ required: 'Branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsBranch}
                            placeholder="Select a branch..."
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value);
                              handleBranchChange(selectedOption?.value ?? '');
                            }}
                            value={optionsBranch.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                    </div>

                    {/* Sub Branch Select */}
                    <div className="flex flex-col min-w-[200px]">
                      <label htmlFor="subBranchSelect" className="mb-1 text-sm font-medium text-gray-700">
                        Sub Branch:
                      </label>
                      <Controller
                        name="branch_sub_id"
                        control={control}
                        rules={{ required: 'Sub branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            {...field}
                            options={optionsSubBranch}
                            placeholder="Select a sub branch..."
                            onChange={(selectedOption) => {
                              field.onChange(selectedOption?.value);
                              handleBranchSubChange(selectedOption?.value ?? '');
                            }}
                            value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                          />
                        )}
                      />
                    </div>

                    {/* Search Button */}
                    <div className="flex flex-col">
                      <label className="mb-1 text-sm font-medium text-transparent select-none">Search</label>
                      <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>

    
                <div className="overflow-x-auto overflow-h-auto h-[600px]">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm w-[100px] min-w-[320px] text-gray-600" rowSpan={2}>Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-sm text-gray-600" rowSpan={2}>Loan Ref</th>
                        <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Notes Receivable</th>
                        {dataNotesReceivable && dataNotesReceivable?.months?.map(
                          (month) => (
                            <th
                              key={month}
                              className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-600"
                              colSpan={10}
                            >
                              {month}
                            </th>
                          )
                        )}
                        <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Total Collected</th>
                        <th className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-600" rowSpan={2}>Balance</th>
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
                                className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-500 w-[150px] min-w-[150px]"
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
                          const isSelected = selectedRow === index;

                          const totalCollected = item.trans_per_month.reduce((sum: number, value: any) => {
                            const collection = parseFloat(value.actual_collection) || 0;
                            return sum + collection;
                          }, 0);

                          const pnAmount = parseFloat(item.pn_amount) || 0;
                          const balance = pnAmount - totalCollected;

                          return (
                            <tr
                              key={index}
                              onClick={() => setSelectedRow(index)}
                              className={`${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'} cursor-pointer`}
                            >
                              <td className="border border-gray-300 text-sm px-4 py-2">
                                {item?.lastname}, {item?.firstname} {item?.middlename}
                              </td>
                              <td className="border border-gray-300 text-sm px-4 py-2">{item?.loan_ref}</td>
                              <td className="border border-gray-300 text-sm px-4 py-2 text-right">
                                {pnAmount.toFixed(2)}
                              </td>

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
                                  Array(10).fill(null).map((_, emptyIndex) => (
                                    <td
                                      key={`${monthIndex}-empty-${emptyIndex}`}
                                      className="border border-gray-300 px-2 py-1 text-right text-sm"
                                    >
                                      --
                                    </td>
                                  ))
                                );
                              })}

                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {totalCollected.toFixed(2)}
                              </td>
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