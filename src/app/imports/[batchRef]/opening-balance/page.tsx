import Link from 'next/link';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import OpeningBalancePreview from './components/OpeningBalancePreview';

export const metadata = {
  title: 'Opening balance | Fuerte',
};

/**
 * Nested under the batch, not a sibling top-level page: an opening balance only
 * means anything for one specific committed legacy-loans batch, and it is
 * reached from that batch's review screen. Auth comes from DefaultLayout, which
 * is wrapped in withAuth.
 */
export default function OpeningBalancePage({ params }: { params: { batchRef: string } }) {
  return (
    <DefaultLayout>
      <Breadcrumb
        pageName="Opening balance"
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Imports', href: '/imports' },
          { label: 'Import review', href: `/imports/${params.batchRef}` },
          { label: 'Opening balance' },
        ]}
      />

      {/* Repeats the breadcrumb jump as a thumb-sized target — breadcrumb text
          is too small to tap on the office's budget Android phones. */}
      <div className="mb-4">
        <Link
          href={`/imports/${params.batchRef}`}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-opacity-80"
        >
          <span aria-hidden>←</span> Back to the import
        </Link>
      </div>

      <OpeningBalancePreview batchRef={params.batchRef} />
    </DefaultLayout>
  );
}
