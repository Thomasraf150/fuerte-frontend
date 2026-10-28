"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import Button from '@/components/Button';
import ErrorAlert from '@/components/ErrorAlert';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { Card, CardBody } from '@/components/Card';
import { SkeletonBlock } from '@/components/LoadingStates';
import useVendor from '@/hooks/useVendor';
import VendorQueryMutations from '@/graphql/VendorQueryMutations';
import { graphqlFetch } from '@/utils/graphqlFetch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RowVendorsData } from '@/utils/DataTypes';
import SupplierForm from './Forms/SupplierForm';
import NontradeForm from './Forms/NontradeForm';
import CustomerForm from './Forms/CustomerForm';
import EmployeeForm from './Forms/EmployeeForm';
import OfficerForm from './Forms/OfficerForm';
import AffiliateForm from './Forms/AffiliateForm';

export const VENDORS_PATH = '/accounting/vendors';
export const vendorListPath = (typeId?: string) => (typeId ? `${VENDORS_PATH}?type=${typeId}` : VENDORS_PATH);

/**
 * A vendor's form on its own URL: `/new?type=<vendor type id>` to create one, `/<vendor id>` to
 * edit one, so Back, refresh and a pasted link all land on the same form. The vendor is read by
 * the URL's id from getVendors (vendors are not branch-scoped), never from the clicked list row.
 */
const VendorFormPage: React.FC<{ typeId?: string; vendorId?: string }> = ({ typeId, vendorId }) => {
  const router = useRouter();
  const isEdit = vendorId !== undefined;
  const { dataVendorType, fetchVendors, createVendor, loading, dataCustCat, dataSupplierCat, dataDepartments } = useVendor();
  const [vendor, setVendor] = useState<RowVendorsData>();
  const [vendorLoading, setVendorLoading] = useState<boolean>(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        // No type filter: every live vendor, as the Check Voucher payee picker loads them.
        const result = await graphqlFetch(VendorQueryMutations.GET_VENDOR_LIST_QUERY, { input: { vendor_type_id: '' } });
        if (result.errors) throw new Error(result.errors[0]?.message || 'Failed to load the vendor');
        const found = (result.data?.getVendors ?? []).find((v: RowVendorsData) => String(v.id) === vendorId);
        if (!found) throw new Error('That vendor does not exist.');
        setVendor(found);
      } catch (err: any) {
        console.warn('Vendor failed to load', { vendor_id: vendorId, error: err });
        setError(err?.message || 'Failed to load the vendor');
      } finally {
        setVendorLoading(false);
      }
    })();
  }, [vendorId]);

  const vendorTypeId = isEdit ? (vendor?.vendor_type_id ? String(vendor.vendor_type_id) : '') : (typeId ?? '');
  const typeName = isEdit
    ? vendor?.vendor_type?.name
    : dataVendorType?.find(t => String(t.id) === vendorTypeId)?.name;
  const typesLoaded = Array.isArray(dataVendorType);
  const missingType = !isEdit && typesLoaded && !typeName;
  useDocumentTitle(vendor?.name, 'Vendors');

  const backToList = (show: boolean) => {
    if (!show) router.push(vendorListPath(vendorTypeId));
  };

  const shared = { setShowForm: backToList, vendorTypeId, fetchVendors, createVendor, vendorLoading: loading, singleData: vendor };
  const forms: Record<string, React.ReactNode> = {
    Supplier: <SupplierForm {...shared} loading={loading} dataSupplierCat={dataSupplierCat} />,
    Nontrade: <NontradeForm {...shared} />,
    Customer: <CustomerForm {...shared} dataCustCat={dataCustCat} />,
    Employee: <EmployeeForm {...shared} dataDepartments={dataDepartments} />,
    Officer: <OfficerForm {...shared} />,
    Affiliate: <AffiliateForm {...shared} />,
  };

  const failure = error ?? (missingType ? 'Pick a vendor type on the Vendors list first.' : null);
  const waiting = vendorLoading || (!isEdit && !typesLoaded);
  const label = isEdit ? (vendor?.name ?? '') : `New ${typeName ?? 'vendor'}`;

  return (
    <>
      <div className="mx-auto">
        <Breadcrumb
          pageName="Vendors"
          loading={waiting}
          items={[
            { label: 'Dashboard', href: '/' },
            { label: 'Vendors', href: vendorListPath(vendorTypeId) },
            { label: failure ? 'Error' : label },
          ]}
        />
      </div>
      <div className="max-w-12xl">
        <div className="fade-in">
          {waiting ? (
            <Card className="p-6">
              <SkeletonBlock rows={5} label="Loading the vendor…" />
            </Card>
          ) : failure || !typeName || !forms[typeName] ? (
            <Card className="p-10">
              <div className="space-y-4 text-left">
                <ErrorAlert title="This vendor form didn't open." detail={failure ?? `Unknown vendor type: ${typeName ?? 'none'}`} />
                <Button variant="primary" onClick={() => backToList(false)}>
                  Back to Vendors
                </Button>
              </div>
            </Card>
          ) : (
            <Card><CardBody>{forms[typeName]}</CardBody></Card>
          )}
        </div>
      </div>
    </>
  );
};

export default VendorFormPage;
