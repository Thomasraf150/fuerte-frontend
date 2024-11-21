import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrAttachmentsRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrAttachmentCol from './BorrAttachmentCol';
import FormAttachments from './FormAttachments'
import useBorrowerAttachments from '@/hooks/useBorrowerAttachments';
import Lightbox from '@/components/Lightbox';
import { showConfirmationModal } from '@/components/ConfirmationModal';

interface BorrAttProps {
  singleData: BorrowerRowInfo | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const column = borrAttachmentCol;

const BorrowerAttachments: React.FC<BorrAttProps> = ({ singleData: BorrowerData }) => {
  const { dataBorrAttm, borrowerLoading, fetchDataBorrAttachments, handleDeleteAttm } = useBorrowerAttachments();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [images, setImages] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);

  const createAttachments = (b: boolean) => {
    setShowForm(b);
    if (b===false) {
      fetchDataBorrAttachments(100, 1, Number(BorrowerData?.id));
    }
  }

  // remove attachments
  const handleRowClick = async (row: BorrAttachmentsRowData) => {
    const isConfirmed = await showConfirmationModal(
      'Are you sure?',
      'You won\'t be able to revert this!',
      'Yes delete it!',
    );
    if (isConfirmed) {
      handleDeleteAttm(row);
      fetchDataBorrAttachments(100, 1, Number(BorrowerData?.id));
    }
  }

  const handleRowDownload = async (row: BorrAttachmentsRowData) => {
      // console.log(row, ' row?.name')

      try {
        if (row?.file_path) {
          // Construct the file URL
          const fileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/storage/${row?.file_path}`;
          window.open(fileUrl, '_blank');
          // // Create an anchor element for downloading
          // const anchor = document.createElement('a');
          // anchor.href = fileUrl;
          // anchor.download = row.file_path.split('/').pop() || 'download';
          
          // // Append the anchor to the document body
          // document.body.appendChild(anchor);
          
          // // Trigger the download
          // anchor.click();
          
          // // Remove the anchor after the download
          // document.body.removeChild(anchor);
      } else {
          console.error('File path is missing.');
      }
      } catch (error) {
          console.error('Error during download:', error);
      }
  }

  const handleWholeRowClick = (row: BorrAttachmentsRowData) => {
    setImages(`${process.env.NEXT_PUBLIC_BASE_URL}/storage/${row?.file_path}`);
    setIsLightboxOpen(true);
  }

  useEffect(() => {
    if (BorrowerData?.id) {
      fetchDataBorrAttachments(100, 1, Number(BorrowerData.id));
    }
  }, [BorrowerData]);

  return (
      <div className="">
        {showForm === false ? (
          <div className="py-1">
            <button className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800" onClick={() => { createAttachments(true) }}>Add Attachments</button>
            <CustomDatatable
              apiLoading={borrowerLoading}
              columns={column(handleRowClick, handleRowDownload)}
              data={dataBorrAttm}
              enableCustomHeader={true} 
              onRowClicked={handleWholeRowClick}
              title={''}  
            />
          </div>
        ) : (
          <FormAttachments singleData={BorrowerData} createAttachments={createAttachments}/>
        )}
        <div className="p-4">
          <Lightbox
            src={images}
            alt="Sample Image"
            isOpen={isLightboxOpen}
            onClose={closeLightbox}
          />
        </div>
      </div>
  );
};

export default BorrowerAttachments;
