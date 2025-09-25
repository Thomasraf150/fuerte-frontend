"use client"
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Plus, Trash2, Save, RotateCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import PayeeView from './PayeeView';
import useCoa from '@/hooks/useCoa';
import moment from 'moment';
import { showConfirmationModal } from '@/components/ConfirmationModal';
// import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { RowAcctgEntry, DataSubBranches, RowAcctgDetails, DataChartOfAccountList, RowVendorsData } from '@/utils/DataTypes';
interface ParentFormBr {
  setShowForm: (b: boolean) => void;
  actionLbl: string;
  singleData: RowAcctgEntry | undefined;
  createAe: (row: RowAcctgEntry) => Promise<{success: boolean, error?: string, data?: any}>;
  fetchAe: (a: string, b: string, c: string) => void;
  loading: boolean;
  adjustingEntriesLoading: boolean;
}

const AEForm: React.FC<ParentFormBr> = ({ 
      setShowForm, 
      singleData, 
      actionLbl, 
      createAe,
      fetchAe,
      loading,
      adjustingEntriesLoading 
    }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowAcctgEntry>();
  const [rows, setRows] = useState<RowAcctgDetails[]>([{ acctg_entries_id: "", accountLabel: "", acctnumber: "", debit: "", credit: "" }]);
  const { coaDataAccount, fetchCoaDataTable } = useCoa();
  // const { createGV, fetchGV, loading } = useGeneralVoucher();
  const [ showPayee, setShowPayee ] = useState<boolean>(false);
  const [ dataPayee, setDataPayee ] = useState<RowVendorsData>();

  useEffect(() => {
    fetchCoaDataTable();
    setValue('journal_name', 'Journal Voucher');
    if (singleData !== undefined) {
      setValue('id', singleData?.id ?? '');
      setValue('vendor_id', singleData?.vendor_id ?? '');
      setValue('acctg_details', singleData?.acctg_details ?? '');
      setValue('journal_date', moment(singleData?.journal_date).format('YYYY-MM-DD') ?? '');
      setValue('check_no', singleData?.check_no ?? '');
      setValue('journal_desc', singleData?.journal_desc ?? '');
      setRows(singleData?.acctg_details);
      setDataPayee(singleData?.vendor);
    }
  }, [singleData]);

  useEffect(() => {
    setValue('vendor_id', dataPayee?.id ?? '');
  }, [dataPayee]);

  const flattenAccountsToOptions = (
    accounts: DataChartOfAccountList[],
    level: number = 1
  ): { label: string; value: string }[] => {
    // Initialize an empty array for options
    let options: { label: string; value: string }[] = [];
  
    accounts.forEach((account) => {
      // Add the current account with indentation based on level
      options.push({
        label: `${'—'.repeat(level - 1)} ${account.account_name}`,
        value: account?.number?.toString(),
      });
  
      // Recursively process sub-accounts
      if (account.subAccounts) {
        options = options.concat(flattenAccountsToOptions(account.subAccounts, level + 1));
      }
    });
  
    return options;
  };

  // Add the default empty option only once at the top
  const getAccountOptions = (accounts: DataChartOfAccountList[]): { label: string; value: string }[] => {
    const flattenedOptions = flattenAccountsToOptions(accounts);
    return [{ label: "Select a Parent account", value: "" }, ...flattenedOptions];
  };
  
  const optionsCoaData = getAccountOptions(coaDataAccount ?? []);

  const addRow = () => {
    setRows([...rows, { acctg_entries_id: "", accountLabel: "", acctnumber: "", debit: "", credit: "" }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof RowAcctgDetails, value: string, label: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    newRows[index].accountLabel = label;
    if (singleData !== undefined) {
      newRows[index].acctg_entries_id = String(singleData?.id);
    }
    setRows(newRows);
  };

  const calculateTotal = (field: "debit" | "credit") =>
    rows.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0).toFixed(2);


  useEffect(() => {
    setValue('acctg_details', rows);
  }, [rows])

  const onSubmit: SubmitHandler<RowAcctgEntry> = async (data) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      const result = await createAe(data);
      if (result.success) {
        fetchAe("","","");
        setShowForm(false);
      }
    }
  };

  const handleCancelEntry = async (data: RowAcctgEntry) => {
    console.log(data, ' RowAcctgEntry');
    const isConfirmed = await showConfirmationModal(
      '<p style="line-height: 1.4"> Are you sure you want  to cancel this entry? </p>',
      'You won\'t be able to revert this!',
      'Yes it is!',
    );
    if (isConfirmed) {
      // createGV(data);
      // if (!loading) {
      //   fetchGV("","","");
      // }
    }
  }

  return (
    <>
      {showPayee && (
        <PayeeView setShowPayee={setShowPayee} setDataPayee={setDataPayee} />
      )}
      <div>
        <div className="border-b border-stroke py-4 dark:border-strokedark">
          <h3 className="font-medium text-boxdark dark:text-boxdark">
            {actionLbl} {singleData && (<>- <span className="font-bold text-orange-500"> {singleData?.journal_ref}</span></>)} 
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className='mt-2'>
              <FormInput
                label="Date"
                id="journal_date"
                type="date"
                icon={Edit3}
                register={register('journal_date', { required: true })}
                error={errors.journal_date && "Date is required"}
              /> 
            </div>

            <div>
              <FormInput
                label="Check #"
                id="check_no"
                type="text"
                icon={Edit3}
                register={register('check_no')}
                error={errors.check_no && "something went wrong"}
                className='mt-2'
              />
            </div>

            <div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <FormInput
                    label="Payee"
                    id="vendor_id"
                    type="text"
                    icon={Edit3}
                    error={errors.vendor_id && "journal desc is required"}
                    className='mt-2'
                    value={dataPayee?.name}
                    readOnly
                  />
                </div>
                <div>
                  <button
                    className="flex justify-center mt-10 bg-orange-300 rounded border border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-strokedark dark:text-white"
                    type="button"
                    onClick={ () => { setShowPayee(true); } }
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
            <div>
              <FormInput
                label="Particulars"
                id="journal_desc"
                type="text"
                icon={Edit3}
                register={register('journal_desc', { required: true })}
                error={errors.journal_desc && "journal_desc is required"}
                className='mt-2'
              />
            </div>
            <div>
              <FormInput
                label="Reference #."
                id="reference_no"
                type="text"
                icon={Edit3}
                register={register('reference_no', { required: true })}
                error={errors.journal_desc && "journal_desc is required"}
                className='mt-2'
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-5">
            <div>
              <div className="border-b pb-2 mb-4">
                <h6 className="text-lg font-bold">Voucher Details</h6>
              </div>
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="text-left">
                    <th className="p-2 border">Account Title</th>
                    <th className="p-2 border text-right">Debit</th>
                    <th className="p-2 border text-right">Credit</th>
                    <th className="p-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border">
                      <td className="p-2 border w-[30%]">
                        <Controller
                          control={control}
                          name={`acctg_details.${index}.acctnumber`} // Registering field dynamically
                          render={({ field }) => {
                            return (
                              <ReactSelect
                                {...field}
                                options={optionsCoaData}
                                onChange={(selectedOption) => {
                                  handleChange(index, 'acctnumber', selectedOption?.value || '', selectedOption?.label || '');
                                  field.onChange(selectedOption?.value || '');
                                }}
                                value={field.value ? optionsCoaData.find(opt => opt.value === field.value) || null : null}
                                placeholder="Select Account"
                              />
                            );
                          }}
                        />
                      </td>
                      <td className="p-2 border w-[30%]">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-right"
                          value={row.debit}
                          onChange={(e) => handleChange(index, "debit", e.target.value, '')}
                        />
                      </td>
                      <td className="p-2 border w-[30%]">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-right"
                          value={row.credit}
                          onChange={(e) => handleChange(index, "credit", e.target.value, '')}
                        />
                      </td>
                      <td className="p-2 border text-center flex gap-3 justify-center w-[100%]">
                        <button
                          type="button"
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={addRow}
                        >
                          <Plus size={16} />
                        </button>
                        {rows.length > 1 && (
                          <button
                            type="button"
                            className="p-2 bg-red-500 text-black rounded hover:bg-red-600"
                            onClick={() => removeRow(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-gray-50">
                    <th className="p-2 border text-right">TOTAL</th>
                    <th className="p-2 border text-right">{calculateTotal("debit")}</th>
                    <th className="p-2 border text-right">{calculateTotal("credit")}</th>
                    <th className="p-2 border"></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4.5">
            <button
              className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 text-sm dark:border-strokedark dark:text-white"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Back
            </button>
            {/* {singleData !== undefined && (
              <button
                className="flex justify-center rounded border bg-danger border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-rose-400 dark:text-white"
                type="button"
                onClick={() => { return handleCancelEntry(singleData); }}
              >
                Cancel Entry
              </button>
            )} */}
            {singleData === undefined && (
              <button
                className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 text-sm ${adjustingEntriesLoading ? 'opacity-70' : ''}`}
                type="submit"
                disabled={adjustingEntriesLoading}
              >
                {adjustingEntriesLoading ? (
                  <>
                    <RotateCw size={17} className="animate-spin mr-1" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={17} className="mr-1" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default AEForm;