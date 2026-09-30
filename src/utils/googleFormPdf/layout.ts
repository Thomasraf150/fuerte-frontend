/**
 * The Google Form response PDF, as the reader sees it.
 *
 * `extractLayout` fills a PdfLayout from the PDF with pdf.js; `answersFromLayout`
 * reads the answers out of it. Positions are PDF points measured from the top-left
 * corner of the page. A line's `y` is its text baseline; a mark's `y` is its centre.
 *
 * This file and answersFromLayout.ts import nothing from pdf.js or `@/`, so the
 * Playwright tests can import them directly.
 */

export interface LayoutItem {
  x: number;
  text: string;
  size: number;
}

/** Text items of one page that share a baseline (within 2pt), left to right. */
export interface LayoutLine {
  page: number;
  /** The left-most item's x. */
  x: number;
  y: number;
  /** Font size of the left-most item. */
  size: number;
  text: string;
  items: LayoutItem[];
}

export type Rgb = [number, number, number];

/** A small painted shape left of the option labels: a radio ring, its dot, or a bullet. */
export interface LayoutMark {
  page: number;
  x: number;
  y: number;
  colour: Rgb;
}

export interface PdfLayout {
  lines: LayoutLine[];
  marks: LayoutMark[];
}

export interface FormAnswer {
  question: string;
  answer: string;
}

export interface FormReading {
  answers: FormAnswer[];
  /** What the reader met but could not classify. Question titles only, never answers. */
  problems: string[];
}

/** Shown when a PDF has no name or mobile number answer. */
export const NOT_A_FORM_MESSAGE =
  "This PDF doesn't look like a Fuerte Google Form response. Print the response from Google Forms in Chrome or Edge, or paste the row from the Sheet instead.";

/** Shown when a PDF answers the name or the mobile number more than once: "Print all responses". */
export const MANY_RESPONSES_MESSAGE =
  'This PDF holds more than one response. Print one response at a time (not "Print all responses"), or upload the Google Forms download instead.';
