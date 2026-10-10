import type { Metadata } from 'next';

// The page is a Client Component, which cannot export metadata, so its tab title lives here. Record pages then name the record with useDocumentTitle once it loads; this is the fallback.
export const metadata: Metadata = { title: 'Collection Entry' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
