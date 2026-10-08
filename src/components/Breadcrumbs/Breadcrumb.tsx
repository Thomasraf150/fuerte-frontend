import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageName: string;
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ pageName, items }: BreadcrumbProps) => {
  // Use custom items if provided, otherwise use legacy two-level behavior
  const breadcrumbItems = items || [
    { label: 'Dashboard', href: '/' },
    { label: pageName }
  ];

  return (
    <div className="mb-6 sm:mb-7">
      {/* Breadcrumb Navigation - Above title for better UX */}
      <nav aria-label="Breadcrumb" className="mb-2">
        <ol className="flex flex-wrap items-center gap-1 text-[13px]">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <li key={index} className="flex min-w-0 items-center">
                {item.href && !isLast ? (
                  <>
                    <Link
                      // text-body, not bodydark2: bodydark2 is the sidebar's muted grey and only 2.4:1 on the
                      // cream page ground; body is 5.06:1 there (AA). bodydark keeps it readable in dark mode.
                      className="font-medium text-body hover:text-primary transition-colors dark:text-bodydark"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                    <span className="mx-1 text-body dark:text-bodydark" aria-hidden="true">/</span>
                  </>
                ) : (
                  <span className="break-words font-medium text-primary">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Page title: Fraunces, the brand's display face, large and tight (Phase 7, 2026-10-07). */}
      <h2 className="break-words font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-black sm:text-[32px] dark:text-white">
        {pageName}
      </h2>
    </div>
  );
};

export default Breadcrumb;
