"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import CustomDatatable from '@/components/CustomDatatable';
import VendorsForm from './Forms/VendorsForm';
import SupplierForm from './Forms/SupplierForm';
import NontradeForm from './Forms/NontradeForm';
import CustomerForm from './Forms/CustomerForm';
import EmployeeForm from './Forms/EmployeeForm';
import OfficerForm from './Forms/OfficerForm';
import AffiliateForm from './Forms/AffiliateForm';
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
  const { control: SelectControl } = useForm<any>();
  const { register, handleSubmit, setValue, reset, watch, formState: { errors }, control } = useForm<RowVendorsData>();
  const [actionLbl, setActionLbl] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formType, setFormType] = useState<string>('');
  const [singleData, setSingleData] = useState<RowVendorsData | undefined>();
  const [vendorTypeId, setVendorTypeId] = useState<string>('');
  const {
      dataVendorType,
      fetchVendors,
      dataVendors,
      createVendor,
      loading,
      dataCustCat,
      dataSupplierCat,
      dataDepartments,
      vendorLoading } = useVendor();
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
    setVendorTypeId(row?.value);
    setFormType(row?.label);
    setSingleData(undefined);
  }

  const handleWholeRowClick = (row: any) => {
    setFormType(row?.vendor_type?.name);
    setShowForm(true);
    setSingleData(row);
  }

  const handleCreateVendor = (b: boolean) => {
    setShowForm(b);
    setSingleData(undefined);
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
          {!showForm && (
            <div className={`col-span-2 ${!showForm ? 'fade-in' : 'fade-out'}`}>
              <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
                  <h3 className="font-medium text-boxdark dark:text-boxdark">
                    {actionLbl}
                  </h3>
                </div>
                <div className="p-5">
                  <button 
                    className="bg-purple-700 text-white py-2 px-4 mb-4 rounded hover:bg-purple-800 flex items-center space-x-2"
                    onClick={() => handleCreateVendor(true)}>
                    <GitBranch  size={14} /> 
                    <span>Create</span>
                  </button>
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


          {formType === 'Supplier' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <SupplierForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    loading={loading}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataSupplierCat={dataSupplierCat}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}
          {formType === 'Nontrade' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <NontradeForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    singleData={singleData}
                    createVendor={createVendor}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}
          {formType === 'Customer' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <CustomerForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataCustCat={dataCustCat}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}
          {formType === 'Employee' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <EmployeeForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataDepartments={dataDepartments}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}
          {formType === 'Officer' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <OfficerForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    singleData={singleData}
                    createVendor={createVendor}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}
          {formType === 'Affiliate' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <div className="rounded-sm border p-4 px-5 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-2">
                  <AffiliateForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    singleData={singleData}
                    createVendor={createVendor}
                    vendorLoading={vendorLoading} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </div>
              </div>
            )
          )}

          
        </div>
      </div>
    </div>
  );
};

export default VendorsList;