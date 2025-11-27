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
    <div className="mb-6">
      {/* Breadcrumb Navigation - Above title for better UX */}
      <nav aria-label="Breadcrumb" className="mb-2">
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <li key={index} className="flex items-center">
                {item.href && !isLast ? (
                  <>
                    <Link
                      className="font-medium text-bodydark2 hover:text-primary transition-colors"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                    <span className="mx-1 text-bodydark2">/</span>
                  </>
                ) : (
                  <span className="font-medium text-primary">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Page Title - Full width below breadcrumbs */}
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {pageName}
      </h2>
    </div>
  );
};

export default Breadcrumb;
