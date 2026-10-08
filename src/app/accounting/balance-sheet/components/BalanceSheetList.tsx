"use client";

import { SkeletonBlock } from '@/components/LoadingStates';
import React, { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/Card';
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
  const { dataBranch, dataBranchGroup, dataBranchSub, fetchDataList, fetchBranchGroupList, fetchSubDataList, loadingBranches, loadingBranchGroups, loadingSubBranches } = useBranches();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>(''); // Track selected branch
  const [branchGroupId, setBranchGroupId] = useState<string>('all'); // FA/FB/FC/FD, or 'all'
  const [optionsBranch, setOptionsBranch] = useState<Option[]>([]);
  const [optionsGroup, setOptionsGroup] = useState<Option[]>([]);
  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

  const { balanceSheetData, fetchBalanceSheetData, loading } = useFinancialStatement();
  
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
  };

  // Refetch when the date range changes IF a (sub-)branch scope is already
  // chosen. Previously the date pickers only mutated state — the report kept
  // showing figures for the OLD range while the pickers displayed the new one.
  useEffect(() => {
    if (branchSubId) {
      fetchBalanceSheetData(startDate, endDate, branchSubId, branchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleShowForm = (lbl: string, showFrm: boolean) => {
    setShowForm(showFrm);
    setActionLbl(lbl);
  }

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
    // Pass the selected main branch so "All Sub-Branches" scopes to that
    // branch's sub-branches (previously it leaked company-wide figures).
    fetchBalanceSheetData(startDate, endDate, branch_sub_id, branchId);
  };

  useEffect(()=>{
    if (dataBranch && Array.isArray(dataBranch)) {
      const dynaOpt: Option[] = dataBranch?.map(b => ({
        value: String(b.id),
        label: b.name, // assuming `name` is the key you want to use as label
      }));
      setOptionsBranch([
        { value: '', label: 'Select a Branch', hidden: true }, // retain the default "Select a branch" option
        // "All Main Branches" spans every group, so it only makes sense while no
        // single group is selected — the report cannot aggregate one group.
        ...(branchGroupId === 'all' ? [{ value: 'all', label: 'All Main Branches' }] : []),
        ...dynaOpt,
      ]);
    }
  }, [dataBranch, branchGroupId])

  // The four groups are static data — fetch them once when the screen mounts.
  useEffect(() => {
    fetchBranchGroupList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(()=>{
    if (dataBranchGroup && Array.isArray(dataBranchGroup)) {
      setOptionsGroup([
        { value: 'all', label: 'All Groups' },
        ...dataBranchGroup.map(g => ({ value: String(g.id), label: g.name })),
      ]);
    }
  }, [dataBranchGroup])

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

  /**
   * Group (FA/FB/FC/FD) only narrows which branches are offered below — it
   * never changes what the report aggregates. Picking a group therefore clears
   * the branch/sub-branch selection rather than silently leaving the report on
   * a branch from another group.
   */
  const handleGroupChange = (branch_group_id: string) => {
    setBranchGroupId(branch_group_id);
    setValue('branch_id', '');
    setValue('branch_sub_id', '');
    setBranchId('');
    setBranchSubId('');
    fetchDataList('name_asc', branch_group_id === 'all' ? undefined : Number(branch_group_id));
  };

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
        fetchSubDataList('name_asc', Number(branch_id));
      }
    }
  };

  return (
    <div>
      <Card>
        {/* One card on the page, so no card title: it would only repeat the page title (Decision 3). */}
        <CardBody>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Select Date Range:</label>
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <div className="w-full sm:w-auto sm:flex-1">
                    <DatePicker
                      selected={startDate}
                      onChange={handleStartDateChange}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      placeholderText="Start Date"
                      className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
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
                      className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                    />
                  </div>
                  {/* Group Select — FA/FB/FC/FD; narrows the Branch list beside it */}
                  <div className="w-full sm:w-auto sm:flex-1">
                    <Controller
                      name="branch_group_id"
                      control={control}
                      defaultValue="all"
                      render={({ field }) => (
                        <ReactSelect
                          {...field}
                          options={optionsGroup}
                          placeholder="Select a group..."
                          isLoading={loadingBranchGroups}
                          loadingMessage={() => 'Loading groups...'}
                          onChange={(selectedOption) => {
                            field.onChange(selectedOption?.value);
                            handleGroupChange(selectedOption?.value ?? 'all');
                          }}
                          value={optionsGroup.find(option => String(option.value) === String(field.value)) || null}
                        />
                      )}
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

              <div className="overflow-x-auto">
                {loading ? (
                  <SkeletonBlock rows={6} label="Loading balance sheet…" />
                ) : balanceSheetData !== undefined ? (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-2 dark:bg-meta-4 border-b-2 border-stroke dark:border-strokedark">
                        <th className="px-6 py-4 text-left font-bold text-black dark:text-white md:min-w-[280px] lg:min-w-[400px]">Account Name</th>
                        <th className="px-6 py-4 text-right font-bold text-black dark:text-white">Account Number</th>
                        <th className="px-6 py-4 text-right font-bold text-black dark:text-white">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Assets Section */}
                      <tr className="bg-sky-50 dark:bg-sky-900/20 border-t-2 border-sky-200 dark:border-sky-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-sky-900 dark:text-sky-300">
                          ASSETS
                        </td>
                      </tr>
                      {balanceSheetData?.assets?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-black dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-black dark:text-white">{item.number}</td>
                            <td className="px-6 py-3 text-right tabular-nums font-semibold text-black dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-black dark:text-white">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{child.number}</td>
                                <td className="px-6 py-2 text-right tabular-nums text-black dark:text-white">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-black dark:text-white">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right tabular-nums text-sm text-black dark:text-white">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-sky-100 dark:bg-sky-900/30 border-t-2 border-sky-300 dark:border-sky-700">
                        <td className="px-6 py-3 font-bold text-sky-900 dark:text-sky-300">TOTAL ASSETS</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right tabular-nums font-bold text-lg text-sky-900 dark:text-sky-300">{formatCurrency(balanceSheetData.total_assets)}</td>
                      </tr>

                      {/* Liabilities Section */}
                      <tr className="bg-orange-50 dark:bg-orange-900/20 border-t-2 border-orange-200 dark:border-orange-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-orange-900 dark:text-orange-300">
                          LIABILITIES
                        </td>
                      </tr>
                      {balanceSheetData?.liabilities?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-black dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-black dark:text-white">{item.number}</td>
                            <td className="px-6 py-3 text-right tabular-nums font-semibold text-black dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-black dark:text-white">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{child.number}</td>
                                <td className="px-6 py-2 text-right tabular-nums text-black dark:text-white">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-black dark:text-white">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right tabular-nums text-sm text-black dark:text-white">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-orange-100 dark:bg-orange-900/30 border-t-2 border-orange-300 dark:border-orange-700">
                        <td className="px-6 py-3 font-bold text-orange-900 dark:text-orange-300">TOTAL LIABILITIES</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right tabular-nums font-bold text-lg text-orange-900 dark:text-orange-300">{formatCurrency(balanceSheetData.total_liabilities)}</td>
                      </tr>

                      {/* Equity Section */}
                      <tr className="bg-green-50 dark:bg-green-900/20 border-t-2 border-green-200 dark:border-green-800">
                        <td colSpan={3} className="px-6 py-3 font-bold text-lg text-green-900 dark:text-green-300">
                          EQUITY
                        </td>
                      </tr>
                      {balanceSheetData?.equity?.map((item: any) => (
                        <React.Fragment key={item.number}>
                          <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                            <td className="px-6 py-3 font-semibold text-black dark:text-white">{item.account_name}</td>
                            <td className="px-6 py-3 text-right text-black dark:text-white">{item.number}</td>
                            <td className="px-6 py-3 text-right tabular-nums font-semibold text-black dark:text-white">{formatCurrency(item.balance)}</td>
                          </tr>
                          {item.subAccounts?.map((child: any) => (
                            <React.Fragment key={child.number}>
                              <tr className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                <td className="px-6 py-2 pl-12 text-black dark:text-white">{child.account_name}</td>
                                <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{child.number}</td>
                                <td className="px-6 py-2 text-right tabular-nums text-black dark:text-white">{formatCurrency(child.balance)}</td>
                              </tr>
                              {child.subAccounts?.map((grandChild: any) => (
                                <tr key={grandChild.number} className="border-b border-stroke dark:border-strokedark hover:bg-gray-3 dark:hover:bg-meta-4">
                                  <td className="px-6 py-2 pl-20 text-sm text-black dark:text-white">{grandChild.account_name}</td>
                                  <td className="px-6 py-2 text-right text-sm text-body dark:text-bodydark">{grandChild.number}</td>
                                  <td className="px-6 py-2 text-right tabular-nums text-sm text-black dark:text-white">{formatCurrency(grandChild.balance)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-green-100 dark:bg-green-900/30 border-t-2 border-green-300 dark:border-green-700">
                        <td className="px-6 py-3 font-bold text-green-900 dark:text-green-300">TOTAL EQUITY</td>
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3 text-right tabular-nums font-bold text-lg text-green-900 dark:text-green-300">{formatCurrency(balanceSheetData.total_equity)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-body dark:text-bodydark py-8">No balance sheet data available. Please select a date range and branch.</p>
                )}
              </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default BalanceSheetList;