import { MANY_RESPONSES_MESSAGE, NOT_A_FORM_MESSAGE } from './layout';
import type { FormAnswer, FormReading, LayoutItem, LayoutLine, LayoutMark, PdfLayout, Rgb } from './layout';

/*
 * PdfLayout → the answered questions, in form order. Pure: no pdf.js, no `@/` imports.
 *
 * The rules were measured on a Chrome print of a real response (Letter, 100% scale).
 * Sizes are font sizes in points; x is a line's left edge.
 *   Question title   12pt at x 45–56. A `*` item marks a required question, and a small
 *                    item right of x 400 names the question's type ("Dropdown"). Title lines
 *                    less than TITLE_WRAP_GAP apart are one wrapped title. Section headers
 *                    look the same but have no answer, so they drop out.
 *   Option           11pt lines at x 65–80 ("Other:" is 10.5pt). Ticked when two or more
 *                    marks sit on its row (the ring and its dot), or any of them is colourful.
 *   Typed answer     10.5pt lines at x 45–58. Several lines are one answer.
 *   Dropdown answer  the first 11pt line at x 55–65 under the title; "Choose" means none.
 *                    Read for a title labelled "Dropdown", and for any question with no
 *                    ticked option and nothing typed, so a label in another language works too.
 * Everything else (descriptions at x 42, the form's own title and description, the
 * footer) matches none of these and is skipped. The question list is never hardcoded:
 * the form keeps gaining questions, and older PDFs lack the newer ones.
 */

/**
 * Title lines less than this many points apart, on one page, are one wrapped title.
 * A wrapped title's lines are about 18pt apart (16px text on a 24px line), so the gap
 * must sit well above that; separate questions are 45pt apart or more.
 */
export const TITLE_WRAP_GAP = 30;
/** A mark is on an option's row when its centre is at most ROW_ABOVE points above the label's baseline… */
export const ROW_ABOVE = 9;
/** …and at most ROW_BELOW points below it. */
export const ROW_BELOW = 2;
/** Colour channels further apart than this make a mark colourful: a ticked radio is purple, an unticked one grey. */
export const COLOURFUL_SPREAD = 24;
/** A wrapped line of an option's label sits at most this many points below the line above it. */
export const OPTION_WRAP_GAP = 16;

interface Block {
  question: string;
  dropdown: boolean;
  lines: LayoutLine[];
}

const FOOTER = new Set(['This content is neither created nor endorsed by Google.', 'Forms']);
/** What a dropdown shows when nothing was chosen. */
const NO_CHOICE = 'Choose';
/** The two answers every response has, once: they identify the applicant. */
const IDENTITY = ['Buong pangalan', 'Mobile number'];

const between = (value: number, low: number, high: number): boolean => value >= low && value <= high;
const near = (value: number, target: number): boolean => Math.abs(value - target) <= 0.25;

const isTitle = (line: LayoutLine): boolean => between(line.size, 11.6, 12.4) && between(line.x, 45, 56);
const isTyped = (line: LayoutLine): boolean => near(line.size, 10.5) && between(line.x, 45, 58);
const isDropdownValue = (line: LayoutLine): boolean => near(line.size, 11) && between(line.x, 55, 65);
const isOption = (line: LayoutLine): boolean => between(line.size, 10.25, 11.25) && between(line.x, 65, 80);

/** The question-type label at the right of a title, in whatever language: smaller than the title, right of x 400. */
const isTypeLabel = (item: LayoutItem): boolean => item.x > 400 && item.size < 11.6;
const isDropdownLabel = (item: LayoutItem): boolean => isTypeLabel(item) && item.text === 'Dropdown';

/**
 * The title's words, without the `*` and the type label. Whitespace is collapsed before
 * the `*` is stripped, so every step stays linear: `/\s*\*$/` on a crafted run of
 * spaces backtracks quadratically (100k spaces took 10.8s on the main thread).
 */
function titleText(line: LayoutLine): string {
  const words = line.items.filter((item) => item.text !== '*' && !isTypeLabel(item)).map((item) => item.text);
  return words.join(' ').replace(/\s+/g, ' ').replace(/ ?\*$/, '').trim();
}

/** A title line less than TITLE_WRAP_GAP below the title line just before it, on the same page, continues that title. */
const continuesTitle = (line: LayoutLine, lastTitle: LayoutLine | null): boolean =>
  lastTitle !== null && isTitle(line) && line.page === lastTitle.page && line.y - lastTitle.y < TITLE_WRAP_GAP;

/** Each title with the lines under it, up to the next title, across page breaks. */
function splitBlocks(lines: LayoutLine[]): Block[] {
  const blocks: Block[] = [];
  let lastTitle: LayoutLine | null = null;
  for (const line of lines) {
    const block = blocks[blocks.length - 1];
    if (block && continuesTitle(line, lastTitle)) {
      block.question = `${block.question} ${titleText(line)}`.trim();
      block.dropdown = block.dropdown || line.items.some(isDropdownLabel);
    } else if (isTitle(line)) {
      blocks.push({ question: titleText(line), dropdown: line.items.some(isDropdownLabel), lines: [] });
    } else {
      // Lines before the first title are the form's own title and description.
      block?.lines.push(line);
    }
    lastTitle = isTitle(line) ? line : null;
  }
  return blocks;
}

const rowMarks = (line: LayoutLine, marks: LayoutMark[]): LayoutMark[] =>
  marks.filter((mark) => mark.page === line.page && between(mark.y, line.y - ROW_ABOVE, line.y + ROW_BELOW));

const isColourful = ([r, g, b]: Rgb): boolean => Math.max(r, g, b) - Math.min(r, g, b) > COLOURFUL_SPREAD;

function isTicked(line: LayoutLine, marks: LayoutMark[]): boolean {
  const row = rowMarks(line, marks);
  return row.length >= 2 || row.some((mark) => isColourful(mark.colour));
}

/** A ticked option's label, with any wrapped lines under it (same indent, no marks of their own). */
function optionText(option: LayoutLine, lines: LayoutLine[], marks: LayoutMark[]): string {
  // "Other:" answers with what was typed beside it.
  if (/^Other:/.test(option.text)) return option.text.replace(/^Other:\s*/, '').trim() || 'Other';
  const parts = [option.text];
  let previous = option;
  for (const line of lines.slice(lines.indexOf(option) + 1)) {
    const wrapped = isOption(line) && line.page === previous.page && line.y - previous.y <= OPTION_WRAP_GAP && !rowMarks(line, marks).length;
    if (!wrapped) break;
    parts.push(line.text);
    previous = line;
  }
  return parts.join(' ');
}

/** The dropdown's value, or '' while it still shows "Choose". */
function dropdownValue(block: Block): string {
  const value = block.lines.find(isDropdownValue)?.text ?? '';
  return value === NO_CHOICE ? '' : value;
}

function readBlock(block: Block, marks: LayoutMark[], problems: string[]): string {
  if (block.dropdown) return dropdownValue(block);
  const ticked = block.lines.filter((line) => isOption(line) && isTicked(line, marks));
  if (ticked.length > 1) problems.push(`More than one option is ticked under “${block.question}”; all of them were kept.`);
  if (ticked.length) return ticked.map((line) => optionText(line, block.lines, marks)).join(', ');
  // Nothing ticked and nothing typed: maybe a dropdown whose type label was not "Dropdown".
  return block.lines.filter(isTyped).map((line) => line.text).join('\n') || dropdownValue(block);
}

const normalized = (question: string): string => question.toLowerCase().replace(/\s+/g, ' ').trim();

/** Throws unless the name and the mobile number are each answered exactly once. */
function checkOneResponse(answers: FormAnswer[]): void {
  const counts = IDENTITY.map((question) => answers.filter((entry) => normalized(entry.question) === normalized(question)).length);
  if (counts.includes(0)) throw new Error(NOT_A_FORM_MESSAGE);
  // "Print all responses" puts several applicants in one PDF; they must never merge into one record.
  if (counts.some((count) => count > 1)) throw new Error(MANY_RESPONSES_MESSAGE);
}

/**
 * Every answered question, in order, duplicates included: the form asks some
 * questions once per branch of the form, and the backend keeps the first answer.
 * Throws NOT_A_FORM_MESSAGE unless the name and the mobile number are answered, and
 * MANY_RESPONSES_MESSAGE when either is answered more than once.
 */
export function answersFromLayout(layout: PdfLayout): FormReading {
  const problems: string[] = [];
  const answers: FormAnswer[] = [];
  const lines = layout.lines
    .filter((line) => !FOOTER.has(line.text))
    .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  for (const block of splitBlocks(lines)) {
    const answer = readBlock(block, layout.marks, problems).trim();
    if (block.question && answer) answers.push({ question: block.question, answer });
  }
  checkOneResponse(answers);
  return { answers, problems };
}
