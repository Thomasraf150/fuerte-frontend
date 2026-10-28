import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import '../styles.css';
import NewVoucher from '../components/NewVoucher';

type Props = { searchParams: { type?: string } };

// ?type=jv opens a Journal Voucher; anything else a Check Voucher.
const voucherType = (searchParams: Props['searchParams']) => (searchParams?.type === 'jv' ? 'jv' : 'cv');

export function generateMetadata({ searchParams }: Props) {
  return { title: voucherType(searchParams) === 'jv' ? 'New Journal Voucher' : 'New Check Voucher' };
}

const NewGeneralVoucher = ({ searchParams }: Props) => (
  <DefaultLayout>
    <NewVoucher type={voucherType(searchParams)} />
  </DefaultLayout>
);

export default NewGeneralVoucher;
