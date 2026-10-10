import { useEffect } from "react";
import type React from "react";

/**
 * Shared by the "More ▾" menus (borrower page, loan page): a native <details> that Escape and a
 * click outside close, which <details> does not do by itself. Moved verbatim from BorrowerMoreMenu.
 */

/** Close a <details>; with `returnFocus`, put the focus back on its summary. */
export const closeDetails = (details: HTMLDetailsElement | null, returnFocus: boolean): void => {
  if (!details) return;
  details.open = false;
  if (returnFocus) details.querySelector("summary")?.focus();
};

/**
 * Escape and a click outside close an open <details>, which does neither by itself. Escape hands
 * the focus back to More only when it was inside the menu; elsewhere (an open picker in the form,
 * say) it just closes the menu and leaves the focus where it is.
 *
 * The listeners stay on for the menu's life and read details.open when the event arrives. They
 * used to wait for React state set from the toggle event, which the browser fires a task later,
 * so an Escape pressed right after opening reached no listener (seen as a flaky e2e, 2026-10-06).
 */
export const useDismissDetails = (menu: React.RefObject<HTMLDetailsElement>): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !menu.current?.open) return;
      closeDetails(menu.current, !!menu.current?.contains(document.activeElement));
    };
    const onPointerDown = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) closeDetails(menu.current, false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menu]);
};
