"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput'
import { BorrLoanRowData, DataRenewalData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import { formatNumber } from '@/utils/formatNumber';
import LoadingSpinner from '@/components/LoadingStates/LoadingSpinner';
import { formatDate } from '@/utils/formatters';

interface ParentFormBr {
  renewalIDs: string[] | [];
  dataComputedRenewal: DataRenewalData | undefined;
  fnGetRenewalDetails?: (d: any) => void;
  setValue: any;
  watch: any;
  loading?: boolean;
  /** The old loans' own rows from the Loans tab, matched to the renewal rows by loan_ref. */
  oldLoans?: BorrLoanRowData[];
}

/**
 * What the old loan was, under its ref (2026-10-22): staff pick the new product and amount from
 * this, and before it they had to leave the form to look it up.
 */
function OldLoanFacts({ loan }: { loan: BorrLoanRowData }) {
  const term = Number(loan.term);
  const facts: Array<[string, string]> = [
    ['Term', term ? `${term} ${term === 1 ? 'month' : 'months'}` : '-'],
    ['PN', `₱${formatNumber(Number(loan.pn_amount))}`],
    ['Monthly', `₱${formatNumber(Number(loan.monthly))}`],
    ['Released', formatDate(loan.released_date)],
  ];
  return (
    <div className="mt-1 min-w-0">
      <div className="font-medium text-black dark:text-white break-words">
        {loan.loan_product?.description ?? 'Product not recorded'}
      </div>
      <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        {facts.map(([label, value]) => (
          <div key={label} className="flex gap-1">
            <dt className="text-body dark:text-bodydark">{label}</dt>
            <dd className="font-medium tabular-nums text-black dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const RenewalAmntForm: React.FC<ParentFormBr> = ({ renewalIDs, dataComputedRenewal, setValue, watch, loading = false, fnGetRenewalDetails, oldLoans = [] }) => {
  // const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrCoMakerFormValues>();

  const [openRows, setOpenRows] = useState<number[]>([]); // To hold multiple open row indexes

  // Initialize the state to hold the selected values with loan_ref
  const [selectedValues, setSelectedValues] = useState<Array<{ loan_ref: string; loan_schedule_id: string; amount: string; dueDate: string, udi_balance: string, loan_udi_schedule_id: string }>>([]);
  const [selectedValuesOb, setSelectedValuesOb] = useState<Array<{ loan_ref: string; amount: string; dueDate: string }>>([]);

  const toggleRow = (index: number) => {
    setOpenRows(prevState => {
      if (prevState.includes(index)) {
        // Remove index if it's already in the array (i.e., closing it)
        return prevState.filter(rowIndex => rowIndex !== index);
      } else {
        // Add index to the array (i.e., opening it)
        return [...prevState, index];
      }
    });
  };

  const handleRadioChange = (loan_ref: string, value: { amount: string; loan_schedule_id: string; dueDate: string }, udiBalance: any) => {
    setSelectedValues((prevSelected) => {
      const udiSchedule = udiBalance?.loan_schedules?.udi_balance?.find(
        (udi: any) => udi.due_date === value.dueDate
      );
      const udi_balance = udiSchedule ? udiSchedule.amount : "0.00";
      const loan_udi_schedule_id = udiSchedule ? udiSchedule.loan_udi_schedule_id : "";
      return [...prevSelected, { loan_ref, ...value, udi_balance, loan_udi_schedule_id }];
    });
    setSelectedValuesOb((prevSelected) => 
      prevSelected.filter((item) => item.loan_ref !== loan_ref)
    );
  };

  const handleCheckChangeOb = (loan_ref: string, value: { amount: string; dueDate: string }) => {
    setSelectedValuesOb((prevSelected) => {
      const existingIndex = prevSelected.findIndex(
        (item) => item.loan_ref === loan_ref && item.amount === value.amount && item.dueDate === value.dueDate
      );
  
      if (existingIndex >= 0) {
        // If the entry already exists, remove it (uncheck logic)
        return prevSelected.filter((_, index) => index !== existingIndex);
      } else {
        // If the entry does not exist, add it (check logic)
        return [...prevSelected, { loan_ref, ...value }];
      }
    });
    setSelectedValues((prevSelected) => 
      prevSelected.filter((item) => item.loan_ref !== loan_ref)
    );
  };

  // Create a unified array
  const unifiedSelectedValues = useMemo(() => {
    return [
      ...selectedValues,
      ...selectedValuesOb.map((item) => ({
        ...item,
        loan_schedule_id: "", // Add a default value for `loan_schedule_id` if it's missing
      })),
    ];
  }, [selectedValues, selectedValuesOb]);

  // console.log(unifiedSelectedValues);

  useEffect(() => {
    setValue('renewal_details', unifiedSelectedValues);

    // Auto-populate OB field with total from selected renewal items
    const renewalTotal = unifiedSelectedValues.reduce(
      (total: number, row: any) => (row?.amount > 0 ? total + parseFloat(row?.amount) : total),
      0
    );
    setValue('ob', renewalTotal.toFixed(2));

    if (fnGetRenewalDetails) {
      fnGetRenewalDetails(unifiedSelectedValues);
    }
  }, [unifiedSelectedValues, renewalIDs, selectedValues])

  return (

    <div className="max-w-8xl mx-auto pb-4">
      <FormLabel title={`Renewal Details`}/>
      {loading ? (
        <div className="border border-stroke dark:border-strokedark rounded-lg shadow-sm p-12 bg-white dark:bg-meta-4">
          <LoadingSpinner size="lg" message="Loading renewal data..." />
        </div>
      ) : (
        <div className="overflow-x-auto border border-stroke dark:border-strokedark rounded-lg shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-2">
              <tr>
                <th className="border px-4 py-2 text-left">Old loan</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dataComputedRenewal && dataComputedRenewal?.map((v: any, index: number) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray">
                  <td className="border px-4 py-2 align-top">
                    <div className="font-semibold">{v.loan_ref}</div>
                    {(() => {
                      const loan = oldLoans.find((row) => row.loan_ref === v.loan_ref);
                      return loan ? <OldLoanFacts loan={loan} /> : null;
                    })()}
                  </td>
                  <td className="border px-4 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => toggleRow(index)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition min-w-[100px] w-full sm:w-auto"
                    >
                      {openRows.includes(index) ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {openRows.includes(index) && (
                  <tr>
                    <td colSpan={4} className="border py-2 bg-gray">
                      <div className="p-2 overflow-x-auto">
                        <table className="min-w-full border border-stroke dark:border-strokedark text-sm">
                          <thead className="bg-gray-2">
                            <tr>
                              <th className="px-2 py-2 text-center">Action</th>
                              <th className="px-2 py-2 text-center">Type</th>
                              <th className="px-2 py-2 text-right">Amount</th>
                              <th className="px-2 py-2 text-right">Schedule Date</th>
                            </tr>
                          </thead>
                          <tbody>
                          {v?.loan_schedules?.ua_sp?.map((row: any, idx: number) => (
                            row?.amount > 0 && (
                              <tr key={idx} className="hover:bg-gray-2">
                                <td className="text-center px-2 py-2">
                                  <div className="flex justify-center items-center">
                                    <input
                                      name={`ua_sp_ob${row.loan_schedule_id}`}
                                      type="radio"
                                      value={JSON.stringify([row?.amount, row?.due_date])}
                                      checked={selectedValues.some(item => item.loan_ref === v.loan_ref && item.amount === row?.amount && item.dueDate === row?.due_date)}
                                      onChange={() => handleRadioChange(v.loan_ref, { amount: row?.amount, loan_schedule_id: row?.loan_schedule_id, dueDate: row?.due_date }, v)}
                                      className="w-5 h-5 text-blue-600 border-stroke dark:border-strokedark focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                </td>
                                <td className="text-center px-2 py-2">UA/SP</td>
                                <td className="text-right px-2 py-2">{formatNumber(Number(row?.amount))}</td>
                                <td className="text-right px-2 py-2">{row?.due_date}</td>
                              </tr>
                            )
                          ))}
                          {/* OB Total Row */}
                          {(() => {
                            const obSchedules = v?.loan_schedules?.ob || [];
                            const obTotal = obSchedules.reduce(
                              (total: number, row: any) => (row?.amount > 0 ? total + parseFloat(row?.amount) : total),
                              0
                            );

                            if (obSchedules.length === 0) {
                              console.warn("No OB schedules found");
                            }

                            let fOb = ((obTotal * 100) / 100);

                            return obTotal > 0 ? (
                              <tr key="ob-total" className="hover:bg-gray-2">
                                <td className="text-center px-2 py-2">
                                  <div className="flex justify-center items-center">
                                    <input
                                      type="checkbox"
                                      value={JSON.stringify([fOb, ''])}
                                      onChange={() => handleCheckChangeOb(v.loan_ref, { amount: fOb.toFixed(2), dueDate: '' })}
                                      checked={selectedValuesOb.some(item => item.loan_ref === v.loan_ref && item.amount === fOb.toFixed(2) && item.dueDate === '')}
                                      className="w-5 h-5 text-blue-600 border-stroke dark:border-strokedark focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                </td>
                                <td className="text-center px-2 py-2">OB</td>
                                <td className="text-right px-2 py-2">{formatNumber(fOb)}</td>
                                <td className="text-right px-2 py-2">-</td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center text-body italic px-2 py-2">
                                  No OB schedules available
                                </td>
                              </tr>
                            );
                          })()}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 border border-stroke dark:border-strokedark rounded-lg p-3 bg-white dark:bg-meta-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-lg font-semibold">Total</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {(() => {
                const renewalTotal = unifiedSelectedValues.reduce(
                  (total: number, row: any) => (row?.amount > 0 ? total + parseFloat(row?.amount) : total),
                  0
                );
                return formatNumber(renewalTotal);
              })()}
            </div>
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition w-full sm:w-auto"
              onClick={() => {
                setSelectedValues([]);
                setSelectedValuesOb([]);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalAmntForm;