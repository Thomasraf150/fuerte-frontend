"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";

interface Props {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** 1 … (c-1) c (c+1) … last — collapses to a flat list when there are few pages. */
function pageRange(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < last - 1) pages.push("ellipsis");
  pages.push(last);

  return pages;
}

const ApprovalsPager: React.FC<Props> = ({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  disabled = false,
}) => {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const go = (page: number) => {
    if (disabled || page < 1 || page > lastPage || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <nav className="appr-pager" aria-label="Decisions pagination">
      <span className="appr-pager-range">
        Showing {from}–{to} of {total}
      </span>

      <div className="appr-pager-controls">
        <button
          type="button"
          className="appr-pager-btn"
          onClick={() => go(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="appr-pager-btn-label">Prev</span>
        </button>

        {pageRange(currentPage, lastPage).map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="appr-pager-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`appr-pager-page ${p === currentPage ? "is-active" : ""}`}
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="appr-pager-btn"
          onClick={() => go(currentPage + 1)}
          disabled={disabled || currentPage >= lastPage}
          aria-label="Next page"
        >
          <span className="appr-pager-btn-label">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export default ApprovalsPager;
