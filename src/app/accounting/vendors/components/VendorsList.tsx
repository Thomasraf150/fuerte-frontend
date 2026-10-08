"use client";

import Button from '@/components/Button';
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
import { Card, CardBody, CardHeader, Toolbar } from '@/components/Card';

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
      dataDepartments } = useVendor();
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
        <Card className="mb-4">
          <CardBody>
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
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {!showForm && (
            <div className={`col-span-2 ${!showForm ? 'fade-in' : 'fade-out'}`}>
              <Card>
                {actionLbl && <CardHeader title={actionLbl} />}
                <CardBody>
                  <Toolbar>
                    <Button variant="primary"
                      onClick={() => handleCreateVendor(true)}>
                      <GitBranch  size={14} /> 
                      <span>Create</span>
                    </Button>
                  </Toolbar>
                  <CustomDatatable
                    apiLoading={false}
                    title="Branch List"
                    onRowClicked={handleWholeRowClick}
                    columns={column()}
                    data={dataVendors || []}
                  />
                </CardBody>
              </Card>
            </div>
          )}


          {formType === 'Supplier' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <SupplierForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    loading={loading}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataSupplierCat={dataSupplierCat} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}
          {formType === 'Nontrade' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <NontradeForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}
          {formType === 'Customer' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <CustomerForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataCustCat={dataCustCat} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}
          {formType === 'Employee' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <EmployeeForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor}
                    dataDepartments={dataDepartments} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}
          {formType === 'Officer' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <OfficerForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}
          {formType === 'Affiliate' && (
            showForm && (
              <div className={`col-span-2 ${showForm ? 'fade-in' : 'fade-out'}`}>
                <Card><CardBody>
                  <AffiliateForm
                    setShowForm={setShowForm}
                    vendorTypeId={vendorTypeId}
                    fetchVendors={fetchVendors}
                    vendorLoading={loading}
                    singleData={singleData}
                    createVendor={createVendor} />
                  {/* <VendorsForm setShowForm={setShowForm}/> */}
                </CardBody></Card>
              </div>
            )
          )}

          
        </div>
      </div>
    </div>
  );
};

export default VendorsList;