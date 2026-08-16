import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ImportsList from './components/ImportsList';

export const metadata = {
  title: 'Imports | Fuerte',
};

/**
 * The general entrance to bulk imports: batch history + start-a-new-import.
 * Per-screen Import buttons (e.g. Payment Posting) are shortcuts into the
 * same flow; this page is where every batch — whoever started it — can be
 * found again, resumed, or reversed.
 */
export default function ImportsPage() {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Imports" />
      <ImportsList />
    </DefaultLayout>
  );
}
