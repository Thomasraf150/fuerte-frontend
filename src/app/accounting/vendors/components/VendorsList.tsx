"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import VendorsForm from './Forms/VendorsForm';
import SupplierForm from './Forms/SupplierForm';
import vendorsTblColumn from './VendorsTblColumn';
import ReactSelect from '@/components/ReactSelect';
import useVendor from '@/hooks/useVendor';
import { GitBranch, Plus } from 'react-feather';
import { showConfirmationModal } from '@/components/ConfirmationModal';
import { RowVendorTypeData, RowVendorsData } from '@/utils/DataTypes';
import FormLabel from '@/components/FormLabel';

interface Option {
  value: string;
  label: string;
  hidden?: boolean;
}

const column = vendorsTblColumn;

const VendorsList: React.FC = () => {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<any>();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<string>('');
  const [vendorTypeId, setVendorTypeId] = useState<string>('');
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
    console.log(row, ' row');
    setActionLbl(row?.label);
    fetchVendors(row?.value)
    setVendorTypeId(row?.value)
  }

  const handleWholeRowClick = (row: any) => {
    console.log(row, ' row');
    setShowForm(row?.vendor_type?.code);
  }

  return (
    <div>
      <div className="max-w-12xl">
        <div className="border-b border-stroke py-4 dark:border-strokedark">
          <div className="grid grid-cols-3 gap-4">
            <div className="">
              <Controller
                name="code"
                control={control}
                rules={{ required: 'Vendor is required' }} 
                render={({ field }) => (
                  <ReactSelect
                    {...field}
                    options={vendorTypeOptions}
                    placeholder="Select a vendor..."
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
          {showForm === '' && (
            <div className={`col-span-2 ${showForm === '' ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    {actionLbl}
                  </h3>
                </div>
                <div className="px-4">
                  <CustomDatatable
                    apiLoading={false}
                    title="Branch List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataVendors || []}
                  />
                </div>
              </div>
            </div>
          )}


          {showForm === 'SUP' && (
            <div className={`col-span-2 ${showForm === 'SUP' ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <SupplierForm setShowForm={setShowForm} vendorTypeId={vendorTypeId} />
                {/* <VendorsForm setShowForm={setShowForm}/> */}
              </div>
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default VendorsList;