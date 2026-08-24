"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import ReactSelect from '@/components/ReactSelect';
import useBranches from '@/hooks/useBranches';
import { buildSelectOptions } from '@/utils/buildSelectOptions';

export interface VoucherFiltersValue {
  startDate: string;
  endDate: string;
  branch_id: string;
  branch_sub_id: string;
}

interface VoucherFiltersFormData {
  branch_group_id: string;
  branch_id: string;
  branch_sub_id: string;
}

interface VoucherFiltersProps {
  onChange: (value: VoucherFiltersValue) => void;
}

const normalize = (val: string) => (val && val !== 'all' ? val : '');

const VoucherFilters: React.FC<VoucherFiltersProps> = ({ onChange }) => {
  const {
    dataBranch,
    dataBranchGroup,
    dataBranchSub,
    fetchDataList,
    fetchBranchGroupList,
    fetchSubDataList,
    loadingBranches,
    loadingBranchGroups,
    loadingSubBranches,
  } = useBranches();
  const { control, setValue } = useForm<VoucherFiltersFormData>();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchGroupId, setBranchGroupId] = useState<string>('all'); // FA/FB/FC/FD, or 'all'
  const [branchId, setBranchId] = useState<string>('');
  const [branchSubId, setBranchSubId] = useState<string>('');

  const optionsGroup = useMemo(
    () => buildSelectOptions(dataBranchGroup, { placeholderLabel: 'Select a Group', allLabel: 'All Groups' }),
    [dataBranchGroup]
  );
  const optionsBranch = useMemo(
    () => buildSelectOptions(dataBranch, {
      placeholderLabel: 'Select a Branch',
      // "All Main Branches" spans every group, so it only makes sense while no
      // single group is narrowing the list below it.
      allLabel: branchGroupId === 'all' ? 'All Main Branches' : undefined,
    }),
    [dataBranch, branchGroupId]
  );
  const optionsSubBranch = useMemo(
    () => buildSelectOptions(dataBranchSub, { placeholderLabel: 'Select a Sub Branch', allLabel: 'All Sub-Branches' }),
    [dataBranchSub]
  );

  // The four groups are static — fetch once per screen.
  useEffect(() => {
    fetchBranchGroupList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent whenever any filter value changes. "all"/empty become empty
  // strings so the backend treats them as "no filter" (BranchAccessService still
  // enforces what the user can actually see).
  useEffect(() => {
    onChange({
      startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : '',
      endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : '',
      branch_id: normalize(branchId),
      branch_sub_id: normalize(branchSubId),
    });
  }, [startDate, endDate, branchId, branchSubId, onChange]);

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      if (endDate && date > endDate) setEndDate(undefined);
    } else {
      setStartDate(undefined);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date || undefined);
  };

  /**
   * Group (FA/FB/FC/FD) only narrows which branches are offered below — it is
   * never sent to the backend and never filters vouchers by itself. Picking a
   * group therefore clears the branch/sub-branch selection rather than leaving
   * a branch from another group silently applied.
   */
  const handleGroupChange = (branch_group_id: string) => {
    // react-select still fires onChange when the already-selected option is
    // re-picked; bailing keeps that from wiping a branch the user just chose.
    if (branch_group_id === branchGroupId) return;
    setBranchGroupId(branch_group_id);
    setValue('branch_id', '');
    setValue('branch_sub_id', '');
    setBranchId('');
    setBranchSubId('');
    fetchDataList('name_asc', branch_group_id === 'all' ? undefined : Number(branch_group_id));
  };

  const handleBranchChange = (branch_id: string) => {
    setBranchId(branch_id);
    if (branch_id === 'all' || branch_id === '') {
      setValue('branch_sub_id', 'all');
      setBranchSubId('all');
    } else {
      setValue('branch_sub_id', '');
      setBranchSubId('');
      fetchSubDataList('name_asc', Number(branch_id));
    }
  };

  const handleBranchSubChange = (branch_sub_id: string) => {
    setBranchSubId(branch_sub_id);
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setBranchId('');
    setBranchSubId('');
    setValue('branch_id', '');
    setValue('branch_sub_id', '');
    // Only touch the group when it is actually narrowing something, so a Clear
    // with no group picked costs no extra branch fetch.
    if (branchGroupId !== 'all') {
      setBranchGroupId('all');
      setValue('branch_group_id', 'all');
      fetchDataList('name_asc');
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark flex justify-between items-center">
        <h3 className="font-medium text-black dark:text-white">Filters</h3>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-primary hover:underline"
        >
          Clear
        </button>
      </div>
      <div className="p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Group — narrows the Branch list below; not a filter of its own */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-black dark:text-white">Group</label>
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
                  onChange={(selectedOption: any) => {
                    field.onChange(selectedOption?.value);
                    handleGroupChange(selectedOption?.value ?? 'all');
                  }}
                  value={optionsGroup.find(option => String(option.value) === String(field.value)) || null}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{ menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) }}
                />
              )}
            />
          </div>

          {/* Branch */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-black dark:text-white">Branch</label>
            <Controller
              name="branch_id"
              control={control}
              render={({ field }) => (
                <ReactSelect
                  {...field}
                  options={optionsBranch}
                  placeholder="Select a branch..."
                  isLoading={loadingBranches}
                  loadingMessage={() => 'Loading branches...'}
                  onChange={(selectedOption: any) => {
                    field.onChange(selectedOption?.value);
                    handleBranchChange(selectedOption?.value ?? '');
                  }}
                  value={optionsBranch.find(option => String(option.value) === String(field.value)) || null}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{ menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) }}
                />
              )}
            />
          </div>

          {/* Sub Branch */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium text-black dark:text-white">Sub Branch</label>
            <Controller
              name="branch_sub_id"
              control={control}
              render={({ field }) => (
                <ReactSelect
                  {...field}
                  options={optionsSubBranch}
                  placeholder="Select a sub branch..."
                  isDisabled={branchId === 'all' || branchId === ''}
                  isLoading={loadingSubBranches}
                  loadingMessage={() => 'Loading sub-branches...'}
                  onChange={(selectedOption: any) => {
                    field.onChange(selectedOption?.value);
                    handleBranchSubChange(selectedOption?.value ?? '');
                  }}
                  value={optionsSubBranch.find(option => String(option.value) === String(field.value)) || null}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={{
                    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                    control: (base: any, state: any) => ({
                      ...base,
                      cursor: state.isDisabled ? 'not-allowed' : 'default',
                      opacity: state.isDisabled ? 0.6 : 1,
                      backgroundColor: state.isDisabled ? '#f3f4f6' : base.backgroundColor,
                    }),
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherFilters;
