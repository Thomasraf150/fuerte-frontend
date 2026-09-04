"use client"
import { MIN_BUSINESS_DATE, maxBusinessDate } from '@/constants/dateBounds';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Printer, Edit3, ChevronDown, Plus, Trash2, Save, RotateCw } from 'react-feather';
import ReactSelect from '@/components/ReactSelect';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import PayeeView from './PayeeView';
import PayeeSelect from '@/components/PayeeSelect';
import usePayee from '@/hooks/usePayee';
import useCoa from '@/hooks/useCoa';
import moment from 'moment';
import { showConfirmationModal } from '@/components/ConfirmationModal';
// import useGeneralVoucher from '@/hooks/useGeneralVoucher';
import { RowAcctgEntry, DataSubBranches, RowAcctgDetails, DataChartOfAccountList, RowVendorsData, SelectOption } from '@/utils/DataTypes';
import { toast } from 'react-toastify';
import {
  parseFinancialAmount,
  addAmounts,
  validateDoubleEntry,
  formatWithThousandsSeparator,
  isValidFinancialInput,
  CURRENCY_PRECISION
} from '@/utils/financial';
interface ParentFormBr {
  setShowForm: (b: boolean) => void;
  actionLbl: string;
  singleData: RowAcctgEntry | undefined;
  createGV: (row: RowAcctgEntry) => Promise<{success: boolean, error?: string, data?: any}>;
  updateGV: (row: RowAcctgEntry, jd: string) => Promise<{success: boolean, error?: string, data?: any}>;
  fetchGV: (a: string, b: string, c: string) => void;
  printSummaryTicketDetails: (a: string) => void;
  printLoading: boolean;
  loading: boolean;
  generalVoucherLoading: boolean;
  pubSubBrId: string;
}

const CVForm: React.FC<ParentFormBr> = ({ setShowForm, singleData, actionLbl, createGV, updateGV, fetchGV, printSummaryTicketDetails, printLoading, loading, generalVoucherLoading, pubSubBrId }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<RowAcctgEntry>();
  const [rows, setRows] = useState<RowAcctgDetails[]>([{ acctg_entries_id: "", accountLabel: "", acctnumber: "", debit: "", credit: "" }]);
  const { coaDataAccount, fetchCoaDataTable } = useCoa();
  // const { createGV, fetchGV, loading } = useGeneralVoucher();
  const [ showPayee, setShowPayee ] = useState<boolean>(false);
  // Partial<> because an inline-created payee is only { id, name } — the picker
  // still hands back a full vendor row, which remains assignable.
  const [ dataPayee, setDataPayee ] = useState<Partial<RowVendorsData>>();
  // An existing voucher opened from the list — not a new one being drafted.
  const isSavedVoucher = singleData !== undefined;
  // Skipped for a saved voucher: the control is read-only there, so pulling the
  // whole payee list would be a wasted round-trip on every voucher merely opened.
  const { payees, createPayee, loading: payeeLoading, creating: payeeCreating, loadFailed: payeeLoadFailed } = usePayee(!isSavedVoucher);
  const [activeInput, setActiveInput] = useState<{ index: number; field: 'debit' | 'credit' } | null>(null);

  useEffect(() => {
    fetchCoaDataTable();
    setValue('journal_name', 'Check Voucher');
    if (singleData !== undefined) {
      setValue('id', singleData?.id ?? '');
      setValue('vendor_id', singleData?.vendor_id ?? '');
      setValue('acctg_details', singleData?.acctg_details ?? '');
      setValue('journal_date', moment(singleData?.journal_date).format('YYYY-MM-DD') ?? '');
      // Show the REAL bank check (loans.check_no) for loan-release vouchers, not
      // the auto-generated acctg_entries.check_no counter. display_check_no is
      // resolved server-side; fall back to check_no if the field is absent.
      setValue('check_no', singleData?.display_check_no ?? singleData?.check_no ?? '');
      setValue('journal_desc', singleData?.journal_desc ?? '');
      setRows(singleData?.acctg_details);
      setDataPayee(singleData?.vendor);
    }
  }, [singleData]);

  useEffect(() => {
    setValue('vendor_id', dataPayee?.id ?? '');
  }, [dataPayee]);

  const payeeOptions = useMemo<SelectOption[]>(
    () => payees.map((p) => ({ value: p.id, label: p.name })),
    [payees],
  );

  /**
   * What the combobox shows. Falls back to the borrower's name for loan-release
   * vouchers, which carry a borrower_id and no vendor — same precedence the
   * read-only input used, so those vouchers still display a payee on open.
   * The fallback is display-only: it has no id, so vendor_id stays empty.
   */
  const selectedPayeeOption = useMemo<SelectOption | null>(() => {
    if (dataPayee?.name) return { value: dataPayee.id ?? '', label: dataPayee.name };
    if (singleData?.borrower_full_name) return { value: '', label: singleData.borrower_full_name };
    return null;
  }, [dataPayee, singleData]);

  const handleSelectPayee = (option: SelectOption | null) => {
    setDataPayee(option ? { id: option.value, name: option.label } : undefined);
  };

  const handleCreatePayee = async (name: string) => {
    const created = await createPayee(name);
    if (created) setDataPayee({ id: created.id, name: created.name });
  };

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

    if (field === 'debit' || field === 'credit') {
      const unformattedValue = value.replace(/,/g, '');
      // Allow numbers and up to 4 decimal places (matches DB DECIMAL(19,4))
      if (isValidFinancialInput(unformattedValue)) {
        newRows[index][field] = unformattedValue;

        // When a value is entered in one, clear the other
        if (unformattedValue && parseFinancialAmount(unformattedValue).greaterThan(0)) {
          if (field === 'debit') {
            newRows[index].credit = '';
          } else {
            newRows[index].debit = '';
          }
        }
      }
    } else {
      newRows[index][field] = value;
    }

    newRows[index].accountLabel = label;
    if (singleData !== undefined) {
      newRows[index].acctg_entries_id = String(singleData?.id);
    }
    setRows(newRows);
  };

  const calculateTotal = (field: "debit" | "credit") => {
    const amounts = rows.map(row => parseFinancialAmount(row[field] || '0'));
    const total = addAmounts(...amounts);
    return formatWithThousandsSeparator(total, 2);
  };

  useEffect(() => {
    setValue('acctg_details', rows);
  }, [rows])

  const onSubmit: SubmitHandler<RowAcctgEntry> = async (data) => {
    // Extract debit and credit amounts from rows
    const debits = rows.map(row => row.debit || '0');
    const credits = rows.map(row => row.credit || '0');

    // Validate double-entry accounting using Decimal.js
    const validation = validateDoubleEntry(debits, credits);

    if (!validation.isValid) {
      toast.error(
        `Debit and credit are not equal! Difference: ${formatWithThousandsSeparator(validation.difference, CURRENCY_PRECISION)}`
      );
      return;
    }

    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes, save it',
    );
    if (isConfirmed) {
      const result = await createGV(data);
      if (result.success) {
        fetchGV(pubSubBrId, "", "");
        setShowForm(false);
      }
    }
  };

  const handleCancelEntry = async (data: RowAcctgEntry) => {
    console.log(data, ' RowAcctgEntry');
    const isConfirmed = await showConfirmationModal(
      '<p style="line-height: 1.4"> Are you sure you want to cancel this entry? </p>',
      'You won\'t be able to revert this!',
      'Yes, cancel it',
    );
    if (isConfirmed) {
      // Assuming createGV can also handle cancellation logic.
      // If not, a dedicated cancelGV function would be better.
      const result = await createGV(data);
      if (result.success) {
        fetchGV(pubSubBrId, "", "");
        setShowForm(false);
      }
    }
  }

  const handleUpdateJournalDate = async (data: RowAcctgEntry) => {
    const journal_date = watch('journal_date');
    const isConfirmed = await showConfirmationModal(
      '<p style="line-height: 1.4"> Are you sure you want to update date? </p>',
      'You won\'t be able to revert this!',
      'Yes, update it',
    );
    if (isConfirmed) {
      const result = await updateGV(data, journal_date);
      if (result.success) {
        fetchGV(pubSubBrId, "", "");
        setShowForm(false);
      }
    }
  }

  useEffect(() => {
    
  }, [loading]);

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
        {singleData !== undefined ? (
          <div className="border-b border-stroke py-4 dark:border-strokedark">
            <button
              className="flex justify-center rounded bg-success border border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-light dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              type="button"
              onClick={() => printSummaryTicketDetails(singleData?.journal_ref)}
              disabled={printLoading}
            >
              <Printer size={19} className="pt-1 mr-1" /> {printLoading ? 'Generating...' : 'Print CV'}
            </button>
          </div>
        ) : (
          <></>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-3 gap-4 mb-5">
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

            <div className='mt-2'>
              <label
                className="mb-3 block text-sm font-medium text-black dark:text-white"
                htmlFor="vendor_id"
              >
                Payee
              </label>
              <PayeeSelect
                inputId="vendor_id"
                options={payeeOptions}
                value={selectedPayeeOption}
                onChange={handleSelectPayee}
                onCreate={handleCreatePayee}
                isLoading={payeeLoading}
                isCreating={payeeCreating}
                // Hide "Add new payee" when the payee list failed to load —
                // there would be nothing to check a new name against.
                canCreate={!payeeLoadFailed}
                // An already-saved voucher is read-only here on purpose:
                // updateGvEntry sends only {id, journal_date, journal_desc}, so a
                // payee changed on this screen would silently fail to save. The
                // field was read-only in edit mode before this change too — this
                // keeps that honest rather than inviting a correction that is
                // discarded. Making the payee editable after posting is a
                // separate change to updateGvEntry.
                isDisabled={isSavedVoucher}
              />
              {!isSavedVoucher && (
                <button
                  className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
                  type="button"
                  onClick={() => { setShowPayee(true); }}
                  disabled={payeeCreating}
                >
                  Browse by category
                </button>
              )}
            </div>
            <div className='col-span-3'>
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
                                isLoading={!coaDataAccount || optionsCoaData.length <= 1}
                                loadingMessage={() => "Loading accounts..."}
                              />
                            );
                          }}
                        />
                      </td>
                      <td className="p-2 border w-[30%]">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-right"
                          value={activeInput?.index === index && activeInput?.field === 'debit' ? row.debit : (row.debit ? formatWithThousandsSeparator(row.debit, 2) : '')}
                          onChange={(e) => handleChange(index, "debit", e.target.value, '')}
                          disabled={!!row.credit}
                          onFocus={() => setActiveInput({ index, field: 'debit' })}
                          onBlur={() => setActiveInput(null)}
                        />
                      </td>
                      <td className="p-2 border w-[30%]">
                        <input
                          type="text"
                          className="w-full p-1 border rounded text-right"
                          value={activeInput?.index === index && activeInput?.field === 'credit' ? row.credit : (row.credit ? formatWithThousandsSeparator(row.credit, 2) : '')}
                          onChange={(e) => handleChange(index, "credit", e.target.value, '')}
                          disabled={!!row.debit}
                          onFocus={() => setActiveInput({ index, field: 'credit' })}
                          onBlur={() => setActiveInput(null)}
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
            {singleData !== undefined && singleData?.is_cancelled === false && (
              <button
                className="flex justify-center rounded border bg-danger border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-rose-400 dark:text-white"
                type="button"
                onClick={() => { return handleCancelEntry(singleData); }}
              >
                 Cancel Entry
              </button>
            )}
            {singleData !== undefined && (
              <button
                className="flex justify-center rounded border bg-blue-400 border-stroke px-6 py-2 font-medium text-white hover:shadow-1 text-sm dark:border-rose-400 dark:text-white"
                type="button"
                onClick={() => { return handleUpdateJournalDate(singleData); }}
              >
                Update Date
              </button>
            )}
            {singleData === undefined && (
              <button
                className={`flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 text-sm ${generalVoucherLoading ? 'opacity-70' : ''}`}
                type="submit"
                disabled={generalVoucherLoading}
              >
                {generalVoucherLoading ? (
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

export default CVForm;