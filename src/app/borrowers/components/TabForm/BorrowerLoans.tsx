import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrAttachmentsRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrAttachmentCol from './BorrAttachmentCol';
import FormLoans from './FormLoans'
import useBorrowerAttachments from '@/hooks/useBorrowerAttachments';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import useBranches from '@/hooks/useBranches';

interface BorrAttProps {
  singleData: BorrowerRowInfo | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const column = borrAttachmentCol;

const BorrowerLoans: React.FC<BorrAttProps> = ({ singleData: BorrowerData }) => {
  const { dataBorrAttm, borrowerLoading, fetchDataBorrAttachments, handleDeleteAttm } = useBorrowerAttachments();
  const { fetchSubDataList, dataBranchSub } = useBranches();
  const [showForm, setShowForm] = useState<boolean>(false);

  const createLoans = (b: boolean) => {
    setShowForm(b);
    
  }

  // remove attachments
  const handleRowClick = async (row: BorrAttachmentsRowData) => {
  }

  const handleWholeRowClick = (row: BorrAttachmentsRowData) => {
    
  }

  useEffect(() => {
    if (BorrowerData?.id) {
      fetchSubDataList('id_desc', Number(BorrowerData?.user?.branchSub?.branch_id));
    }
  }, [BorrowerData]);

  return (
      <div className="">
        {showForm === false ? (
          <div className="py-1">
            <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => { createLoans(true) }}>Add Loans</button>
            <CustomDatatable
              apiLoading={borrowerLoading}
              columns={column(handleRowClick)}
              data={dataBorrAttm}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          
          </div>
        ) : (
          <FormLoans singleData={BorrowerData} createLoans={createLoans} dataBranchSub={dataBranchSub}/>
        )}
      </div>
  );
};

export default BorrowerLoans;
