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
import { rt, indent } from '@/components/ReportTable';

// Total Assets closes the statement, so it gets the double rule; the other totals get a single rule.
const BS_SECTIONS = [
  { title: 'ASSETS', key: 'assets', totalLabel: 'TOTAL ASSETS', totalKey: 'total_assets', rule: 'grand' },
  { title: 'LIABILITIES', key: 'liabilities', totalLabel: 'TOTAL LIABILITIES', totalKey: 'total_liabilities', rule: 'subtotal' },
  { title: 'EQUITY', key: 'equity', totalLabel: 'TOTAL EQUITY', totalKey: 'total_equity', rule: 'subtotal' },
] as const;

/** One account line: parents (level 0) bold, sub-accounts indented 16px per level and regular. */
const AccountRow: React.FC<{ account: any; level: 0 | 1 | 2 }> = ({ account, level }) => {
  const weight = level === 0 ? 'font-semibold' : '';
  return (
    <tr className="hover:bg-whiten dark:hover:bg-meta-4">
      <td className={`${rt.tdPin} ${weight}`} style={indent(level)}>{account.account_name}</td>
      <td className={`${rt.td} text-body dark:text-bodydark`}>{account.number}</td>
      <td className={`${rt.tdNum} ${weight}`}>{formatCurrency(account.balance)}</td>
    </tr>
  );
};

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
              <div className="no-print flex flex-wrap items-end gap-x-3 gap-y-4">
                {/* Every control has its own visible label; "Select Date Range:" heads the two dates. */}
                <div role="group" aria-labelledby="bs-date-range" className="w-full sm:w-auto sm:flex-[2]">
                  <p id="bs-date-range" className="mb-1.5 block text-sm font-semibold text-black dark:text-white">Select Date Range:</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:flex-1">
                      <label htmlFor="bs-start-date" className="mb-1 block text-xs font-medium text-body dark:text-bodydark">Start date</label>
                      <DatePicker
                        id="bs-start-date"
                        selected={startDate}
                        onChange={handleStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Start Date"
                        wrapperClassName="w-full"
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <label htmlFor="bs-end-date" className="mb-1 block text-xs font-medium text-body dark:text-bodydark">End date</label>
                      <DatePicker
                        id="bs-end-date"
                        selected={endDate}
                        onChange={handleEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate} // Prevent selecting an end date before start date
                        placeholderText="End Date"
                        wrapperClassName="w-full"
                        className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-auto sm:flex-1">
                  <span id="bs-group-label" className="mb-1 block text-xs font-medium text-body dark:text-bodydark">Group</span>
                      <Controller
                        name="branch_group_id"
                        control={control}
                        defaultValue="all"
                        render={({ field }) => (
                          <ReactSelect
                            aria-label="Group"
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
                  <span id="bs-branch-label" className="mb-1 block text-xs font-medium text-body dark:text-bodydark">Branch</span>
                      <Controller
                        name="branch_id"
                        control={control}
                        rules={{ required: 'Branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            aria-label="Branch"
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
                  <span id="bs-sub-label" className="mb-1 block text-xs font-medium text-body dark:text-bodydark">Sub-branch</span>
                      <Controller
                        name="branch_sub_id"
                        control={control}
                        rules={{ required: 'Sub Branch is required' }}
                        render={({ field }) => (
                          <ReactSelect
                            aria-label="Sub-branch"
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

              <div className={`${rt.wrap} mt-4`}>
                {loading ? (
                  <SkeletonBlock rows={6} label="Loading balance sheet…" />
                ) : balanceSheetData !== undefined ? (
                  <table className={rt.table}>
                    <thead className={rt.thead}>
                      <tr>
                        <th className={`${rt.thPin} md:min-w-[280px] lg:min-w-[400px]`}>Account Name</th>
                        <th className={rt.th}>Account Number</th>
                        <th className={rt.thNum}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BS_SECTIONS.map(({ title, key, totalLabel, totalKey, rule }) => (
                        <React.Fragment key={key}>
                          <tr>
                            <td colSpan={3} className={rt.groupPin}>{title}</td>
                          </tr>
                          {balanceSheetData?.[key]?.map((item: any) => (
                            <React.Fragment key={item.number}>
                              <AccountRow account={item} level={0} />
                              {item.subAccounts?.map((child: any) => (
                                <React.Fragment key={child.number}>
                                  <AccountRow account={child} level={1} />
                                  {child.subAccounts?.map((grandChild: any) => (
                                    <AccountRow key={grandChild.number} account={grandChild} level={2} />
                                  ))}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))}
                          <tr className={rt[rule]}>
                            <td className={rt.tdPin}>{totalLabel}</td>
                            <td className={rt.td}></td>
                            <td className={rt.tdNum}>{formatCurrency(balanceSheetData[totalKey])}</td>
                          </tr>
                        </React.Fragment>
                      ))}
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