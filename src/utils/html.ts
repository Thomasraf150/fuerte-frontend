/**
 * HTML escaping for the few places that build an HTML string by hand: SweetAlert2's `html` and
 * `title` options parse their string into the live DOM, so an event handler inside stored text
 * (a borrower name, an account name) would run in the viewer's session.
 *
 * Anything that is not a constant written in the source (stored or server text, user input)
 * goes through escapeHtml, or is interpolated with the `html` tag below, which escapes every
 * value for you.
 */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string);

/**
 * Tagged template that escapes every interpolated value; the literal parts are kept as markup.
 *
 *   html`You are reactivating "<strong>${account.account_name}</strong>"`
 *
 * null and undefined become an empty string. A value that is already markup must not be
 * interpolated here (it would show as text); build that part with this tag too and concatenate.
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings.reduce(
    (out, chunk, i) => out + chunk + (i < values.length ? escapeHtml(String(values[i] ?? '')) : ''),
    '',
  );
