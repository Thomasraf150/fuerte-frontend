/** One slot in the pager: a page number, or a gap drawn as an ellipsis. */
export type PageSlot = number | 'gap';

/**
 * The page buttons to draw: always page 1 and the last page, the current page with one
 * neighbour on each side, and a gap wherever pages are skipped. A gap that would hide a
 * single page shows that page instead, so "1 … 3" never happens.
 *
 *   pageWindow(1, 1)   → [1]
 *   pageWindow(5, 63)  → [1, 'gap', 4, 5, 6, 'gap', 63]
 *   pageWindow(3, 63)  → [1, 2, 3, 4, 'gap', 63]
 */
export function pageWindow(current: number, total: number): PageSlot[] {
  if (total <= 0) return [];
  const page = Math.min(Math.max(current, 1), total);
  const wanted = new Set([1, total, page - 1, page, page + 1]);
  const pages = Array.from(wanted).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const slots: PageSlot[] = [];
  pages.forEach((p, i) => {
    const previous = pages[i - 1];
    if (previous !== undefined && p - previous === 2) slots.push(previous + 1);
    else if (previous !== undefined && p - previous > 2) slots.push('gap');
    slots.push(p);
  });
  return slots;
}
