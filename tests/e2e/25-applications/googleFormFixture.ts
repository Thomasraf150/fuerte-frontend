/**
 * The fictional Google Form response layout the PDF reader is tested on, and small edits to it.
 *
 * fixtures/google-form-layout.json began as what extractLayout returned for a real
 * response (a Chrome print, 7 pages). Before it was committed, and on the dev machine
 * only, every answer the applicant gave was replaced with a fictional value, the ticks
 * were moved to other options, and a check confirmed that none of the original answers
 * was left. What remains of the original are the form's own words (question titles,
 * option labels, section headers, descriptions) and their positions on the page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROW_ABOVE, ROW_BELOW } from '../../../src/utils/googleFormPdf/answersFromLayout';
import type { FormAnswer, LayoutLine, PdfLayout, Rgb } from '../../../src/utils/googleFormPdf/layout';

/** The ring colours Chrome prints: unticked, and ticked (the ring and its dot). */
export const GREY: Rgb = [154, 160, 166];
export const PURPLE: Rgb = [87, 70, 227];

/** What answersFromLayout reads from the fixture, in form order. All fictional. */
export const FIXTURE_ANSWERS: FormAnswer[] = [
  { question: 'Saang Fuerte branch po kayo mag-a-apply?', answer: 'Sample Town, Rizal' },
  { question: 'Pahintulot', answer: 'Nabasa ko po at sumasang-ayon ako' },
  { question: 'Saan ka nagtratrabaho?', answer: 'Empleyado sa pribadong kompanya' },
  { question: 'Ano ang iyong posisyon', answer: 'Accounting Clerk' },
  { question: 'Ilang taon ka na sa iyong trabaho', answer: '4 na taon' },
  { question: 'Ano ang iyong work location', answer: 'Pasig City' },
  { question: 'Kumpleto na po ba ang mga ito?', answer: 'Opo, kumpleto na' },
  { question: 'Pangalan ng Kumpanya', answer: 'Sample Trading Corp.' },
  { question: 'Buong pangalan', answer: 'Juana Dela Cruz' },
  { question: 'Mobile number', answer: '09170000123' },
  { question: 'Facebook profile name o link', answer: 'Juana DC Sample' },
  { question: 'Email address (Opsyonal)', answer: 'juana.delacruz@example.test' },
  { question: 'Magkano po ang gusto ninyong hiramin?', answer: '20000' },
  { question: 'Para saan po ang loan?', answer: 'Pagpapaayos ng bahay' },
  { question: 'May iba pa po ba kayong gustong sabihin sa amin?', answer: 'Salamat po' },
  { question: 'References 1 (Kamag anak) - Buong Pangalan', answer: 'Pedro Dela Cruz' },
  { question: 'References 1 (Kamag anak) - Mobile Numbers', answer: '09170000456' },
  { question: 'Reference 1 — Relasyon sa inyo', answer: 'Kapatid' },
  { question: 'References 2 (Kamag anak) - Buong Pangalan', answer: 'Maria Santos' },
  { question: 'References 2 (Kamag anak) - Mobile Numbers', answer: '09170000789' },
  { question: 'Reference 2 — Relasyon sa inyo', answer: 'Pinsan' },
  { question: 'References 3 - Buong Pangalan', answer: 'Jose Reyes' },
  { question: 'References 3 - Mobile Numbers', answer: '09180000321' },
  { question: 'Reference 3 — Posisyon o relasyon sa trabaho', answer: 'Supervisor' },
];

/** A fresh copy of the fixture: every test edits its own. */
export function loadLayout(): PdfLayout {
  const file = path.join(__dirname, 'fixtures', 'google-form-layout.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as PdfLayout;
}

// Deliberately simpler than the reader's rules, so a wrong rule cannot hide behind a
// helper built on it: these only find lines in this fixture, where every typed answer
// sits at x 47.25, every dropdown value at x 59.25 and every option at x 71.25.
const isTitleLike = (line: LayoutLine): boolean => Math.abs(line.size - 12) < 0.5 && line.x >= 45 && line.x <= 56;
const isOptionLike = (line: LayoutLine): boolean => line.x >= 65 && line.x <= 80;
const isTypedLike = (line: LayoutLine): boolean => Math.abs(line.size - 10.5) < 0.3 && line.x >= 45 && line.x <= 52;
const isDropdownValueLike = (line: LayoutLine): boolean => Math.abs(line.size - 11) < 0.3 && line.x > 55 && line.x < 65;
/** The type label ("Dropdown") sits right of x 400 on a title line. */
const isTypeLabelLike = (text: string, x: number): boolean => x > 400 && text !== '*';
const titleOf = (line: LayoutLine): string =>
  line.items.filter((item) => item.text !== '*' && !isTypeLabelLike(item.text, item.x)).map((item) => item.text).join(' ');

/** The `occurrence`-th title that reads `question`, and the lines under it up to the next title. */
export function block(layout: PdfLayout, question: string, occurrence = 1): { title: LayoutLine; lines: LayoutLine[] } {
  const lines = [...layout.lines].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const starts = lines.flatMap((line, index) => (isTitleLike(line) && titleOf(line) === question ? [index] : []));
  const start = starts[occurrence - 1];
  if (start === undefined) throw new Error(`No question "${question}" (#${occurrence}) in the layout`);
  const next = lines.findIndex((line, index) => index > start && isTitleLike(line));
  return { title: lines[start], lines: lines.slice(start + 1, next === -1 ? undefined : next) };
}

/** Redraws an option's radio: a purple ring and dot when ticked, a grey ring when not. */
function setRadio(layout: PdfLayout, line: LayoutLine, ticked: boolean): void {
  const row = layout.marks.filter((mark) => mark.page === line.page && mark.y >= line.y - ROW_ABOVE && mark.y <= line.y + ROW_BELOW);
  if (!row.length) throw new Error(`No radio beside "${line.text}"`);
  const ring = { page: row[0].page, x: row[0].x, y: row[0].y, colour: ticked ? PURPLE : GREY };
  layout.marks = layout.marks.filter((mark) => !row.includes(mark)).concat(ticked ? [ring, { ...ring }] : [ring]);
}

/** Ticks the option whose label starts with `option`, and unticks the others. `null` unticks them all. */
export function tick(layout: PdfLayout, question: string, option: string | null, occurrence = 1): void {
  const options = block(layout, question, occurrence).lines.filter(isOptionLike);
  if (option !== null && !options.some((line) => line.text.startsWith(option))) {
    throw new Error(`No option "${option}" under "${question}"`);
  }
  for (const line of options) setRadio(layout, line, option !== null && line.text.startsWith(option));
}

/** Ticks "Other:" and types `text` beside it, as a separate item on the same line. */
export function tickOther(layout: PdfLayout, question: string, text: string, occurrence = 1): void {
  tick(layout, question, 'Other:', occurrence);
  const other = block(layout, question, occurrence).lines.find((line) => line.text.startsWith('Other:'));
  if (!other) throw new Error(`No "Other:" under "${question}"`);
  other.items = [other.items[0], { x: other.x + 40, text, size: other.size }];
  other.text = `Other: ${text}`;
}

/** Sets what a dropdown shows under its title: a value, or "Choose" when nothing was chosen. */
export function setDropdown(layout: PdfLayout, question: string, value: string): void {
  const line = block(layout, question).lines.find(isDropdownValueLike);
  if (!line) throw new Error(`No dropdown value under "${question}"`);
  line.text = value;
  line.items = [{ x: line.x, text: value, size: line.size }];
}

/** Replaces the type label ("Dropdown") on a question's title line with another word, or removes it (`null`). */
export function relabelDropdown(layout: PdfLayout, question: string, label: string | null): void {
  const { title } = block(layout, question);
  const at = title.items.findIndex((item) => isTypeLabelLike(item.text, item.x));
  if (at === -1) throw new Error(`No type label on "${question}"`);
  if (label === null) title.items.splice(at, 1);
  else title.items[at] = { ...title.items[at], text: label };
  title.text = title.items.map((item) => item.text).join(' ');
}

/** Replaces the typed answer under a question. `null` leaves it unanswered; "\n" writes several lines. */
export function setTyped(layout: PdfLayout, question: string, text: string | null, occurrence = 1): void {
  const { title, lines } = block(layout, question, occurrence);
  const old = lines.filter(isTypedLike);
  const top = old[0]?.y ?? title.y + 27.75;
  layout.lines = layout.lines.filter((line) => !old.includes(line));
  (text === null ? [] : text.split('\n')).forEach((part, index) => {
    const y = top + index * 15;
    layout.lines.push({ page: title.page, x: 47.25, y, size: 10.5, text: part, items: [{ x: 47.25, text: part, size: 10.5 }] });
  });
}
