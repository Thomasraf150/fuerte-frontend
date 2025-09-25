import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrCoMakerRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrCoMakerCol from './BorrCoMakerCol';
import FormComaker from './FormComaker'
import useBorrowerCoMaker from '@/hooks/useBorrowerCoMaker';
import { showConfirmationModal } from '@/components/ConfirmationModal';

interface BorrAttProps {
  singleData: BorrowerRowInfo | undefined;
}

const column = borrCoMakerCol;

const BorrowerCoMaker: React.FC<BorrAttProps> = ({ singleData: BorrowerData }) => {
  const { dataBorrCoMaker, borrowerLoading, fetchDataBorrCoMaker, handleDeleteComaker } = useBorrowerCoMaker();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [images, setImages] = useState<string>('');
  const [coMakerData, setCoMakerData] = useState<BorrCoMakerRowData[]>();
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);

  const createCoMaker = (b: boolean) => {
    setShowForm(b);
    if (b===false) {
      fetchDataBorrCoMaker(100, 1, Number(BorrowerData?.id));
    }
  }

  // remove attachments
  const handleRowClick = async (row: BorrCoMakerRowData) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteComaker(row);
      fetchDataBorrCoMaker(100, 1, Number(BorrowerData?.id));
    }
  }

  const handleWholeRowClick = (row: any) => {
    // console.log(row, ' row');
    setCoMakerData(row);
    setShowForm(true);
  }

  useEffect(() => {
    if (BorrowerData?.id) {
      fetchDataBorrCoMaker(100, 1, Number(BorrowerData.id));
    }
  }, [BorrowerData, coMakerData]);

  return (
      <div className="">
        {showForm === false ? (
          <div className="py-1">
            <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => { createCoMaker(true) }}>Add Co-Maker</button>
            <CustomDatatable
              apiLoading={borrowerLoading}
              columns={column(handleRowClick)}
              data={dataBorrCoMaker}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          </div>
        ) : (
          // coMakerData={coMakerData}
          <FormComaker singleData={BorrowerData} createCoMaker={createCoMaker} coMakerData={coMakerData} borrowerLoading={borrowerLoading}/>
        )}
      </div>
  );
};

export default BorrowerCoMaker;
