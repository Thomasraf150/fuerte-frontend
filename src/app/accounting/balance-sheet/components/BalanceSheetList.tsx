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
import useBranches from '@/hooks/useBranches';
import { formatCurrency } from '@/utils/formatCurrency';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const BalanceSheetList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList, loadingBranches, loadingSubBranches } = useBranches();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(''); // Track selected branch
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
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
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(b => ({
        value: String(b.id),
        label: b.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBranch([
        { value: '', label: 'Select a Branch', hidden: true }, // retain the default "Select a branch" option
        { value: 'all', label: 'All Main Branches' }, // Add "All" option
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
        { value: 'all', label: 'All Sub-Branches' }, // Add "All" option
        ...dynaOpt,
      ]);
    }
  }, [dataBranchSub])

  const handleBranchChange = (branch_id: string) => {
    setBranchId(branch_id);

    // If "all" is selected, auto-select "all" for sub-branch and fetch report
    if (branch_id === 'all') {
      setValue('branch_sub_id', 'all');
      setBranchSubId('all');
      fetchBalanceSheetData(startDate, endDate, 'all');
    } else {
      // Reset sub-branch selection when changing to specific branch
      setValue('branch_sub_id', '');
      setBranchSubId('');

      if (branch_id && branch_id !== '') {
        // Fetch sub-branches for the selected branch
        fetchSubDataList('id_desc', Number(branch_id));
      }
    }
  };

  return (
    <div>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-full">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">

              <div className="rounded-lg bg-gray-200 dark:bg-boxdark p-5">
                <label className="mb-2 text-gray-700 dark:text-bodydark">Select Date Range:</label>
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <div className="w-full sm:w-auto sm:flex-1">
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      placeholderText="Start Date"
                      className="w-full border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-full sm:w-auto sm:flex-1">
                    <DatePicker
                      selected={endDate}
                      onChange={handleEndDateChange}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate} // Prevent selecting an end date before start date
                      placeholderText="End Date"
                      className="w-full border border-stroke dark:border-strokedark rounded px-4 py-2 bg-white dark:bg-form-input text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="w-full sm:w-auto sm:flex-1">
                    <Controller
                      name="branch_id"
                      control={control}
                      rules={{ required: 'Branch is required' }}
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={optionsBranch}
                          placeholder="Select a branch..."
                          isLoading={loadingBranches}
                          loadingMessage={() => 'Loading branches...'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value);
                            handleBranchChange(selectedOption?.value ?? '');
                          }}
                          value={optionsBranch.find(option => String(option.value) === String(field.value)) || null}
                        />
                      )}
                    />
                  </div>
                  <div className="w-full sm:w-auto sm:flex-1">
                    <Controller
                      name="branch_sub_id"
                      control={control}
                      rules={{ required: 'Sub Branch is required' }}
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={optionsSubBranch}
                          placeholder="Select a sub branch..."
                          isDisabled={branchId === 'all' || loadingSubBranches}
                          isLoading={loadingSubBranches}
                          loadingMessage={() => 'Loading sub-branches...'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value);
                            handleBranchSubChange(selectedOption?.value ?? '');
                          }}
                          value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              cursor: state.isDisabled ? 'not-allowed' : 'default',
                              opacity: state.isDisabled ? 0.6 : 1,
                              backgroundColor: state.isDisabled ? '#f3f4f6' : base.backgroundColor
                            })
                          }}
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

              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[300px] max-h-[70vh] lg:h-[600px]">
                {balanceSheetData !== undefined ? (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-meta-4 border-b-2 border-gray-300 dark:border-strokedark">
                        <th className="px-6 py-4 text-left font-bold text-gray-900 dark:text-white md:min-w-[280px] lg:min-w-[400px]">Account Name</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">Account Number</th>
                        <th className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Assets Section */}
                      <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-blue-900 dark:text-blue-300">
                          ASSETS
                        </td>
                      </tr>
                      {balanceSheetData?.assets?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-gray-200 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">{item.number}</td>
                            <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-gray-800 dark:text-gray-200">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{child.number}</td>
                                <td className="px-6 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-gray-700 dark:text-gray-300">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-700 dark:text-gray-300">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-300 dark:border-blue-700">
                        <td className="px-6 py-3 font-bold text-blue-900 dark:text-blue-300">TOTAL ASSETS</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right font-bold text-lg text-blue-900 dark:text-blue-300">{formatCurrency(balanceSheetData.total_assets)}</td>
                      </tr>

                      {/* Liabilities Section */}
                      <tr className="bg-orange-50 dark:bg-orange-900/20 border-t-2 border-orange-200 dark:border-orange-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-orange-900 dark:text-orange-300">
                          LIABILITIES
                        </td>
                      </tr>
                      {balanceSheetData?.liabilities?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-gray-200 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">{item.number}</td>
                            <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-gray-800 dark:text-gray-200">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{child.number}</td>
                                <td className="px-6 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-gray-700 dark:text-gray-300">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-700 dark:text-gray-300">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-orange-100 dark:bg-orange-900/30 border-t-2 border-orange-300 dark:border-orange-700">
                        <td className="px-6 py-3 font-bold text-orange-900 dark:text-orange-300">TOTAL LIABILITIES</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right font-bold text-lg text-orange-900 dark:text-orange-300">{formatCurrency(balanceSheetData.total_liabilities)}</td>
                      </tr>

                      {/* Equity Section */}
                      <tr className="bg-green-50 dark:bg-green-900/20 border-t-2 border-green-200 dark:border-green-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-green-900 dark:text-green-300">
                          EQUITY
                        </td>
                      </tr>
                      {balanceSheetData?.equity?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-gray-200 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">{item.number}</td>
                            <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-gray-800 dark:text-gray-200">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{child.number}</td>
                                <td className="px-6 py-2 text-right text-gray-800 dark:text-gray-200">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-gray-100 dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-gray-700 dark:text-gray-300">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right text-sm text-gray-700 dark:text-gray-300">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                        <td className="px-6 py-3 font-bold text-green-900 dark:text-green-300">TOTAL EQUITY</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right font-bold text-lg text-green-900 dark:text-green-300">{formatCurrency(balanceSheetData.total_equity)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No balance sheet data available. Please select a date range and branch.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BalanceSheetList;