"use client";

import type React from 'react';
import { useCallback } from 'react';
import { useRouter } from 'nextjs-toploader/app';

/** A click inside one of these, within the row, keeps its own behaviour: the row does not open. */
const OWN_CLICK = 'a, button, input, select, textarea, label, summary, [role="button"], [role="menuitem"]';
/** react-data-table-component renders each body row as `role="row" id="row-{keyField}"`. */
const ROW = '[role="row"][id^="row-"]';

type Handlers = Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'onAuxClick' | 'onMouseDown'>;

/** The body row the event landed in, unless it landed on an inner control of that row. */
function openableRow(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const row = target.closest(ROW);
  const own = target.closest(OWN_CLICK);
  return row && !(own && row.contains(own)) ? row : null;
}

/**
 * Whole-row open (`rowHref`), as handlers for the element around the table. Caught there, not
 * through onRowClicked, because react-data-table-component calls that only when the clicked
 * element itself carries its `data-tag="allowRowEvents"`, so a click on text inside a custom
 * `cell:` renderer never opened anything. A plain click navigates; Ctrl, Cmd or the middle
 * button opens a new tab; a click that ends a text selection, or lands on an inner link,
 * button, input, select, label or summary, is left alone. No handlers without `rowHref`.
 */
export function useRowOpen<T extends object>(rowHref: ((row: T) => string) | undefined, rows: T[]): Handlers {
  const router = useRouter();

  const open = useCallback((event: React.MouseEvent) => {
    const element = rowHref ? openableRow(event.target) : null;
    if (!rowHref || !element || window.getSelection()?.toString()) return;
    const id = element.id.slice('row-'.length);
    const row = rows.find((item) => String((item as { id?: unknown }).id) === id);
    if (!row) return;
    const href = rowHref(row);
    if (!href) {
      if (process.env.NODE_ENV !== 'production') console.warn('CustomDatatable: rowHref gave no link for a row', row);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.button === 1) window.open(href, '_blank', 'noopener');
    else router.push(href);
  }, [rowHref, rows, router]);

  if (!rowHref) return {};
  return {
    onClick: open,
    onAuxClick: (event) => { if (event.button === 1) open(event); },
    // Windows Chrome starts autoscroll on a middle press; on a row that opens a tab, it should not.
    onMouseDown: (event) => { if (event.button === 1 && openableRow(event.target)) event.preventDefault(); },
  };
}
