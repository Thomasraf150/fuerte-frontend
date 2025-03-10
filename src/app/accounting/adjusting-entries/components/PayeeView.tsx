"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import vendorsTblColumn from '@/app/accounting/vendors/components/VendorsTblColumn';
import ReactSelect from '@/components/ReactSelect';
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
  const { dataVendorType, fetchVendors, dataVendors } = useVendor();
  const [vendorTypeOptions, setVendorTypeOptions] = useState<Option[]>([]);

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
      <div className="max-w-12xl">
        <div className="border-b border-stroke py-4 dark:border-strokedark">
          <div className="grid grid-cols-3 gap-4">
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
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    {actionLbl || 'Payee'}
                  </h3>
                </div>
                <div className="px-4">
                  <CustomDatatable
                    apiLoading={false}
                    title="Vendor List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataVendors || []}
                  />
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default PayeeView;