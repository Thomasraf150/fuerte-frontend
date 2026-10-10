import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React from "react";
import type { Metadata } from "next";
import './styles.css'; // Include your global styles
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import AppShell from "@/components/AppShell";
import { APP_NAME, TITLE_SEPARATOR } from "@/utils/appTitle";


// Brand theme 2026-10-05: Hanken Grotesk for the UI and body text (was Poppins), and
// Fraunces 600 for page titles and record names (Tailwind `font-display`).
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display',
});

/**
 * The tab title, everywhere: "{page} · Fuerte Lending" (page first, as WCAG's G88 advises and as
 * CHR does), so each tab and history entry says what it is. A page sets only its own part
 * (`metadata.title`, or useDocumentTitle on record pages, which name the record). This layout is
 * a Server Component for that reason: Next reads `metadata` from server modules only. It was a
 * Client Component with a hard-coded <title>, which every page's own title sat behind. The
 * favicon is app/icon.svg (the castle), picked up by file convention.
 */
export const metadata: Metadata = {
  title: {
    template: `%s${TITLE_SEPARATOR}${APP_NAME}`,
    default: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true} className={`${sans.variable} ${display.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
