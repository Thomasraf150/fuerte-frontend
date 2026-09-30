import React from 'react';

/*
 * Small pieces shared by the upload card and its paste box: controls drawn the way
 * staff see them on screen (a Google menu item, a print option, a key), and the
 * busy spinner inside a button, drawn in the button's text colour.
 */

const CHIP =
  'inline-block whitespace-nowrap rounded border border-stroke bg-white px-1.5 text-xs font-medium leading-5 text-black shadow-card-2 dark:border-strokedark dark:bg-boxdark dark:text-white';

/** One item of Google's menu path, drawn like the control staff will click. */
export const MenuStep: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className={CHIP}>{children}</span>;

/** A keyboard key, in the same chip. It keeps the page's font rather than the browser's monospace for <kbd>. */
export const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => <kbd className={`${CHIP} [font-family:inherit]`}>{children}</kbd>;

export const Spinner: React.FC = () => (
  <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
);
