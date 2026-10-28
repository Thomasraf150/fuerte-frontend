"use client";

import Button from '@/components/Button';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import CustomDatatable from '@/components/CustomDatatable';
import vendorsTblColumn from './VendorsTblColumn';
import ReactSelect from '@/components/ReactSelect';
import useVendor from '@/hooks/useVendor';
import { GitBranch } from 'react-feather';
import { RowVendorsData } from '@/utils/DataTypes';
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';
import { VENDORS_PATH, vendorListPath } from './VendorFormPage';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const column = vendorsTblColumn;

// The vendor type is in the address (?type=), and the forms have their own URLs
// (/new?type=, /<vendor id>), so Back from a form returns to the same type's list.
const VendorsList: React.FC<{ initialType?: string }> = ({ initialType = '' }) => {
  const router = useRouter();
  const [vendorTypeId, setVendorTypeId] = useState<string>(initialType);
  const { dataVendorType, fetchVendors, dataVendors } = useVendor();

  const vendorTypeOptions = useMemo<Option[]>(() => (Array.isArray(dataVendorType)
    ? dataVendorType.map(dLCodes => ({ value: String(dLCodes.id), label: dLCodes.name }))
    : []), [dataVendorType]);
  const actionLbl = vendorTypeOptions.find(option => option.value === vendorTypeId)?.label ?? '';

  useEffect(() => {
    if (vendorTypeId) fetchVendors(vendorTypeId);
  }, [vendorTypeId]);

  const onChangeVendorType = (row: Option | null) => {
    setVendorTypeId(row?.value ?? '');
    router.replace(vendorListPath(row?.value), { scroll: false });
  }

  const handleWholeRowClick = (row: RowVendorsData) => {
    router.push(`${VENDORS_PATH}/${row.id}`);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <Card className="mb-4">
          <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="">
              <ReactSelect
                options={vendorTypeOptions}
                placeholder="Select a vendor..."
                onChange={(selectedOption) => onChangeVendorType(selectedOption as Option | null)}
                value={vendorTypeOptions.find(option => option.value === vendorTypeId) || null}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }) // Ensures the dropdown is on top
                }}
              />
            </div>
          </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 fade-in">
              <Card>
                {actionLbl && <CardHeader title={actionLbl} />}
                <CardBody>
                  <Toolbar>
                    <Button variant="primary"
                      disabled={!vendorTypeId}
                      title={vendorTypeId ? undefined : 'Select a vendor type first'}
                      onClick={() => router.push(`${VENDORS_PATH}/new?type=${vendorTypeId}`)}>
                      <GitBranch  size={14} /> 
                      <span>Create</span>
                    </Button>
                  </Toolbar>
                  <CustomDatatable
                    apiLoading={false}
                    title="Branch List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={vendorTypeId ? (dataVendors || []) : []}
                  />
                </CardBody>
              </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VendorsList;
