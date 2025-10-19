import React, { useEffect, useState } from 'react';
import { Hash, Calendar, Save, List } from 'react-feather';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import { LoanReleaseFormValues, BorrLoanRowData, DataSubBranches, DataChartOfAccountList } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import useBank from '@/hooks/useBank';
import DatePicker from 'react-datepicker';
import AcctgEntryForm from './AcctgEntryForm';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => void;
  onSubmitLoanRelease: (data: LoanReleaseFormValues, callback: () => void) => void;
  fetchCoaDataTable: () => void;
  branchSubData: DataSubBranches[] | undefined;
  coaDataAccount: DataChartOfAccountList[];
  handleChangeReleasedDate: (l: string, rd: string, fn: () => void) => void;
}
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const ReleaseLoans: React.FC<OMProps> = ({ handleRefetchData, loanSingleData, onSubmitLoanRelease, fetchCoaDataTable, branchSubData, coaDataAccount, handleChangeReleasedDate }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<LoanReleaseFormValues>();
  // const { coaDataAccount, branchSubData, fetchCoaDataTable } = useCoa();

  const [bankOptions1, setBankOptions1] = useState<Option[]>([]);
  const [bankOptions2, setBankOptions2] = useState<Option[]>([]);
  // const { onSubmitLoanRelease } = useLoans();
  const { dataBank } = useBank();
  const [showPin1, setShowPin1] = useState(false);
  const [showPin2, setShowPin2] = useState(false);
  const [showAcctgEntry, setShowAcctgEntry] = useState<boolean>(false);

  const toggleShowPin1 = () => {
    setShowPin1(!showPin1);
  };
  
  const toggleShowPin2 = () => {
    setShowPin2(!showPin2);
  };

  const isCashBank = (bankId: number | string | undefined) => {
    if (!bankId || !dataBank) return false;
    const bank = dataBank.find(b => String(b.id) === String(bankId));
    return bank?.name?.toLowerCase().includes('cash') || false;
  };

  // Watch bank selection to detect when "Cash on Hand" is selected
  const selectedBankId = watch('bank_id');
  const isCashSelected = isCashBank(selectedBankId);

  const onSubmit: SubmitHandler<LoanReleaseFormValues> = async (data) => {
    onSubmitLoanRelease(data, handleRefetchData);
  };

  // const handleLoanBank = (data: LoanBankFormValues | undefined) => {
  //   // submitPNSigned(data, handleRefetchData);
  // }

  useEffect(() => {
    fetchCoaDataTable();
  }, [])

  useEffect(() => {
    if (dataBank) {
      const dynaOpt: Option[] = dataBank.map(item => ({
        value: String(item.id),
        label: item.name, // assuming `name` is the key you want to use as label
      }));
      setBankOptions1([
        ...dynaOpt,
      ]);
      setBankOptions2([
        ...dynaOpt,
      ]);
    }
  }, [dataBank])

  useEffect(() => {
    if (loanSingleData) {
      setValue('id', loanSingleData?.id);
      setValue('released_date', new Date(loanSingleData?.released_date));
      setValue('bank_id', loanSingleData?.bank_id);
      setValue('check_no', loanSingleData?.check_no);
    }
    console.log(loanSingleData, ' loanSingleData')
  }, [loanSingleData, setValue]);

  useEffect(() => {
    if (isCashSelected) {
      setValue('check_no', 'N/A');
    } else if (selectedBankId && !isCashSelected) {
      // Only clear if user is switching banks (not on initial load)
      const currentCheckNo = watch('check_no');
      if (currentCheckNo === 'N/A') {
        setValue('check_no', '');
      }
    }
  }, [selectedBankId, isCashSelected, setValue]);

  return (
    <>
      <div className="w-full lg:w-3/4 xl:w-1/2">
      <form onSubmit={handleSubmit(onSubmit)} >
      <div className="grid grid-cols-2 gap-3 p-3 lg:grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <div className="flow-root border border-gray-100 py-3 shadow-sm">
          <dl className="-my-3 divide-y divide-gray-100 text-sm">
            <div className={`grid gap-1 p-3 sm:gap-4 bg-boxdark-2 text-lime-100 ${isCashSelected ? 'grid-cols-2 lg:grid-cols-2 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3 sm:grid-cols-3'}`}>
              <dt className="font-medium text-center text-gray-900">Released Date</dt>
              <dt className="font-medium text-center text-gray-900">Bank</dt>
              {!isCashSelected && <dd className="text-gray-700 text-center">Check Number</dd>}
            </div>
            <div className={`grid gap-1 p-3 sm:gap-4 ${isCashSelected ? 'grid-cols-2 lg:grid-cols-2 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3 sm:grid-cols-2'}`}>
              <dt className="font-medium text-left text-gray-900">
                <div className="relative">
                  <Controller
                    control={control}
                    name="released_date"
                    defaultValue={undefined}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={(date: any) => field.onChange(date)}
                        dateFormat="MM/dd/yyyy"
                        className="p-2 border w-full border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
                        placeholderText="Select start date"
                        id="startDate"
                      />
                    )}
                  />
                  <span className="absolute right-3 top-2.5 pointer-events-none">
                    <Calendar size="18" />
                  </span>
                </div>
                {errors.released_date && <p className="mt-2 text-sm text-red-600">{errors.released_date.message}</p>}
              </dt>
              <dd className="text-gray-700 dark:text-bodydark text-left">
                <div className="">
                  <Controller
                    name="bank_id"
                    control={control}
                    rules={{ required: 'Surrendered Bank is required' }}
                    render={({ field }) => (
                      <ReactSelect
                        {...field}
                        options={bankOptions1}
                        placeholder="Select a Bank..."
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.value);
                        }}
                        value={bankOptions1.find(option => String(option.value) === String(field.value)) || null}
                      />
                    )}
                  />
                  {errors.bank_id && <p className="mt-2 text-sm text-red-600">{errors.bank_id.message}</p>}
                </div>
              </dd>
              {!isCashSelected && (
                <dt className="font-medium text-left text-gray-900">
                  <div className="relative">
                    <input
                      className={`block p-2 w-full border border-gray-900 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                      type="text"
                      id="check_no"
                      placeholder="Check Number"
                      {...register('check_no', { required: "Issued Card No. is required!" })}
                    />
                    <span className="absolute right-3 top-2.5">
                      <Hash size="18" />
                    </span>
                    {errors.check_no && <p className="mt-2 text-sm text-red-600">{errors.check_no.message}</p>}
                  </div>
                </dt>
              )}
            </div>
          
            
          </dl>

        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
          <button
            className="bg-purple-700 flex justify-center items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm w-full sm:w-auto"
            type="submit"
            disabled={loanSingleData?.status === 3 ? true : false}
          >
            <span className="mt-1 mr-1">
              <Save size={17} />
            </span>
            <span>Release</span>
          </button>
          <button
            className="bg-green-600 flex justify-center items-center text-white py-2 px-4 rounded hover:bg-green-500 text-sm w-full sm:w-auto"
            type="button"
            onClick={() => handleChangeReleasedDate(String(loanSingleData?.id), String(watch('released_date')), handleRefetchData)}
          >
            <span className="mt-1 mr-1">
              <Calendar size={17} />
            </span>
            <span>Update Released Date</span>
          </button>
          {loanSingleData?.acctg_entry === null && loanSingleData?.status === 3 ? (
            <button
              className="bg-yellow-500 flex justify-center items-center text-white py-2 px-4 rounded hover:bg-yellow-400 text-sm w-full sm:w-auto"
              type="button"
              onClick={() => setShowAcctgEntry(true)}
            >
              <span className="mt-1 mr-1">
                <List size={17} />
              </span>
              <span>Post Accounting</span>
            </button>
          ) : ('')}
        </div>
      </div>
      </form>
    </div>
    {showAcctgEntry && (
      <>
        <hr className="mb-4"/>
        <div className="w-full">
          <FormLabel title={`Create Proper Account`}/>
          <AcctgEntryForm 
            branchSubData={branchSubData} 
            loanSingleData={loanSingleData} 
            coaDataAccount={coaDataAccount || []} 
            setShowAcctgEntry={setShowAcctgEntry}
            handleRefetchData={handleRefetchData}/>
        </div>
      </>
    )}
  
    </>
  )
}

export default ReleaseLoans;
