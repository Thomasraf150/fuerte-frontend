import React from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import CollectionSheet from '../components/CollectionSheet';

export const metadata = {
  title: 'Collection List',
  description: '',
};

/** One ATM collection list at its own URL, so refresh, Back and shared links all work. */
const CollectionListPage = ({ params }: { params: { id: string } }) => (
  <DefaultLayout>
    <div className="mx-auto atm-noprint">
      <Breadcrumb pageName="Collection List" />
    </div>
    <CollectionSheet id={params.id} />
  </DefaultLayout>
);

export default CollectionListPage;
