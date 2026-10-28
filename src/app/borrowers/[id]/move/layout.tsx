import type { Metadata } from 'next';

// The page is a Client Component, which cannot export metadata, so its tab title lives here; the page then adds the borrower's name.
export const metadata: Metadata = { title: 'Move borrower' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
