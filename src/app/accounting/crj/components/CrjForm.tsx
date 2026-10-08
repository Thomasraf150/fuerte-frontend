"use client"
import Button from '@/components/Button';
import { CardBody, CardHeader } from '@/components/Card';
import { MIN_BUSINESS_DATE, maxBusinessDate } from '@/constants/dateBounds';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Home, Edit3, ChevronDown, Plus, Trash2 } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import useCoa from '@/hooks/useCoa';
import moment from 'moment';
import { showConfirmationModal } from '@/components/ConfirmationModal';
// import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { RowAcctgEntry, DataSubBranches, RowAcctgDetails, DataChartOfAccountList, RowVendorsData } from '@/utils/DataTypes';
import { formatNumberComma } from '@/utils/helper';
interface ParentFormBr {
  setShowForm: (b: boolean) => void;
  actionLbl: string;
  singleData: RowAcctgEntry | undefined;
  loading: boolean;
  coaDataAccount: DataChartOfAccountList[];
  fetchCoaDataTable: () => void;
}

const CrjForm: React.FC<ParentFormBr> = ({ setShowForm, singleData, actionLbl, loading, coaDataAccount, fetchCoaDataTable }) => {
  const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<RowAcctgEntry>();
  const [rows, setRows] = useState<RowAcctgDetails[]>([{ acctg_entries_id: "", accountLabel: "", acctnumber: "", debit: "", credit: "" }]);
  // const { createGV, fetchGV, loading } = useGeneralVoucher();
  const [ showPayee, setShowPayee ] = useState<boolean>(false);
  const [ dataPayee, setDataPayee ] = useState<RowVendorsData>();

  useEffect(() => {
    fetchCoaDataTable();
    setValue('journal_name', 'Check Voucher');
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
      // Skip inactive accounts from dropdown options
      if (!account.is_active) return;

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
   
  };

  return (
    <>
      <div>
        <CardHeader title={<>{actionLbl} {singleData && (<>- <span className="font-bold text-orange-500"> {singleData?.journal_ref}</span></>)}</>} />
        <CardBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-5">
            <div className='mt-2'>
              <FormInput
                label="Date"
                id="journal_date"
                type="date"
                icon={Edit3}
                // A native date input commits a zero-padded partial year on the first year
                // keystroke (0026-01-15, reported as valid). With min/max the browser blocks
                // the submit before any request. See src/constants/dateBounds.ts.
                min={MIN_BUSINESS_DATE}
                max={maxBusinessDate()}
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
                    value={dataPayee?.name || singleData?.borrower_full_name}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className='md:col-span-3'>
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
          </div>

          <div className="grid grid-cols-1 gap-4 mb-5">
            <div>
              <div className="border-b border-stroke pb-3 mb-4 dark:border-strokedark">
                <h6 className="text-sm font-bold uppercase tracking-wide text-primary dark:text-olive-300">Voucher Details</h6>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-stroke dark:border-strokedark">
                <thead className="bg-gray-2 dark:bg-meta-4">
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
                          className="h-10 w-full rounded-lg border border-field bg-white px-3 text-right text-sm tabular-nums text-black focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-gray-2 disabled:opacity-60 dark:border-field-dark dark:bg-form-input dark:text-white"
                          value={row.debit}
                          onChange={(e) => handleChange(index, "debit", e.target.value, '')}
                        />
                      </td>
                      <td className="p-2 border w-[30%]">
                        <input
                          type="text"
                          className="h-10 w-full rounded-lg border border-field bg-white px-3 text-right text-sm tabular-nums text-black focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:bg-gray-2 disabled:opacity-60 dark:border-field-dark dark:bg-form-input dark:text-white"
                          value={row.credit}
                          onChange={(e) => handleChange(index, "credit", e.target.value, '')}
                        />
                      </td>
                      <td className="p-2 border text-center flex gap-3 justify-center w-[100%]">
                        <Button variant="secondary"
                          type="button"
                          onClick={addRow}>
                          <Plus size={16} /> <span>Add row</span>
                        </Button>
                        {rows.length > 1 && (
                          <Button variant="danger"
                            type="button"
                            onClick={() => removeRow(index)}>
                            <Trash2 size={16} /> <span>Remove</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black bg-gray-2 font-bold dark:border-white dark:bg-meta-4">
                    <th className="p-2 border text-right">TOTAL</th>
                    <th className="p-2 border text-right tabular-nums">{formatNumberComma(Number(calculateTotal("debit")))}</th>
                    <th className="p-2 border text-right tabular-nums">{formatNumberComma(Number(calculateTotal("credit")))}</th>
                    <th className="p-2 border"></th>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-4.5">
            <Button variant="secondary"
              type="button"
              onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
        </CardBody>
      </div>
    </>
  );
};

export default CrjForm;