import React, { Suspense } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import SearchResults from './SearchResults';

export const metadata = {
  title: 'Search',
  description: 'Search borrowers, loans and vouchers',
};

/** The universal search's results (the top bar's search box lands here with ?q=). */
const SearchPage: React.FC = () => (
  <DefaultLayout>
    <div className="mx-auto max-w-4xl">
      <Breadcrumb pageName="Search" />
      {/* useSearchParams needs a Suspense boundary in the app router. */}
      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </div>
  </DefaultLayout>
);

export default SearchPage;
