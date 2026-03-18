import React, { useEffect, useState } from 'react';
import { Hash, Calendar, Save, List, AlertTriangle, XCircle, RotateCw, CheckCircle } from 'react-feather';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import ReactSelect from '@/components/ReactSelect';
import { LoanReleaseFormValues, BorrLoanRowData, DataSubBranches, DataChartOfAccountList } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';
import useBank from '@/hooks/useBank';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Link from 'next/link';
import AcctgEntryForm from './AcctgEntryForm';

interface OMProps {
  loanSingleData: BorrLoanRowData | undefined;
  handleRefetchData: () => void;
  onSubmitLoanRelease: (data: LoanReleaseFormValues, callback: () => void) => Promise<{ success: boolean; auto_posted?: boolean; unmapped?: string[] } | undefined>;
  fetchCoaDataTable: () => void;
  branchSubData: DataSubBranches[] | undefined;
  coaDataAccount: DataChartOfAccountList[];
  handleChangeReleasedDate: (l: string, rd: string, fn: () => void) => void;
  handleUpdateReleasedLoanInfo: (loan_id: number, released_date: string, bank_id: number, check_no: string, fn: () => void) => void;
  retryAutoPostAccounting?: (loanId: number, callback: () => void) => Promise<{ success: boolean; auto_posted?: boolean; unmapped?: string[] } | undefined>;
}
interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const ReleaseLoans: React.FC<OMProps> = ({ handleRefetchData, loanSingleData, onSubmitLoanRelease, fetchCoaDataTable, branchSubData, coaDataAccount, handleChangeReleasedDate, handleUpdateReleasedLoanInfo, retryAutoPostAccounting }) => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<LoanReleaseFormValues>();
  // const { coaDataAccount, branchSubData, fetchCoaDataTable } = useCoa();

  const [bankOptions1, setBankOptions1] = useState<Option[]>([]);
  const [bankOptions2, setBankOptions2] = useState<Option[]>([]);
  // const { onSubmitLoanRelease } = useLoans();
  const { dataBank } = useBank();
  const [showPin1, setShowPin1] = useState(false);
  const [showPin2, setShowPin2] = useState(false);
  const [showAcctgEntry, setShowAcctgEntry] = useState<boolean>(false);
  const [unmappedDetails, setUnmappedDetails] = useState<string[]>([]);
  const [postingBlocked, setPostingBlocked] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);

  const handleRetryAutoPost = async () => {
    if (!retryAutoPostAccounting || !loanSingleData?.id) return;
    setPostingLoading(true);
    try {
      const result = await retryAutoPostAccounting(Number(loanSingleData.id), handleRefetchData);
      if (result?.auto_posted) {
        setUnmappedDetails([]);
        setPostingBlocked(false);
        return true;
      }
      if (result?.unmapped && result.unmapped.length > 0) {
        setUnmappedDetails(result.unmapped);
        setPostingBlocked(true);
      }
      return false;
    } finally {
      setPostingLoading(false);
    }
  };

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
    setReleaseLoading(true);
    try {
      const result = await onSubmitLoanRelease(data, handleRefetchData);
      if (result?.unmapped && result.unmapped.length > 0) {
        setUnmappedDetails(result.unmapped);
        setPostingBlocked(!result.auto_posted);
      }
    } finally {
      setReleaseLoading(false);
    }
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
      setValue('released_date', loanSingleData?.released_date
        ? new Date(loanSingleData.released_date)
        : new Date()
      );
      setValue('bank_id', loanSingleData?.bank_id);
      setValue('check_no', loanSingleData?.check_no);
    }
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
            className={`flex justify-center items-center text-white py-2 px-4 rounded text-sm w-full sm:w-auto ${
              loanSingleData?.status === 3 || releaseLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-800'
            }`}
            type="submit"
            disabled={loanSingleData?.status === 3 || releaseLoading}
          >
            <span className="mt-1 mr-1">
              {releaseLoading ? <RotateCw size={17} className="animate-spin" /> : <Save size={17} />}
            </span>
            <span>{releaseLoading ? 'Releasing...' : 'Release'}</span>
          </button>
          <button
            className="bg-green-600 flex justify-center items-center text-white py-2 px-4 rounded hover:bg-green-500 text-sm w-full sm:w-auto"
            type="button"
            onClick={() => handleUpdateReleasedLoanInfo(
              Number(loanSingleData?.id),
              moment(watch('released_date')).format('YYYY-MM-DD'),
              Number(watch('bank_id')),
              String(watch('check_no') || 'N/A'),
              handleRefetchData
            )}
            disabled={loanSingleData?.status === 3 ? false : true}
          >
            <span className="mt-1 mr-1">
              <Save size={17} />
            </span>
            <span>Save Changes</span>
          </button>
          {loanSingleData?.acctg_entry === null && loanSingleData?.status === 3 ? (
            <button
              className={`bg-yellow-500 flex justify-center items-center text-white py-2 px-4 rounded hover:bg-yellow-400 text-sm w-full sm:w-auto ${postingLoading ? 'opacity-70' : ''}`}
              type="button"
              disabled={postingLoading}
              onClick={async () => {
                const posted = await handleRetryAutoPost();
                if (!posted && !postingBlocked) setShowAcctgEntry(true);
              }}
            >
              <span className="mt-1 mr-1">
                {postingLoading ? <RotateCw size={17} className="animate-spin" /> : <List size={17} />}
              </span>
              <span>{postingLoading ? 'Posting...' : 'Post Accounting'}</span>
            </button>
          ) : ('')}
        </div>
      </div>
      </form>
    </div>
    {loanSingleData?.status === 3 && loanSingleData?.acctg_entry !== null && (
      <div
        className="w-full lg:w-3/4 xl:w-1/2 mt-4 rounded-lg p-4"
        style={{ backgroundColor: '#f0fdf4', borderLeft: '5px solid #22c55e', boxShadow: '0 1px 3px rgba(34,197,94,0.2)' }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle size={22} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ color: '#15803d', fontSize: '15px', fontWeight: 700 }}>
              Accounting Entry Posted
            </p>
            <p style={{ color: '#166534', fontSize: '13px', marginTop: '4px' }}>
              Journal Ref: <strong>{loanSingleData.acctg_entry.journal_ref || loanSingleData.acctg_entry.reference_no}</strong>
            </p>
          </div>
        </div>
      </div>
    )}
    {loanSingleData?.status === 3 && loanSingleData?.acctg_entry === null && unmappedDetails.length === 0 && (
      <div
        className="w-full lg:w-3/4 xl:w-1/2 mt-4 rounded-lg p-4"
        style={{ backgroundColor: '#fff7ed', borderLeft: '5px solid #f59e0b', boxShadow: '0 1px 3px rgba(245,158,11,0.2)' }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ color: '#92400e', fontSize: '15px', fontWeight: 700 }}>
              Accounting Entry Not Yet Posted
            </p>
            <p style={{ color: '#b45309', fontSize: '13px', marginTop: '6px' }}>
              This loan has been released but has no accounting entry. Click &quot;Post Accounting&quot; to auto-post, or configure mappings first.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                disabled={postingLoading}
                onClick={handleRetryAutoPost}
                className="inline-flex items-center gap-1.5 text-sm"
                style={{ color: '#fff', backgroundColor: '#f59e0b', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, opacity: postingLoading ? 0.7 : 1 }}
              >
                {postingLoading ? <RotateCw size={15} className="animate-spin" /> : <List size={15} />}
                {postingLoading ? 'Posting...' : 'Post Accounting'}
              </button>
              <Link
                href="/accounting/loan-proceed-settings"
                className="inline-flex items-center gap-1.5 text-sm"
                style={{ color: '#fff', backgroundColor: '#2563eb', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}
              >
                Configure Mappings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )}
    {unmappedDetails.length > 0 && loanSingleData?.acctg_entry === null && (
      postingBlocked ? (
        <div
          className="w-full lg:w-3/4 xl:w-1/2 mt-4 rounded-lg p-4"
          style={{ backgroundColor: '#fef2f2', borderLeft: '5px solid #dc2626', boxShadow: '0 1px 3px rgba(220,38,38,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <XCircle size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: '#b91c1c', fontSize: '16px', fontWeight: 700 }}>
                Accounting Entry NOT Posted
              </p>
              <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>
                These unmapped items have non-zero amounts. Configure their account mappings to enable auto-posting:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm" style={{ color: '#b91c1c' }}>
                {unmappedDetails.map((desc, i) => (
                  <li key={i} style={{ fontWeight: 600 }}>{desc}</li>
                ))}
              </ul>
              <Link
                href="/accounting/loan-proceed-settings"
                className="inline-flex items-center gap-1.5 mt-3 text-sm"
                style={{ color: '#fff', backgroundColor: '#2563eb', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}
              >
                Configure Mappings →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="w-full lg:w-3/4 xl:w-1/2 mt-4 rounded-lg p-4"
          style={{ backgroundColor: '#fefce8', borderLeft: '5px solid #eab308', boxShadow: '0 1px 3px rgba(234,179,8,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: '#854d0e', fontSize: '14px', fontWeight: 700 }}>
                Partial Accounting Entry
              </p>
              <p style={{ color: '#a16207', fontSize: '13px', marginTop: '6px' }}>
                The following loan details were skipped because they have no account mapping for this branch:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm" style={{ color: '#854d0e' }}>
                {unmappedDetails.map((desc, i) => (
                  <li key={i} style={{ fontWeight: 500 }}>{desc}</li>
                ))}
              </ul>
              <Link
                href="/accounting/loan-proceed-settings"
                className="inline-flex items-center gap-1.5 mt-3 text-sm"
                style={{ color: '#1d4ed8', fontWeight: 500, textDecoration: 'underline' }}
              >
                Configure Mappings →
              </Link>
            </div>
          </div>
        </div>
      )
    )}
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
