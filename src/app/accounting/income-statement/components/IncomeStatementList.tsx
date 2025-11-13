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
import { LoadingSpinner } from '@/components/LoadingStates';
// import useCoa from '@/hooks/useCoa';
import moment from 'moment';
import useBranches from '@/hooks/useBranches';
import { Printer } from 'react-feather';
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const IncomeStatementList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  // const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList, loadingBranches, loadingSubBranches } = useBranches();

  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { isInterestIncomeData, isOtherRevenueData, directFinancingData, otherIncomeExpenseData, lessExpenseData, incomeTaxData, fetchStatementData, printIncomeStatement, loading, printLoading } = useFinancialStatement();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(''); // Track selected branch
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
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
    console.log(dataBranch, ' dataBranch')
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

  useEffect(() => {
    console.log(isInterestIncomeData, ' isInterestIncomeData');
  }, [isInterestIncomeData])

  // Collect all unique keys that look like months
  const monthKeysSet = new Set<string>();

  isInterestIncomeData && isInterestIncomeData.forEach((row: any) => {
    Object.keys(row).forEach((key) => {
      if (
        !["row_count", "AccountName", "acctnumber", "variance"].includes(key)
      ) {
        monthKeysSet.add(key);
      }
    });
  });

  // Optional: sort the month keys chronologically
  const monthKeys = Array.from(monthKeysSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const parseAmount = (val: any) =>
    parseFloat(val?.toString().replace(/,/g, '')) || 0;

  // Format number with commas
  const formatNumber = (num: number) =>
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // interest income
  const totalsIntInc = monthKeys.reduce((acc, month) => {
    console.log(month, 'month');
    console.log(acc, 'acc');
    acc[month] = (isInterestIncomeData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);

  // other  revenue
  const totalsOthRevenue = monthKeys.reduce((acc, month) => {
    acc[month] = (isOtherRevenueData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);

  // direct financing
  const totalsDirectFin = monthKeys.reduce((acc, month) => {
    acc[month] = (directFinancingData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);

  // less expense
  const totalsLessExpense = monthKeys.reduce((acc, month) => {
    acc[month] = (lessExpenseData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);
  
  // other income expense
  const totalsOthIncExpense = monthKeys.reduce((acc, month) => {
    acc[month] = (otherIncomeExpenseData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);
  
  // prov income tax
  const totalsincomeTax = monthKeys.reduce((acc, month) => {
    acc[month] = (incomeTaxData ?? []).reduce(
      (sum: number, row: { [x: string]: any; }) => sum + parseAmount(row[month]),
      0
    );
    return acc;
  }, {} as Record<string, number>);
  
  // interest income variance
  const totalVarianceIntInc = (isInterestIncomeData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );

  // other  revenue variance
  const totalVarianceOthRev = (isOtherRevenueData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );
 
  // direct financing variance
  const totalVarianceDirectFin = (directFinancingData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );
  
  // direct financing variance
  const totalVarianceOthIncExp = (otherIncomeExpenseData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );
 
  // interest expense variance
  const totalVarianceLessExp = (lessExpenseData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );
  
  // Prov Income Tax variance
  const totalVarianceIncTax = (incomeTaxData ?? []).reduce(
    (sum: number, row: { variance: any; }) => sum + parseAmount(row.variance),
    0
  );

  useEffect(() => {
    console.log(monthKeys, 'monthKeys');
  }, [monthKeys]);

  // const monthKeys = incomeStatementData || incomeStatementData.length > 0 ? incomeStatementData.length > 0
  //   ? Object.keys(incomeStatementData[0]).filter(
  //       (key) => !["row_count", "AccountName", "acctnumber", "variance"].includes(key)
  //     )
  //   : [] : [];

  const handlePrint = async () => {
    if (!startDate || !endDate || !branchSubId) {
      alert('Please select date range and branch before printing');
      return;
    }
    await printIncomeStatement(startDate, endDate, branchSubId);
  };

  const handleBranchChange = (branch_id: string) => {
    setBranchId(branch_id);

    // If "all" is selected, auto-select "all" for sub-branch and fetch report
    if (branch_id === 'all') {
      setValue('branch_sub_id', 'all');
      setBranchSubId('all');
      fetchStatementData(startDate, endDate, 'all');
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
      <div className="max-w-12xl">
        <div className="grid grid-cols-1 gap-4">
          <div className="">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">

            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">Report Filters</h3>
            </div>
            <div className="p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Start Date */}
                <div className="flex flex-col relative z-50">
                  <label className="mb-2 text-sm font-medium text-black dark:text-white">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Select start date"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    popperPlacement="bottom-start"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col relative z-50">
                  <label className="mb-2 text-sm font-medium text-black dark:text-white">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="Select end date"
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    popperPlacement="bottom-start"
                  />
                </div>

                {/* Branch Select */}
                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-medium text-black dark:text-white">Branch</label>
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
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    )}
                  />
                </div>

                {/* Sub Branch Select */}
                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-medium text-black dark:text-white">Sub Branch</label>
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
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
            </div>
            </div>

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">
                  Income Statement
                </h3>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={printLoading || !startDate || !endDate || !branchSubId}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Printer size={18} />
                  {printLoading ? 'Generating PDF...' : 'Print Report'}
                </button>
              </div>
              <div className="overflow-x-auto p-7">

              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <LoadingSpinner message="Loading financial data..." size="lg" />
                </div>
              ) : (
                <>

              {/**
               * Interest Income
              */}
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-1">
                  <tr className="bg-gray-2 dark:bg-meta-4">
                    <th className="px-4 py-4 font-medium text-black dark:text-white text-left min-w-[280px]">Account Name</th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="px-4 py-4 font-medium text-black dark:text-white text-right min-w-[120px]">
                        {moment(month, 'YYYY-MM').format('MMM YYYY')}
                      </th>
                    ))}
                    <th className="px-4 py-4 font-medium text-black dark:text-white text-right min-w-[100px]">Variance</th>
                  </tr>
                </thead>
                {isInterestIncomeData && isInterestIncomeData.length > 0 ? (
                  <>
                    <tbody>
                      {isInterestIncomeData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-2 dark:bg-meta-4">
                        <td className="px-4 py-4 font-bold text-black dark:text-white">Total Interest Income</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-black dark:text-white">
                            {formatNumber(totalsIntInc[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-black dark:text-white">
                          {formatNumber(totalVarianceIntInc)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Interest Income end
              */}


              {/**
               * Other Revenue
              */}
              <table className="w-full text-sm mt-6">
                {isOtherRevenueData && isOtherRevenueData.length > 0 ? (
                  <>
                    <tbody>
                      {isOtherRevenueData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-2 dark:bg-meta-4">
                        <td className="px-4 py-4 font-bold text-black dark:text-white">Total Other Revenue</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-black dark:text-white">
                            {formatNumber(totalsOthRevenue[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-black dark:text-white">
                          {formatNumber(totalVarianceOthRev)}
                        </td>
                      </tr>
                      <tr className="bg-primary dark:bg-primary">
                        <td className="px-4 py-4 font-bold text-white">Total Income</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-white">
                            {formatNumber(totalsIntInc[month] + totalsOthRevenue[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-white">
                          {formatNumber(totalVarianceIntInc + totalVarianceOthRev)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Other Revenue end
              */}

              {/**
               * Other Income Expense
              */}
              <table className="w-full text-sm mt-6">
                {lessExpenseData && lessExpenseData.length > 0 ? (
                  <>
                    <tbody>
                      {lessExpenseData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-meta-1 dark:bg-meta-1">
                        <td className="px-4 py-4 font-bold text-white">TOTAL EXPENSE</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-white">
                            {formatNumber(totalsLessExpense[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-white">
                          {formatNumber(totalVarianceLessExp)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Other Income Expense end
              */}
                

               {/**
               * Direct Financing Cost
              */}
              <table className="w-full text-sm mt-6">
                {directFinancingData && directFinancingData.length > 0 ? (
                  <>
                    <tbody>
                      {directFinancingData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary dark:bg-primary">
                        <td className="px-4 py-4 font-bold text-white">NET INCOME BEFORE OTHER INCOME</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-white">
                            {formatNumber((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-white">
                          {formatNumber((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Direct Financing Cost end
              */}
               
               
               {/**
               * Other Income Expense
              */}
              <table className="w-full text-sm mt-6">
                {otherIncomeExpenseData && otherIncomeExpenseData.length > 0 ? (
                  <>
                    <tbody>
                      {otherIncomeExpenseData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-2 dark:bg-meta-4">
                        <td className="px-4 py-4 font-bold text-black dark:text-white">Total</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-black dark:text-white">
                            {formatNumber(totalsOthIncExpense[month])}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-black dark:text-white">
                          {formatNumber(totalVarianceOthIncExp)}
                        </td>
                      </tr>
                      <tr className="bg-primary dark:bg-primary">
                        <td className="px-4 py-4 font-bold text-white">NET INCOME BEFORE INCOME TAX</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-white">
                            {formatNumber(Math.abs((((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month]) - totalsOthIncExpense[month])))}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-white">
                          {formatNumber(Math.abs((((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp) - totalVarianceOthIncExp)))}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Other Income Expense end
              */}
               
               {/**
               * Prov Income Income
              */}
              <table className="w-full text-sm mt-6">
                {incomeTaxData && incomeTaxData.length > 0 ? (
                  <>
                    <tbody>
                      {incomeTaxData.map((row: any, index: number) => (
                        <tr key={index} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-2 dark:hover:bg-meta-4">
                          <td className="px-4 py-4 text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="px-4 py-4 text-right text-black dark:text-white min-w-[120px]">
                              {row[month] ? formatNumber(parseAmount(row[month])) : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-right text-black dark:text-white min-w-[100px]">{row.variance ? formatNumber(parseAmount(row.variance)) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-meta-3 dark:bg-meta-3">
                        <td className="px-4 py-4 font-bold text-white">NET INCOME AFTER TAX</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="px-4 py-4 font-bold text-right text-white">
                            {formatNumber(Math.abs(((((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month]) - totalsOthIncExpense[month]) - totalsincomeTax[month])))}
                          </td>
                        ))}
                        <td className="px-4 py-4 font-bold text-right text-white">
                          {formatNumber(Math.abs((((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp) - totalVarianceOthIncExp) - totalVarianceIncTax))}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="px-4 py-8 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/**
               * Other Income Expense end
              */}

                </>
              )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomeStatementList;