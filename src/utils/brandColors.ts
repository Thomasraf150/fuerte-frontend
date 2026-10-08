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
  /** Gold dark enough for TEXT on white (5.42:1); `accent` itself is 2.1:1 there, fine for marks only. */
  accentText: "#8A6312",
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

/**
 * The olive scale around `primary` (600). tailwind.config.ts gives it as `olive`, and ALSO as
 * `blue` and `cyan` (Phase 4, 2026-10-06): about 300 hard-coded TailAdmin-era `blue-*` / `cyan-*`
 * classes (links, focus rings, info boxes, list icons, the Chart of Accounts level shading)
 * re-skin from this one place instead of from ~100 files, and keep their relative weight.
 * A colour that must stay a DISTINCT hue next to green (the FA branch badge, the imports
 * "Checked" pill) uses `sky-*`, which is not re-pointed.
 *
 * Contrast: white text on 500 4.77:1 and on 600 5.88:1; 400 is 3.18:1 on white (icons only) and
 * takes ink text at 4.78:1 (the Chart of Accounts level-3 rows).
 */
export const OLIVE = {
  50: "#F5F7EC",
  100: "#E9EDD6",
  200: "#D3DBAE",
  300: "#B4C07E",
  400: "#879845",
  500: "#677A31",
  600: BRAND.primary,
  700: "#4B5925",
  800: "#3C471E",
  900: "#2E3617",
  950: "#1E2410",
} as const;
