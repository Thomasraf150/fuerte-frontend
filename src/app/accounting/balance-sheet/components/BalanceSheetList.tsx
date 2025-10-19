"use client";

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import ReactSelect from '@/components/ReactSelect';
import useFinancialStatement from '@/hooks/useFinancialStatement';
import { GitBranch, SkipBack } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { DataLoanProceedList, DataAccBalanceSheet } from '@/utils/DataTypes';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles.css';
import useCoa from '@/hooks/useCoa';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const BalanceSheetList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const { onSubmitCoa, branchSubData } = useCoa();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  const { balanceSheetData, fetchBalanceSheetData } = useFinancialStatement();
  
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
    // fetchSummaryTixReport(startDate, endDate);
  };

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
    fetchBalanceSheetData(startDate, endDate, branch_sub_id);
  };

  useEffect(() => {

    console.log(balanceSheetData, ' balanceSheetData');
  }, [balanceSheetData])

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

              <div className="rounded-lg bg-gray-200 dark:bg-boxdark p-5">
                <label className="mb-2 text-gray-700 dark:text-bodydark">Select Date Range:</label>
                <div className="flex space-x-2">
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                  />
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate} // Prevent selecting an end date before start date
                    placeholderText="End Date"
                    className="border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
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
                  Balance Sheet
                </h3>
              </div>
                      
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] h-[600px]">
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Assets</h2>
                        <ul>
                          {balanceSheetData?.assets?.map((item: any) => (
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
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Liabilities</h2>
                        <ul>
                          {balanceSheetData?.liabilities?.map((item: any) => (
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
                {balanceSheetData!== undefined ? (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700">Equity</h2>
                        <ul>
                        {balanceSheetData?.equity?.map((item: any) => (
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
                  <h4 className="text-sm font-semibold text-gray-700">Total Assets</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_assets)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Liabilities</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_liabilities)).toFixed(2)}</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-sm font-semibold text-gray-700">Total Equity</h4>
                  <ul>
                    <li className="ml-4 border-l-4 pl-2">{balanceSheetData && parseFloat(String(balanceSheetData?.total_equity)).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BalanceSheetList;