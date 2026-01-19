"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useFinancialStatement, { IncomeStatementRow, IncomeStatementByBranchRow, BreakdownData } from '@/hooks/useFinancialStatement';
import ReactSelect from '@/components/ReactSelect';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles.css';
import { LoadingSpinner } from '@/components/LoadingStates';
import useBranches from '@/hooks/useBranches';
import { Printer } from 'react-feather';
import Decimal from 'decimal.js';
import IncomeStatementTable from './IncomeStatementTable';
import IncomeStatementBySubBranch from './IncomeStatementBySubBranch';
import {
  calculateMonthlyTotals,
  calculateVarianceTotal,
  extractMonthKeys,
  DecimalValue,
} from '../utils/incomeStatementCalculations';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

interface IncomeStatementFormData {
  branch_id: string;
  branch_sub_id: string;
}

const IncomeStatementList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<IncomeStatementFormData>();
  // const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList, loadingBranches, loadingSubBranches } = useBranches();

  const {
    // Aggregated data
    isInterestIncomeData,
    isOtherRevenueData,
    directFinancingData,
    otherIncomeExpenseData,
    lessExpenseData,
    incomeTaxData,
    // Breakdown data (consolidated)
    showBreakdown,
    setShowBreakdown,
    breakdownByBranch,
    // Functions
    fetchStatementData,
    fetchStatementDataWithBreakdown,
    clearBreakdownData,
    printIncomeStatement,
    // Loading states
    loading,
    printLoading,
    breakdownLoading
  } = useFinancialStatement();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(''); // Track selected branch
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);

    // Clear breakdown data when changing branch selection
    if (branch_sub_id !== 'all') {
      setShowBreakdown(false);
      clearBreakdownData();
    }

    fetchStatementData(startDate, endDate, branch_sub_id);
  };

  /**
   * Handle breakdown toggle change.
   * Only available when "All Sub-Branches" is selected.
   */
  const handleBreakdownToggle = (enabled: boolean) => {
    if (!startDate || !endDate) {
      return;
    }

    if (enabled) {
      // Fetch with breakdown data
      fetchStatementDataWithBreakdown(startDate, endDate, enabled);
    } else {
      // Clear breakdown and use regular fetch
      clearBreakdownData();
      setShowBreakdown(false);
      fetchStatementData(startDate, endDate, branchSubId);
    }
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


  // Extract month keys from data using utility function
  const monthKeys = useMemo(() => extractMonthKeys(isInterestIncomeData), [isInterestIncomeData]);

  // Consolidated calculation of all section totals (monthly totals + variance totals)
  const sectionTotals = useMemo(() => {
    return {
      // Monthly totals per section
      intInc: calculateMonthlyTotals(isInterestIncomeData, monthKeys),
      othRevenue: calculateMonthlyTotals(isOtherRevenueData, monthKeys),
      directFin: calculateMonthlyTotals(directFinancingData, monthKeys),
      lessExpense: calculateMonthlyTotals(lessExpenseData, monthKeys),
      othIncExpense: calculateMonthlyTotals(otherIncomeExpenseData, monthKeys),
      incomeTax: calculateMonthlyTotals(incomeTaxData, monthKeys),
      // Variance totals per section
      varianceIntInc: calculateVarianceTotal(isInterestIncomeData),
      varianceOthRev: calculateVarianceTotal(isOtherRevenueData),
      varianceDirectFin: calculateVarianceTotal(directFinancingData),
      varianceOthIncExp: calculateVarianceTotal(otherIncomeExpenseData),
      varianceLessExp: calculateVarianceTotal(lessExpenseData),
      varianceIncTax: calculateVarianceTotal(incomeTaxData),
    };
  }, [isInterestIncomeData, isOtherRevenueData, directFinancingData, lessExpenseData, otherIncomeExpenseData, incomeTaxData, monthKeys]);

  // Auto-fetch data when dates or branch change (if all required fields are populated)
  useEffect(() => {
    if (startDate && endDate && branchSubId) {
      fetchStatementData(startDate, endDate, branchSubId);
    }
    // Note: fetchStatementData is excluded from deps to prevent infinite loops
    // (it's recreated on each render by the hook)
  }, [startDate, endDate, branchSubId]);

  // Computed summary values for display (derived from sectionTotals)
  const computedTotals = useMemo(() => {
    const totalIncome: Record<string, DecimalValue> = {};
    const netIncomeBeforeOther: Record<string, DecimalValue> = {};
    const netIncomeBeforeTax: Record<string, DecimalValue> = {};
    const netIncomeAfterTax: Record<string, DecimalValue> = {};

    monthKeys.forEach((month) => {
      const intInc = sectionTotals.intInc[month] || new Decimal(0);
      const othRev = sectionTotals.othRevenue[month] || new Decimal(0);
      const directFin = sectionTotals.directFin[month] || new Decimal(0);
      const lessExp = sectionTotals.lessExpense[month] || new Decimal(0);
      const othIncExp = sectionTotals.othIncExpense[month] || new Decimal(0);
      const incTax = sectionTotals.incomeTax[month] || new Decimal(0);

      totalIncome[month] = intInc.plus(othRev);
      netIncomeBeforeOther[month] = intInc.plus(othRev).plus(directFin).minus(lessExp);
      netIncomeBeforeTax[month] = intInc.plus(othRev).plus(directFin).minus(lessExp).minus(othIncExp);
      netIncomeAfterTax[month] = intInc.plus(othRev).plus(directFin).minus(lessExp).minus(othIncExp).minus(incTax);
    });

    // Variance computations
    const totalIncomeVariance = sectionTotals.varianceIntInc.plus(sectionTotals.varianceOthRev);
    const netBeforeOtherVariance = sectionTotals.varianceIntInc.plus(sectionTotals.varianceOthRev).plus(sectionTotals.varianceDirectFin).minus(sectionTotals.varianceLessExp);
    const netBeforeTaxVariance = netBeforeOtherVariance.minus(sectionTotals.varianceOthIncExp);
    const netAfterTaxVariance = netBeforeTaxVariance.minus(sectionTotals.varianceIncTax);

    return {
      totalIncome,
      netIncomeBeforeOther,
      netIncomeBeforeTax,
      netIncomeAfterTax,
      totalIncomeVariance,
      netBeforeOtherVariance,
      netBeforeTaxVariance,
      netAfterTaxVariance,
    };
  }, [monthKeys, sectionTotals]);

  const handlePrint = async () => {
    if (!startDate || !endDate || !branchSubId) {
      alert('Please select date range and branch before printing');
      return;
    }
    // Pass showBreakdown state to include sub-branch breakdown in PDF
    await printIncomeStatement(startDate, endDate, branchSubId, showBreakdown);
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

              {/* Sub-Branch Breakdown Toggle - Only shown when "All Sub-Branches" is selected */}
              {branchSubId === 'all' && isInterestIncomeData && (
                <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBreakdown}
                      onChange={(e) => handleBreakdownToggle(e.target.checked)}
                      className="mr-3 h-5 w-5 rounded border-stroke bg-transparent text-primary focus:ring-primary dark:border-strokedark"
                    />
                    <span className="text-sm font-medium text-black dark:text-white">
                      Show Sub-Branch Breakdown
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (View income/expense breakdown by individual sub-branch)
                    </span>
                  </label>
                </div>
              )}
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
              ) : !startDate || !endDate || !branchSubId ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Select Report Filters
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
                    Please select a <strong>start date</strong>, <strong>end date</strong>, and <strong>branch</strong> to generate the income statement report.
                  </p>
                </div>
              ) : (
                <>

              {/* ═══════════ MAIN SECTIONS (AGGREGATED) ═══════════ */}

              {/* Interest Income */}
              <IncomeStatementTable
                data={isInterestIncomeData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.intInc}
                varianceTotal={sectionTotals.varianceIntInc}
                totalLabel="Total Interest Income"
                showHeader={true}
                headerRowBgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-400"
              />

              {/* Other Revenue */}
              <IncomeStatementTable
                data={isOtherRevenueData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.othRevenue}
                varianceTotal={sectionTotals.varianceOthRev}
                totalLabel="Total Other Revenue"
                headerRowBgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                summaryRows={[
                  {
                    label: 'Total Income',
                    monthlyValues: computedTotals.totalIncome,
                    varianceValue: computedTotals.totalIncomeVariance,
                    bgClass: 'bg-primary dark:bg-primary',
                  },
                ]}
              />

              {/* Less Expense */}
              <IncomeStatementTable
                data={lessExpenseData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.lessExpense}
                varianceTotal={sectionTotals.varianceLessExp}
                totalLabel="TOTAL EXPENSE"
                totalRowBgClass="bg-meta-1 dark:bg-meta-1"
                totalRowTextClass="text-white"
                headerRowBgClass="bg-red-50 dark:bg-red-900/20 border-red-400"
              />

              {/* Direct Financing Cost */}
              <IncomeStatementTable
                data={directFinancingData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.directFin}
                varianceTotal={sectionTotals.varianceDirectFin}
                totalLabel="Total Direct Financing"
                headerRowBgClass="bg-orange-50 dark:bg-orange-900/20 border-orange-400"
                summaryRows={[
                  {
                    label: 'NET INCOME BEFORE OTHER INCOME',
                    monthlyValues: computedTotals.netIncomeBeforeOther,
                    varianceValue: computedTotals.netBeforeOtherVariance,
                    bgClass: 'bg-primary dark:bg-primary',
                  },
                ]}
              />

              {/* Other Income/Expense */}
              <IncomeStatementTable
                data={otherIncomeExpenseData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.othIncExpense}
                varianceTotal={sectionTotals.varianceOthIncExp}
                totalLabel="Total"
                headerRowBgClass="bg-purple-50 dark:bg-purple-900/20 border-purple-400"
                summaryRows={[
                  {
                    label: 'NET INCOME BEFORE INCOME TAX',
                    monthlyValues: computedTotals.netIncomeBeforeTax,
                    varianceValue: computedTotals.netBeforeTaxVariance,
                    bgClass: 'bg-primary dark:bg-primary',
                  },
                ]}
              />

              {/* Income Tax */}
              <IncomeStatementTable
                data={incomeTaxData}
                monthKeys={monthKeys}
                monthlyTotals={sectionTotals.incomeTax}
                varianceTotal={sectionTotals.varianceIncTax}
                totalLabel="Total Income Tax"
                headerRowBgClass="bg-green-50 dark:bg-green-900/20 border-green-400"
                summaryRows={[
                  {
                    label: 'NET INCOME AFTER TAX',
                    monthlyValues: computedTotals.netIncomeAfterTax,
                    varianceValue: computedTotals.netAfterTaxVariance,
                    bgClass: 'bg-meta-3 dark:bg-meta-3',
                  },
                ]}
              />

              {/* ═══════════ SUB-BRANCH BREAKDOWN SECTION ═══════════ */}
              {showBreakdown && branchSubId === 'all' && (
                <div className="mt-12 border-t-4 border-blue-400 pt-8">
                  {/* Section Title */}
                  <div className="mb-8 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white">
                      Sub-Branch Breakdown
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Detailed breakdown showing contributions from each sub-branch
                    </p>
                  </div>

                  {/* Loading Spinner for Breakdown */}
                  {breakdownLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <LoadingSpinner message="Loading sub-branch breakdown..." size="md" />
                    </div>
                  ) : (
                    <IncomeStatementBySubBranch
                      interestIncome={breakdownByBranch.interestIncome || []}
                      otherRevenues={breakdownByBranch.otherRevenues || []}
                      directFinancing={breakdownByBranch.directFinancing || []}
                      lessExpense={breakdownByBranch.lessExpense || []}
                      otherIncomeExpense={breakdownByBranch.otherIncomeExpense || []}
                      incomeTax={breakdownByBranch.incomeTax || []}
                      monthKeys={monthKeys}
                    />
                  )}
                </div>
              )}

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