import { useEffect, useState } from "react";
import { DataRowCollectionList } from '@/utils/DataTypes';

import CustomDatatable from '@/components/CustomDatatable';
import collectionListCol from './CollectionListCol';
const column = collectionListCol;

interface CollectionListProp {
  collectionList: any;//DataRowCollectionList | undefined;
}
interface OptionProps {
  value: string | undefined;
  label: string;
  hidden?: boolean;
}

const handleRowClick = async (row: any) => {

}

const PerPayments: React.FC<CollectionListProp> = ({ collectionList: BorrowerData }) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <div className={`grid grid-cols-1 md:${showDetails ? `grid-cols-3` : `grid-cols-1`} gap-4`}>
      <div className={`${showDetails ? `col-span-2` : ''}`}>
        {showForm === false ? (
          <div className="py-1">
            <CustomDatatable
              apiLoading={false}
              columns={column(handleRowClick)}
              data={[]}
              enableCustomHeader={true} 
              title={''}  
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default PerPayments;
