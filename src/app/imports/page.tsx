import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import ImportsList from './components/ImportsList';

export const metadata = {
  title: 'Imports | Fuerte',
};

/**
 * The general entrance to bulk imports: batch history + start-a-new-import.
 * One destination rather than a button per screen: staff learn a single
 * habit, and every batch — whoever started it — can be found again here,
 * resumed by URL, or reversed.
 */
export default function ImportsPage() {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Imports" />
      <ImportsList />
    </DefaultLayout>
  );
}
