import type { Metadata } from 'next';

// The page is a Client Component, which cannot export metadata, so its tab title lives here; the page
// names the employer with useDocumentTitle once it loads.
export const metadata: Metadata = { title: 'Employer' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
