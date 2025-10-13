import React, { useEffect, useState } from 'react';
import { Hash, Calendar, Save, List } from 'react-feather';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import "react-datepicker/dist/react-datepicker.css";
import { LoanReleaseFormValues, BorrLoanRowData, DataSubBranches, DataChartOfAccountList } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import useLoans from '@/hooks/useLoans';
import useBank from '@/hooks/useBank';
import DatePicker from 'react-datepicker';
import { showConfirmationModal } from '@/components/ConfirmationModal';
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

  return (
    <>
      <div className="w-1/2">
      <form onSubmit={handleSubmit(onSubmit)} >
      <div className="grid grid-cols-2 gap-3 p-3 lg:grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <div className="flow-root border border-gray-100 dark:border-strokedark py-3 shadow-sm bg-white dark:bg-boxdark">
          <dl className="-my-3 divide-y divide-gray-100 dark:divide-strokedark text-sm">
            <div className="grid grid-cols-2 gap-1 p-3 lg:grid-cols-3 sm:grid-cols-3 sm:gap-4 bg-boxdark-2 dark:bg-meta-4 text-lime-100 dark:text-white">
              <dt className="font-medium text-center text-gray-900 dark:text-white">Released Date</dt>
              <dt className="font-medium text-center text-gray-900 dark:text-white">Bank</dt>
              <dd className="text-gray-700 dark:text-bodydark text-center">Check Number</dd>
            </div>
            <div className="grid grid-cols-2 gap-1 p-3 lg:grid-cols-3 sm:grid-cols-2 sm:gap-4">
              <dt className="font-medium text-left text-gray-900 dark:text-bodydark">
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
                  <span className="absolute right-3 top-2.5">
                    <Calendar size="18" />
                  </span>
                  {errors.released_date && <p className="mt-2 text-sm text-red-600">{errors.released_date.message}</p>}
                </div>
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
              <dt className="font-medium text-left text-gray-900 dark:text-bodydark">
                <div className="relative">
                  <input
                    className={`block p-2 w-full border border-stroke dark:border-strokedark bg-white dark:bg-form-input text-gray-900 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm`}
                    type="text"
                    id="check_no"
                    placeholder="Card Account No."
                    {...register('check_no', { required: "Issued Card No. is required!" })}
                  />
                  <span className="absolute right-3 top-2.5">
                    <Hash size="18" />
                  </span>
                  {errors.check_no && <p className="mt-2 text-sm text-red-600">{errors.check_no.message}</p>}
                </div>
              </dt>
            </div>
          
            
          </dl>

        </div>
        <div>
          <button
            className="bg-purple-700 flex justify-between float-right items-center text-white py-2 px-4 rounded hover:bg-purple-800 text-sm"
            type="submit"
            disabled={loanSingleData?.status === 3 ? true : false}
          >
            <span className="mt-1 mr-1">
              <Save size={17} /> 
            </span>
            <span>Release</span>
          </button>
          <button
            className="bg-green-600 flex justify-between float-right items-center text-white py-2 px-4 mr-2 rounded hover:bg-green-500 text-sm"
            type="button"
            onClick={() => handleChangeReleasedDate(String(loanSingleData?.id), String(watch('released_date')), handleRefetchData)}
          >
            <span className="mt-1 mr-1">
              <Calendar size={17} /> 
            </span>
            <span>Update Released Date</span>
          </button>
          {loanSingleData?.acctg_entry === null && loanSingleData?.status === 3 ? (
            <>
              <button
                className="bg-yellow-500 flex justify-between float-right items-center text-white py-2 px-4 mr-2 rounded hover:bg-yellow-400 text-sm"
                type="button"
                onClick={() => setShowAcctgEntry(true)}
              >
                <span className="mt-1 mr-1">
                  <List size={17} /> 
                </span>
                <span>Post Accounting</span>
              </button>
            </>
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
