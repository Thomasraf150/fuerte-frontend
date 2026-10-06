import { useEffect, useId, useState } from "react";
import { useRouter } from 'nextjs-toploader/app';
import { Lock, XOctagon } from 'react-feather';
import { BorrowerDecision, BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import { formatDecidedOn } from '@/components/DecisionPill';
import CustomDatatable from '@/components/CustomDatatable';
import borrLoanCol from './BorrLoanCol';
import { MAX_PAGE_SIZE } from '@/constants/pagination';
import FormLoans from './FormLoans'
import LoanComputation from '@/components/LoanComputation'
import useLoans from '@/hooks/useLoans';
import useBranches from '@/hooks/useBranches';

interface BorrAttProps {
  singleData: BorrowerRowInfo | undefined;
  /**
   * The latest decision as the page holds it: the header's Approve / Reject update it, so the tab
   * follows without a reload. Absent: the decision the borrower was loaded with.
   */
  decision?: BorrowerDecision | null;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const column = borrLoanCol;

/** "Rejected on Oct 5, 2026: Kulang ang income. Approve this borrower to give a loan." No reason, no colon. */
export const rejectedLoanNote = (decision: BorrowerDecision): string => {
  const date = formatDecidedOn(decision.decided_at);
  // A reason that already ends in a full stop does not get a second one.
  const reason = decision.reason?.trim().replace(/\.+$/, '');
  return `Rejected${date ? ` on ${date}` : ''}${reason ? `: ${reason}` : ''}. Approve this borrower to give a loan.`;
};

/**
 * Where a new loan or a renewal would start, for a borrower whose latest decision is Rejected: the
 * server refuses every new loan, renewal, approval and release for them, so the buttons below are
 * off and this says why and what lifts it. The loud danger fill matches the Rejected stamp in the header.
 */
const RejectedNote: React.FC<{ id: string; decision: BorrowerDecision }> = ({ id, decision }) => (
  <p
    id={id}
    role="note"
    data-testid="rejected-loan-note"
    className="mb-3 flex items-start gap-2.5 rounded-sm border border-danger bg-danger/10 px-4 py-3 text-sm font-medium text-black dark:text-white"
  >
    <XOctagon aria-hidden="true" size={18} className="mt-px shrink-0 text-danger" />
    <span className="min-w-0 break-words">{rejectedLoanNote(decision)}</span>
  </p>
);

const BorrowerLoans: React.FC<BorrAttProps> = ({ singleData: BorrowerData, decision }) => {
  const router = useRouter();
  const rejectedNoteId = useId();
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

  // Rejected borrowers cannot borrow: the server refuses it, and the page says so before anyone tries.
  const latest = decision === undefined ? BorrowerData.decision : decision;
  const rejected = latest?.status === 'rejected' ? latest : null;

  return (
    <div className={showDetails ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-4'}>
      <div className={showDetails ? 'col-span-2' : ''}>
        {showForm === false ? (
          <div className="py-1">
            {rejected && <RejectedNote id={rejectedNoteId} decision={rejected} />}
            <div className="flex flex-wrap gap-2 mb-3">
              <button disabled={!!rejected} aria-describedby={rejected ? rejectedNoteId : undefined} className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" onClick={() => { createLoans(true) }}>Add Loans</button>
              <button disabled={btnRenewal || !!rejected} aria-describedby={rejected ? rejectedNoteId : undefined} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" onClick={() => { renewALoan(true) }}>Renew Selected Loan</button>
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
