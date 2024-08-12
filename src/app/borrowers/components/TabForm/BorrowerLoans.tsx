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
  const { loanData, fetchLoans } = useLoans();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [dataLoanComputed, setDataLoanComputed] = useState<BorrLoanRowData>();

  const createLoans = (b: boolean) => {
    setShowForm(b);
    setShowDetails(false);
  }

  // remove attachments
  const handleRowClick = async (row: BorrLoanRowData) => {
  }

  const handleWholeRowClick = (row: BorrLoanRowData) => {
    setDataLoanComputed(row);
    setShowDetails(true)
  }

  useEffect(() => {
    if (BorrowerData?.id) {
      fetchSubDataList('id_desc', Number(BorrowerData?.user?.branchSub?.branch_id));
    }
    if (!showForm) {
      fetchLoans(1000, 1, Number(BorrowerData?.id));
    }
  }, [BorrowerData, showForm]);

  return (
    <div className={`grid grid-cols-1 md:${showDetails ? `grid-cols-[2fr_1fr]` : `grid-cols-1`} gap-4`}>
      <div>
        {showForm === false ? (
          <div className="py-1">
            <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => { createLoans(true) }}>Add Loans</button>
            <CustomDatatable
              apiLoading={false}
              columns={column(handleRowClick)}
              data={loanData}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          </div>
        ) : (
          <FormLoans singleData={BorrowerData} createLoans={createLoans} dataBranchSub={dataBranchSub}/>
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
