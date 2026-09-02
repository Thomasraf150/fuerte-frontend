import { useEffect, useState } from "react";
import { useRouter } from 'nextjs-toploader/app';
import { Lock } from 'react-feather';
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrLoanCol from './BorrLoanCol';
import { MAX_PAGE_SIZE } from '@/constants/pagination';
import FormLoans from './FormLoans'
import LoanComputation from '@/components/LoanComputation'
import useLoans from '@/hooks/useLoans';
import useBranches from '@/hooks/useBranches';

interface BorrAttProps {
  singleData: BorrowerRowInfo | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const column = borrLoanCol;

const BorrowerLoans: React.FC<BorrAttProps> = ({ singleData: BorrowerData }) => {
  const router = useRouter();
  const { fetchSubDataList, dataBranchSub, myAccessibleBranchSubs, fetchMyAccessibleBranchSubs, loadingMyAccessibleBranches } = useBranches();
  const { loanData, fetchLoans, loading, fetchRerewalLoan, dataComputedRenewal } = useLoans();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [btnRenewal, setBtnRenewal] = useState<boolean>(true);
  const [dataLoanComputed, setDataLoanComputed] = useState<BorrLoanRowData>();
  const [dataLoanRenewal, setDataLoanRenewal] = useState<string[]>([]);

  const createLoans = (b: boolean) => {
    setShowForm(b);
    setShowDetails(false);
    if (b === true) {
      // Fetch accessible branches when opening the form (token is guaranteed to exist at this point)
      fetchMyAccessibleBranchSubs();
    }
    if (b === false) {
      setDataLoanRenewal([]);
    }
  }

  // remove attachments
  const handleRowClick = async (row: BorrLoanRowData) => {
  }

  const handleCheckboxChange = async (row: BorrLoanRowData, isChecked: boolean) => {
    setDataLoanRenewal((prevArray) => {
      if (isChecked) {
        // Add the ID only if it doesn't already exist in the array
        return prevArray.includes(row?.id) ? prevArray : [...prevArray, row?.id];
      } else {
        // Remove the ID if unchecked
        return prevArray.filter((id) => id !== row?.id);
      }
    });
  }

  const renewALoan = (b: boolean) => {
    setShowForm(b);
    fetchRerewalLoan(dataLoanRenewal);
    fetchMyAccessibleBranchSubs();
    setShowDetails(false);
  }

  useEffect(() => {
    if (dataLoanRenewal.length > 0) {
      setBtnRenewal(false);
    }
  }, [dataLoanRenewal, dataComputedRenewal]);

  const handleWholeRowClick = (row: BorrLoanRowData) => {
    setDataLoanComputed(row);
    setShowDetails(true)
  }

  const handleJumpToLoan = (row: BorrLoanRowData) => {
    router.push(`/loans-list/${row.id}`);
  }

  // Note: fetchMyAccessibleBranchSubs is called in createLoans(true) when opening the form
  // This ensures the auth token is available (user is already logged in and viewing the page)

  // Both fetches require a SAVED borrower. Without one, Number(undefined) is
  // NaN, JSON.stringify sends it as null, and the backend then drops the
  // borrower predicate altogether (LoanRepository::applyFilters guards on
  // `borrower_id > 0`) — which listed every loan in the user's branches on an
  // unsaved borrower's Loans tab, and let staff "renew" a stranger's loan
  // right up to the "Please save borrower information first" toast.
  useEffect(() => {
    if (!BorrowerData?.id) {
      return;
    }
    fetchSubDataList('name_asc', Number(BorrowerData?.borrower_work_background?.area?.branch_sub?.branch_id));
    if (!showForm) {
      // Was 100000, which getLoans' max now refuses. The busiest borrower in
      // the database has 27 loans and none exceeds 100, so the standard page
      // size has 4x headroom.
      fetchLoans(MAX_PAGE_SIZE, 1, Number(BorrowerData.id));
    }
  }, [BorrowerData, showForm]);

  // Defence in depth: BorrowerInfo already locks this tab until the borrower is
  // saved, but never render a loan table without a borrower to scope it to.
  if (!BorrowerData?.id) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Lock size={22} className="text-bodydark2" />
        <p className="font-medium text-black dark:text-white">Save the borrower first</p>
        <p className="max-w-md text-sm text-bodydark2">
          Loans can only be added or renewed once this borrower has been saved. Open the
          <span className="font-medium"> Details </span>
          tab, complete the required fields, then save.
        </p>
      </div>
    );
  }

  return (
    <div className={showDetails ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
      <div className={showDetails ? 'col-span-2' : ''}>
        {showForm === false ? (
          <div className="py-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800 w-full sm:w-auto" onClick={() => { createLoans(true) }}>Add Loans</button>
              <button disabled={btnRenewal} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" onClick={() => { renewALoan(true) }}>Renew Selected Loan</button>
            </div>
            <CustomDatatable
              apiLoading={loading}
              columns={column(handleRowClick, handleCheckboxChange, handleJumpToLoan)}
              data={loanData}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          </div>
        ) : (
          <FormLoans singleData={BorrowerData} createLoans={createLoans} dataBranchSub={dataBranchSub} myAccessibleBranchSubs={myAccessibleBranchSubs} loadingMyAccessibleBranches={loadingMyAccessibleBranches} dataLoanRenewal={dataLoanRenewal} dataComputedRenewal={dataComputedRenewal}/>
        )}
      </div>
      {showDetails && (
        <div>
          <LoanComputation dataComputedLoans={dataLoanComputed} />
        </div>
      )}
    </div>
  );
};

export default BorrowerLoans;
