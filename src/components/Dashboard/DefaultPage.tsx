"use client";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import ChartOne from "../Charts/ChartOne";
import ChartThree from "../Charts/ChartThree";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import './styles.css';
import { Package } from "@/types/package";
import { FileText } from "react-feather";
import SummaryTicket from './components/SummaryTicket';
import NetMovements from './components/NetMovements';
import CashoutByBank from './components/CashoutByBank';
import LoanByLoanType from './components/LoanByLoanType';
import useSummaryTicket from '@/hooks/useSummaryTicket';
import useCoa from '@/hooks/useCoa';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const DefaultPage: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const { onSubmitCoa, branchSubData } = useCoa();

  // Use undefined instead of null for initial state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { fetchSummaryTixReport, sumTixLoading, dataSummaryTicket } = useSummaryTicket();

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
  
  const handleBranchSubChange = (branch_sub_id: string) => {
    fetchSummaryTixReport(startDate, endDate, branch_sub_id);
  };

  useEffect(() => {
    console.log(dataSummaryTicket, ' dataSummaryTicket')
  }, [endDate, dataSummaryTicket])

  const [optionsSubBranch, setOptionsSubBranch] = useState<Option[]>([]);

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
    <>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-1 lg:gap-2">

        <div className="rounded-lg bg-gray-200">
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
        
        
        
        {dataSummaryTicket !== undefined ? (
          <>
            {/* {} */}
            <SummaryTicket sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate} />
            {/* {} */}
            <NetMovements sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            {/* {} */}
            <CashoutByBank sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
            {/* {} */}
            <LoanByLoanType sumTixData={dataSummaryTicket} startDate={startDate} endDate={endDate}/>
          </>
        ) : (
          <div className="rounded-sm border my-4 border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
            <div className="mb-6 flex justify-between">
              <div>
                <h5 className="text-title-sm font-bold text-black dark:text-white">
                  Select date for Summary ticket
                </h5>
              </div>
            </div>
          </div>
        )}
      </div>

      
      
      
    </>
  );
};

export default DefaultPage;
