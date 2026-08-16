import Link from 'next/link';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ImportReview from './components/ImportReview';

export const metadata = {
  title: 'Import review | Fuerte',
};

export default function ImportBatchPage({ params }: { params: { batchRef: string } }) {
  return (
    <DefaultLayout>
      {/* A batch is always reached THROUGH the batch history, so the trail says so.
          The back link repeats that jump as a thumb-sized target — breadcrumb text
          is too small to tap reliably on the office's budget Android phones. */}
      <Breadcrumb
        pageName="Import review"
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Imports', href: '/imports' },
          { label: 'Import review' },
        ]}
      />

      <div className="mb-4">
        <Link
          href="/imports"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-opacity-80"
        >
          <span aria-hidden>←</span> Back to Imports
        </Link>
      </div>

      <ImportReview batchRef={params.batchRef} />
    </DefaultLayout>
  );
}
