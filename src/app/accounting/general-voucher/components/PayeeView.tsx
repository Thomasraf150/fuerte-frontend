"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import vendorsTblColumn from '@/app/accounting/vendors/components/VendorsTblColumn';
import ReactSelect from '@/components/ReactSelect';
import { CardSection } from '@/components/Card';
import useVendor from '@/hooks/useVendor';
import { RowVendorsData } from '@/utils/DataTypes';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

interface ParentProp {
  setShowPayee: (v: boolean) => void;
  setDataPayee: (d: RowVendorsData) => void;
}

const column = vendorsTblColumn;

const PayeeView: React.FC<ParentProp> = ({ setShowPayee, setDataPayee }) => {
  const { control: SelectControl } = useForm<any>();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const { dataVendorType, fetchVendors, dataVendors, loading } = useVendor();
  const [vendorTypeOptions, setVendorTypeOptions] = useState<Option[]>([]);

  // Dropdown shows loading only while vendor types haven't loaded yet (initial mount).
  // Table shows loading only after the user has picked a payee category and a fetch is in flight.
  const isDropdownLoading = loading && (!dataVendorType || dataVendorType.length === 0);
  const isTableLoading = loading && !!actionLbl;

  useEffect(() => {
    if (dataVendorType && Array.isArray(dataVendorType)) {
      const dynaOpt: Option[] = dataVendorType.map(dLCodes => ({
        value: String(dLCodes.id),
        label: dLCodes.name, // assuming `name` is the key you want to use as label
      }));
      setVendorTypeOptions([
        ...dynaOpt,
      ]);
    }
  }, [dataVendorType, actionLbl, dataVendors]);

  const onChangeVendorType = (row: any) => {
    setShowForm(false);
    setActionLbl(row?.label);
    fetchVendors(row?.value);
  }

  const handleWholeRowClick = (row: any) => {
    setShowPayee(false);
    setDataPayee(row);
  }

  const handleCreateVendor = (b: boolean) => {
    setShowForm(b);
  }

  return (
    <div>
      <div className="max-w-12xl space-y-4">
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="">
              <Controller
                name="code"
                control={SelectControl}
                rules={{ required: 'Vendor is required' }} 
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={vendorTypeOptions}
                    placeholder="Select a payee..."
                    isLoading={isDropdownLoading}
                    loadingMessage={() => 'Loading payee categories...'}
                    noOptionsMessage={() =>
                      isDropdownLoading ? 'Loading payee categories...' : 'No payee categories found'
                    }
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value);
                      onChangeVendorType(selectedOption);
                    }}
                    value={vendorTypeOptions.find(option => String(option.value) === String(field.value)) || null}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }) // Ensures the dropdown is on top
                    }}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2 ${!showForm ? 'fade-in' : 'fade-out'}`}>
              <CardSection title={actionLbl || 'Payee'}>
                <CustomDatatable
                  apiLoading={isTableLoading}
                  title=""
                  enableCustomHeader={true}
                  searchPlaceholder="Search payee by name, employee #, or TIN…"
                  onRowClicked={handleWholeRowClick}
                  columns={column()}
                  data={dataVendors || []}
                />
              </CardSection>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default PayeeView;