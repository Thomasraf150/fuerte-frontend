"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';
import ReactSelect from '@/components/ReactSelect';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles.css';
import useCoa from '@/hooks/useCoa';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const IncomeStatementList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const { onSubmitCoa, branchSubData } = useCoa();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { incomeStatementData, months, fetchStatementData } = useFinancialStatement();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
    fetchStatementData(startDate, endDate, branch_sub_id);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date || undefined);
    // fetchSummaryTixReport(startDate, endDate);
  };

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

  useEffect(() => {

    console.log(incomeStatementData, ' incomeStatementData');
    console.log(months, ' months');
  }, [incomeStatementData, months])

    useEffect(()=>{
      if (branchSubData && Array.isArray(branchSubData)) {
        const dynaOpt: Option[] = branchSubData?.map(bSub => ({
          value: String(bSub.id),
          label: bSub.name, // assuming `name` is the key you want to use as label
        }));
        setOptionsSubBranch([
          { value: '', label: 'Select a Sub Branch', hidden: true }, // retain the default "Select a branch" option
          ...dynaOpt,
        ]);
        
      }
      
    }, [branchSubData])

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
             
              <div className="rounded-lg bg-gray-200 p-5">
                <label className="mb-2">Select Date Range:</label>
                <div className="flex space-x-2">
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
                  <div className="w-75">
                    <Controller
                      name="branch_sub_id"
                      control={control}
                      rules={{ required: 'Branch is required' }} 
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={optionsSubBranch}
                          placeholder="Select a branch..."
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value);
                            handleBranchSubChange(selectedOption?.value ?? '');
                          }}
                          value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex space-x-1">
                  
                </div>
              </div>

              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Income Statement
                </h3>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                <table className="table-auto w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Account Name</th>
                      <th className="border p-2">Account Number</th>
                      {months !== undefined && months.map((month) => (
                        <th key={month} className="border p-2">{month}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incomeStatementData !== undefined && incomeStatementData?.map((item: any, index: number) => (
                      <tr key={index} className="border">
                        <td className="border p-2">{item.account_name}</td>
                        <td className="border p-2">{item.account_number}</td>
                        {months.map((month) => {
                          const monthlyValue = item.monthly_values.find(
                            (mv: any) => mv.month === month
                          );
                          return (
                            <td key={month} className="border p-2">
                              {monthlyValue ? monthlyValue.value : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                {incomeStatementData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Revenue</h2>
                        <ul>
                          {incomeStatementData?.revenues?.map((item: any) => (
                            <li key={item.number} className="ml-4 border-l-4 pl-2">
                              <strong>{item.account_name}:</strong> ₱{Number(item.balance).toFixed(2)}
                              {item.subAccounts?.length > 0 && (
                                <ul className="ml-4">
                                  {item.subAccounts.map((child: any) => (
                                    <li key={child.number} className="ml-4">
                                      <strong>{child.account_name}:</strong> ₱{Number(child.balance).toFixed(2)}
                                      {child.subAccounts?.length > 0 && (
                                        <ul className="ml-4">
                                          {child.subAccounts.map((grandChild: any) => (
                                            <li key={grandChild.number} className="ml-4">
                                              {grandChild.account_name}: ₱{Number(grandChild.balance).toFixed(2)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500"></p>
                )}
                   {incomeStatementData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Expense</h2>
                        <ul>
                        {incomeStatementData?.expenses?.map((item: any) => (
                            <li key={item.number} className="ml-4 border-l-4 pl-2">
                              <strong>{item.account_name}:</strong> ₱{Number(item.balance).toFixed(2)}
                              {item.subAccounts?.length > 0 && (
                                <ul className="ml-4">
                                  {item.subAccounts.map((child: any) => (
                                    <li key={child.number} className="ml-4">
                                      <strong>{child.account_name}:</strong> ₱{Number(child.balance).toFixed(2)}
                                      {child.subAccounts?.length > 0 && (
                                        <ul className="ml-4">
                                          {child.subAccounts.map((grandChild: any) => (
                                            <li key={grandChild.number} className="ml-4">
                                              {grandChild.account_name}: ₱{Number(grandChild.balance).toFixed(2)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500"></p>
                )}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Revenue</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(String(incomeStatementData?.total_revenue)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Expense</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(String(incomeStatementData?.total_expense)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Income</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{incomeStatementData && parseFloat(String(incomeStatementData?.net_income)).toFixed(2)}</li>
                  </ul>
                </div>
              </div> */}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomeStatementList;