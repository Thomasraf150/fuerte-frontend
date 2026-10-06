/**
 * Fuerte brand colours (spec docs/superpowers/specs/2026-10-05-brand-theme-design.md), measured
 * from the public site. tailwind.config.ts reads these, so a Tailwind class (`bg-primary`) and a
 * colour a library needs as a hex string (SweetAlert, react-select, react-data-table) agree.
 *
 * Contrast (WCAG 2.x): white text on `primary` 5.88:1, on `success` 5.77:1, on `danger` 5.91:1;
 * `body` text on `cream` 5.06:1 and on white 5.81:1.
 */
export const BRAND = {
  /** Olive: buttons, links, the active tab. */
  primary: "#5A6B2C",
  /** Gold, the castle in the logo: used sparingly (the sidebar's active marker). */
  accent: "#E3A92E",
  /** Ink: headings, the sidebar, the darkest text. */
  ink: "#28261A",
  /** The page ground. */
  cream: "#F4EFE1",
  /** Muted text, warm grey. */
  body: "#6B6553",
  /** Hairline borders on white and cream. */
  stroke: "#E4DED0",
  success: "#2B7344",
  danger: "#B5372F",
} as const;

/** SweetAlert button colours: Approve and Reject prompts, and the app's generic confirm. */
export const CONFIRM_COLORS = {
  approve: BRAND.success,
  reject: BRAND.danger,
  confirm: BRAND.primary,
  cancel: BRAND.body,
} as const;
