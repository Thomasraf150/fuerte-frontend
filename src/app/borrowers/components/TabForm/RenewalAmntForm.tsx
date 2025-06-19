"use client"
import React, { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Home, ChevronDown } from 'react-feather';
import FormInput from '@/components/FormInput'
import { DataRenewalData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';

interface ParentFormBr {
  renewalIDs: string[] | [];
  dataComputedRenewal: DataRenewalData | undefined;
  setValue: any;
  watch: any;
}

const RenewalAmntForm: React.FC<ParentFormBr> = ({ renewalIDs, dataComputedRenewal, setValue, watch }) => {
  // const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<BorrCoMakerFormValues>();

  const [openRows, setOpenRows] = useState<number[]>([]); // To hold multiple open row indexes

  // Initialize the state to hold the selected values with loan_ref
  const [selectedValues, setSelectedValues] = useState<Array<{ loan_ref: string; loan_schedule_id: string; amount: string; dueDate: string }>>([]);
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

  const handleRadioChange = (loan_ref: string, value: { amount: string; loan_schedule_id: string; dueDate: string }) => {
    setSelectedValues((prevSelected) => {
      return [...prevSelected, { loan_ref, ...value }];
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
    console.log(dataComputedRenewal, ' dataComputedRenewal');
  }, [unifiedSelectedValues, renewalIDs])

  return (

    <div className="max-w-8xl mx-auto pb-4">
      <div className="overflow-x-auto">
        <FormLabel title={`Renewal Details`}/>
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Ref #</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dataComputedRenewal && dataComputedRenewal?.map((v: any, index: number) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{v.loan_ref}</td>
                  <td className="border px-4 py-2">
                    <button
                      type="button"
                      onClick={() => toggleRow(index)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                    >
                      {openRows.includes(index) ? "Collapse" : "Expand"}
                    </button>
                  </td>
                </tr>

                {openRows.includes(index) && (
                  <tr>
                    <td colSpan={4} className="border py-2 bg-gray-50">
                      <div className="p-2">
                        <table className="min-w-full border border-gray-300 text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th>Action</th>
                              <th>Type</th>
                              <th className="text-right">Amount</th>
                              <th className="text-right pr-3">Schedule Date</th>
                            </tr>
                          </thead>
                          <tbody>
                          {v?.loan_schedules?.ua_sp?.map((row: any, idx: number) => (
                            row?.amount > 0 && (
                              <tr key={idx}>
                                <td className="text-center">
                                  <div className="flex justify-center items-center">
                                    <input
                                      name={`ua_sp_ob${row.loan_schedule_id}`}
                                      type="radio"
                                      value={JSON.stringify([row?.amount, row?.due_date])}
                                      checked={selectedValues.some(item => item.loan_ref === v.loan_ref && item.amount === row?.amount && item.dueDate === row?.due_date)}
                                      onChange={() => handleRadioChange(v.loan_ref, { amount: row?.amount, loan_schedule_id: row?.loan_schedule_id, dueDate: row?.due_date })}
                                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                  </div>
                                </td>
                                <td className="text-center">UA/SP</td>
                                <td className="text-right">{row?.amount}</td>
                                <td className="text-right pr-3">{row?.due_date}</td>
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
                              <tr key="ob-total">
                                <td className="text-center">
                                  <div className="flex justify-center items-center">
                                    <input 
                                      type="checkbox"
                                      value={JSON.stringify([fOb, ''])}
                                      onChange={() => handleCheckChangeOb(v.loan_ref, { amount: fOb.toFixed(2), dueDate: '' })}
                                      checked={selectedValuesOb.some(item => item.loan_ref === v.loan_ref && item.amount === fOb.toFixed(2) && item.dueDate === '')}
                                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                  </div>
                                </td>
                                <td className="text-center">OB</td>
                                <td className="text-right">{fOb.toFixed(2)}</td>
                                <td className="text-right pr-3">-</td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center text-gray-500 italic">
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
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Total</th>
              <th className="text-right">
                {(() => {
                  const renewalTotal = unifiedSelectedValues.reduce(
                    (total: number, row: any) => (row?.amount > 0 ? total + parseFloat(row?.amount) : total),
                    0
                  );
                  return renewalTotal.toFixed(2);
                })()}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left"></td>
              <td className="text-right">
                <button type="button" className="bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 focus:outline-none" 
                  onClick={() => 
                    {
                      setSelectedValues([]);
                      setSelectedValuesOb([]);
                    } 
                  }>Reset</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RenewalAmntForm;