import { useEffect, useState } from "react";
import { BorrowerRowInfo, BorrAttachmentsRowData } from '@/utils/DataTypes';
import CustomDatatable from '@/components/CustomDatatable';
import borrAttachmentCol from './BorrAttachmentCol';
import FormAttachments from './FormAttachments'
import useBorrowerAttachments from '@/hooks/useBorrowerAttachments';
import Lightbox from '@/components/Lightbox';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { Trash2, Download, File, FileText } from 'react-feather';

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

            {/* Desktop/Tablet: Table View */}
            <div className="hidden sm:block">
              <CustomDatatable
                apiLoading={borrowerLoading}
                columns={column(handleRowClick, handleRowDownload)}
                data={dataBorrAttm}
                enableCustomHeader={true}
                onRowClicked={handleWholeRowClick}
                title={''}
              />
            </div>

            {/* Mobile: Card View */}
            <div className="block sm:hidden mt-4">
              {borrowerLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : dataBorrAttm.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No attachments found</div>
              ) : (
                dataBorrAttm.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleWholeRowClick(attachment)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={18} className="text-blue-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{attachment.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <File size={14} className="text-gray-400" />
                          <span className="font-medium">{attachment.file_type}</span>
                        </div>
                        <p className="text-xs text-gray-500 break-all">{attachment.file_path}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowDownload(attachment); }}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRowClick(attachment); }}
                        className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
