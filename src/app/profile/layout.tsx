import type { Metadata } from 'next';

// The page is a Client Component, which cannot export metadata, so its tab title lives here.
export const metadata: Metadata = { title: 'My Profile' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
