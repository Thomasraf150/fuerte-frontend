import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrLoanRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrLoanCol from './BorrLoanCol';
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
  const { fetchSubDataList, dataBranchSub } = useBranches();
  const { loanData, fetchLoans, loading, fetchRerewalLoan, dataComputedRenewal } = useLoans();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [btnRenewal, setBtnRenewal] = useState<boolean>(true);
  const [dataLoanComputed, setDataLoanComputed] = useState<BorrLoanRowData>();
  const [dataLoanRenewal, setDataLoanRenewal] = useState<string[]>([]);

  const createLoans = (b: boolean) => {
    setShowForm(b);
    setShowDetails(false);
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
    // console.log(dataLoanRenewal, ' dataLoanRenewal');
    fetchRerewalLoan(dataLoanRenewal);

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

  useEffect(() => {
    if (BorrowerData?.id) {
      fetchSubDataList('id_desc', Number(BorrowerData?.borrower_work_background?.area?.branch_sub?.branch_id));
    }
    if (!showForm) {
      fetchLoans(100000, 1, Number(BorrowerData?.id));
    }
    console.log(BorrowerData, ' BorrowerData')
  }, [BorrowerData, showForm]);

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
              columns={column(handleRowClick, handleCheckboxChange)}
              data={loanData}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          </div>
        ) : (
          <FormLoans singleData={BorrowerData} createLoans={createLoans} dataBranchSub={dataBranchSub} dataLoanRenewal={dataLoanRenewal} dataComputedRenewal={dataComputedRenewal}/>
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
