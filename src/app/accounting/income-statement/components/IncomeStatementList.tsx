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
// import useCoa from '@/hooks/useCoa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import moment from 'moment';
import useBranches from '@/hooks/useBranches';
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const IncomeStatementList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  // const { onSubmitCoa, branchSubData } = useCoa();
  const { dataBranch, dataBranchSub, fetchSubDataList } = useBranches();

  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { isInterestIncomeData, isOtherRevenueData, directFinancingData, otherIncomeExpenseData, lessExpenseData, incomeTaxData, fetchStatementData } = useFinancialStatement();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [branchSubId, setBranchSubId] = useState<string>('');
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

  const tableRef = React.useRef<HTMLDivElement>(null);

  const handlePrintPDF = async () => {
    if (!tableRef.current) return;
  
    const canvas = await html2canvas(tableRef.current, {
      scale: 2,
      useCORS: true,
    });
  
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();  // ~210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm
    const imgProps = pdf.getImageProperties(imgData);

    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('IncomeStatement.pdf');
      // Remove class after export
  };

  const handleBranchChange = (branch_id: string) => {
    // fetchSummaryTixReport(startDate, endDate, branch_id);
    // setBranchSubId(branch_id);
    fetchSubDataList('id_desc', Number(branch_id));
  };

  return (
    <div>
      <div className="max-w-12xl">
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2`}>
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2 ">
             
            <div className="rounded-lg bg-gray-200 p-5">
              <div className="mb-2 font-medium">Select Date Range:</div>
              <div className="flex flex-wrap gap-4">
                {/* Start Date */}
                <div className="flex flex-col ">
                  <label className="mb-1 text-sm font-medium text-gray-700">Start Date:</label>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Start Date"
                    className="border rounded px-4 py-2 w-60"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col ">
                  <label className="mb-1 text-sm font-medium text-gray-700">End Date:</label>
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="End Date"
                    className="border rounded px-4 py-2 w-60"
                  />
                </div>

                {/* Branch Select */}
                <div className="flex flex-col min-w-[200px]">
                  <label className="mb-1 text-sm font-medium text-gray-700">Branch:</label>
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
                  <label className="mb-1 text-sm font-medium text-gray-700">Sub Branch:</label>
                  <Controller
                    name="branch_sub_id"
                    control={control}
                    rules={{ required: 'Sub Branch is required' }}
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
              </div>

              <div className="flex justify-end px-7 py-2">
                {/* Uncomment if you want the button */}
                {/* <button
                  onClick={handlePrintPDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Print as PDF
                </button> */}
              </div>
            </div>


              <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                <h3 className="font-medium text-boxdark dark:text-boxdark">
                  Income Statement
                </h3>
              </div>
              <div className="overflow-x-auto shadow-md sm:rounded-lg p-5 overflow-y-auto min-h-[1000px] h-[1600px]" ref={tableRef}>
              
              
              {/** 
               * Interest Income
              */}
              <table className="table-auto border border-gray-300 w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}>Account Name</th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {moment(month, 'YYYY-MM').format('MMMM YYYY')}
                      </th>
                    ))}
                    <th className="border text-right">Variance</th>
                  </tr>
                </thead>
                {isInterestIncomeData && isInterestIncomeData.length > 0 ? (
                  <>
                    <tbody>
                      {isInterestIncomeData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">Total Interest Income</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {totalsIntInc[month].toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {totalVarianceIntInc.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
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
              <table className="table-auto border border-gray-300 w-full text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}></th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {/* {month} */}
                      </th>
                    ))}
                    <th className="border text-right"></th>
                  </tr>
                </thead>
                {isOtherRevenueData && isOtherRevenueData.length > 0 ? (
                  <>
                    <tbody>
                      {isOtherRevenueData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">Total Other Revenue</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {totalsOthRevenue[month].toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {totalVarianceOthRev.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">Total Income</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {(totalsIntInc[month] + totalsOthRevenue[month]).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {(totalVarianceIntInc + totalVarianceOthRev).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
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
              <table className="table-auto border border-gray-300 w-full text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}></th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {/* {month} */}
                      </th>
                    ))}
                    <th className="border text-right"></th>
                  </tr>
                </thead>
                {lessExpenseData && lessExpenseData.length > 0 ? (
                  <>
                    <tbody>
                      {lessExpenseData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">TOTAL EXPENSE</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {(totalsLessExpense[month]).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {(totalVarianceLessExp).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
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
              <table className="table-auto border border-gray-300 w-full text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}></th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {/* {month} */}
                      </th>
                    ))}
                    <th className="border text-right"></th>
                  </tr>
                </thead>
                {directFinancingData && directFinancingData.length > 0 ? (
                  <>
                    <tbody>
                      {directFinancingData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">NET INCOME BEFORE OTHER INCOME</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {Math.abs((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month]).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {Math.abs((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
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
              <table className="table-auto border border-gray-300 w-full text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}></th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {/* {month} */}
                      </th>
                    ))}
                    <th className="border text-right"></th>
                  </tr>
                </thead>
                {otherIncomeExpenseData && otherIncomeExpenseData.length > 0 ? (
                  <>
                    <tbody>
                      {otherIncomeExpenseData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">Total</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {(totalsOthIncExpense[month]).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {(totalVarianceOthIncExp).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">NET INCOME BEFORE INCOME TAX</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {Math.abs((((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month]) - totalsOthIncExpense[month])).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {Math.abs((((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp) - totalVarianceOthIncExp)).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
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
              <table className="table-auto border border-gray-300 w-full text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border text-left" style={{"width": "430px"}}></th>
                    {monthKeys.map((month: any) => (
                      <th key={month} className="border text-right" style={{"width": "140px"}}>
                        {/* {month} */}
                      </th>
                    ))}
                    <th className="border text-right"></th>
                  </tr>
                </thead>
                {incomeTaxData && incomeTaxData.length > 0 ? (
                  <>
                    <tbody>
                      {incomeTaxData.map((row: any, index: number) => (
                        <tr key={index}>
                          <td className="border">{row.AccountName}</td>
                          {monthKeys.map((month) => (
                            <td key={month} className="border text-right">
                              {row[month] ?? "-"}
                            </td>
                          ))}
                          <td className="border text-right">{row.variance}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">NET INCOME AFTER TAX</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {Math.abs(((((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - totalsLessExpense[month]) - totalsOthIncExpense[month]) - totalsincomeTax[month])).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {Math.abs((((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - totalVarianceLessExp) - totalVarianceOthIncExp) - totalVarianceIncTax).toFixed(2)}
                        </td>
                      </tr>
                      {/* <tr className="bg-gray-100 font-bold">
                        <td className="border text-left">NET INCOME BEFORE INCOME TAX</td>
                        {monthKeys.map((month) => (
                          <td key={month} className="border text-right">
                            {((totalsIntInc[month] + totalsOthRevenue[month] + totalsDirectFin[month]) - (totalsLessExpense[month]) - (totalsOthIncExpense[month])).toFixed(2)}
                          </td>
                        ))}
                        <td className="border text-right">
                          {((totalVarianceIntInc + totalVarianceOthRev + totalVarianceDirectFin) - (totalVarianceLessExp) - (totalVarianceOthIncExp)).toFixed(2)}
                        </td>
                      </tr> */}
                    </tfoot>
                  </>
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan={monthKeys.length + 2} className="p-4 text-center">
                        No data available
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>
              {/** 
               * Other Income Expense end
              */}

              

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IncomeStatementList;