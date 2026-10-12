import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrCoMakerRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrCoMakerCol from './BorrCoMakerCol';
import FormComaker from './FormComaker'
import useBorrowerCoMaker from '@/hooks/useBorrowerCoMaker';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { Trash2, Calendar, Phone, MapPin, User } from 'react-feather';
import SkeletonBlock from "@/components/LoadingStates/SkeletonBlock";

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
      // Await the delete so the refetch runs AFTER the soft-delete commits —
      // otherwise the parallel refetch can still return the just-deleted row.
      await handleDeleteComaker(row);
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
            <button className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90" onClick={() => { createCoMaker(true) }}>Add Co-Maker</button>

            {/* Desktop/Tablet: Table View */}
            <div className="hidden sm:block">
              <CustomDatatable
                apiLoading={borrowerLoading}
                columns={column(handleRowClick)}
                data={dataBorrCoMaker}
                enableCustomHeader={true}
                onRowClicked={handleWholeRowClick}
                title={''}
              />
            </div>

            {/* Mobile: Card View */}
            <div className="block sm:hidden mt-4">
              {borrowerLoading ? (
                <SkeletonBlock rows={3} label="Loading…" className="py-4" />
              ) : dataBorrCoMaker.length === 0 ? (
                <div className="text-center py-8 text-body">No co-makers found</div>
              ) : (
                dataBorrCoMaker.map((coMaker) => (
                  <div
                    key={coMaker.id}
                    className="bg-white border border-stroke dark:border-strokedark rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleWholeRowClick(coMaker)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{coMaker.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-body">
                          <User size={14} />
                          <span>{coMaker.relationship}</span>
                          <span className="text-bodydark2">•</span>
                          <span>{coMaker.marital_status}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(coMaker); }}
                        className="p-2 hover:bg-danger/10 rounded-full transition-colors"
                        aria-label="Delete co-maker"
                      >
                        <Trash2 size={18} className="text-danger" />
                      </button>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={14} className="text-bodydark2 mt-1 flex-shrink-0" />
                      <span className="text-sm text-black dark:text-white">{coMaker.address}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-body mt-3 pt-3 border-t border-stroke dark:border-strokedark">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-bodydark2" />
                        <span>{coMaker.birthdate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-bodydark2" />
                        <span>{coMaker.contact_no}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <FormComaker singleData={BorrowerData} createCoMaker={createCoMaker} coMakerData={coMakerData} />
        )}
      </div>
  );
};

export default BorrowerCoMaker;
