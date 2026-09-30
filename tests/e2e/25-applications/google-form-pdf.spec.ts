/**
 * The Google Form PDF reader's rules (answersFromLayout), on a fictional response. No browser.
 *
 * The fixture is the layout extractLayout produced from a real response printed in
 * Chrome, made fictional before it was committed; see googleFormFixture.ts. Each test
 * edits a fresh copy the way a different response would print: another option ticked,
 * an answer left blank, a longer answer.
 *
 *   PWTEST_HEADLESS=1 npx playwright test tests/e2e/25-applications/google-form-pdf.spec.ts --reporter=list
 */
import { test, expect } from '@playwright/test';
import { ROW_ABOVE, ROW_BELOW, answersFromLayout } from '../../../src/utils/googleFormPdf/answersFromLayout';
import { extractLayout } from '../../../src/utils/googleFormPdf/extractLayout';
import { MANY_RESPONSES_MESSAGE, NOT_A_FORM_MESSAGE } from '../../../src/utils/googleFormPdf/layout';
import type { FormAnswer, LayoutLine, PdfLayout } from '../../../src/utils/googleFormPdf/layout';
import {
  FIXTURE_ANSWERS, PURPLE, block, loadLayout, relabelDropdown, setDropdown, setTyped, tick, tickOther,
} from './googleFormFixture';
import { linesPdf, marksPdf } from './googleFormPdfFile';

const read = (layout: PdfLayout): FormAnswer[] => answersFromLayout(layout).answers;
const answersTo = (answers: FormAnswer[], question: string): string[] =>
  answers.filter((entry) => entry.question === question).map((entry) => entry.answer);

/** One text line holding one item, as extractLayout would give it. */
const textLine = (at: LayoutLine, y: number, text: string): LayoutLine => ({
  ...at,
  y,
  text,
  items: [{ x: at.x, text, size: at.size }],
});

const LOAN_PURPOSE = 'Para saan po ang loan?';
const REMARKS = 'May iba pa po ba kayong gustong sabihin sa amin?';
const BRANCH = 'Saang Fuerte branch po kayo mag-a-apply?';
const DROPDOWNS = [BRANCH, 'Reference 1 — Relasyon sa inyo', 'Reference 2 — Relasyon sa inyo'];

// Line pitches Google prints, fixed here rather than derived from the reader's constants,
// so a constant set too tight fails these tests.
/** A wrapped title's lines: 16px text on a 24px line, 18pt apart. */
const TITLE_LINE_PITCH = 18;
/** Lines of 11pt text (descriptions and bullets on the real print) are 15pt apart. */
const OPTION_LINE_PITCH = 15;

test('the fictional response reads as its answers, in form order, with nothing to report', () => {
  expect(answersFromLayout(loadLayout())).toEqual({ answers: FIXTURE_ANSWERS, problems: [] });
});

test('section headers, descriptions, the footer and unanswered questions are left out', () => {
  const answers = read(loadLayout());
  const questions = answers.map((entry) => entry.question);

  for (const header of ['Data Privacy Consent', 'Trabaho Ninyo', 'Requirements — Teacher / Government', 'Inyong Detalye', 'References']) {
    expect(questions).not.toContain(header);
  }
  // Asked twice each; only the factory and private-company block was answered.
  expect(answersTo(answers, 'Kumpleto na po ba ang mga ito?')).toEqual(['Opo, kumpleto na']);
  expect(answersTo(answers, 'Ilang taon ka na sa iyong trabaho')).toEqual(['4 na taon']);
  expect(answersTo(answers, 'Ano ang iyong work location')).toEqual(['Pasig City']);
  expect(answers.some((entry) => /endorsed by Google|^Forms$/.test(entry.answer))).toBe(false);
});

test("a teacher's response: the teacher block is read, and the unanswered factory block is not", () => {
  const layout = loadLayout();
  tick(layout, 'Saan ka nagtratrabaho?', 'Public school teacher');
  tick(layout, 'Kumpleto na po ba ang mga ito?', 'Opo, kumpleto na', 1);
  setTyped(layout, 'Ilang taon ka na sa iyong trabaho', '8 taon', 2);
  setTyped(layout, 'Ano ang iyong work location', 'Sample Elementary School', 2);
  // What a teacher never answers.
  setTyped(layout, 'Ano ang iyong posisyon', null);
  setTyped(layout, 'Ilang taon ka na sa iyong trabaho', null, 1);
  setTyped(layout, 'Ano ang iyong work location', null, 1);
  tick(layout, 'Kumpleto na po ba ang mga ito?', null, 2);
  setTyped(layout, 'Pangalan ng Kumpanya', null);

  const answers = read(layout);

  expect(answers.slice(0, 6)).toEqual([
    FIXTURE_ANSWERS[0],
    FIXTURE_ANSWERS[1],
    { question: 'Saan ka nagtratrabaho?', answer: 'Public school teacher o empleyado ng gobyerno' },
    { question: 'Kumpleto na po ba ang mga ito?', answer: 'Opo, kumpleto na' },
    { question: 'Ilang taon ka na sa iyong trabaho', answer: '8 taon' },
    { question: 'Ano ang iyong work location', answer: 'Sample Elementary School' },
  ]);
  // From "Buong pangalan" on, nothing changed.
  expect(answers.slice(6)).toEqual(FIXTURE_ANSWERS.slice(8));
});

test('a question the form asks twice keeps both answers, in order', () => {
  const layout = loadLayout();
  setTyped(layout, 'Ilang taon ka na sa iyong trabaho', '8 taon', 2);

  expect(answersTo(read(layout), 'Ilang taon ka na sa iyong trabaho')).toEqual(['4 na taon', '8 taon']);
});

test('a ticked "Other:" answers with the text typed beside it, or "Other" when nothing was typed', () => {
  const typed = loadLayout();
  tickOther(typed, LOAN_PURPOSE, 'Pambili ng tricycle');
  expect(answersTo(read(typed), LOAN_PURPOSE)).toEqual(['Pambili ng tricycle']);

  const bare = loadLayout();
  tick(bare, LOAN_PURPOSE, 'Other:');
  expect(answersTo(read(bare), LOAN_PURPOSE)).toEqual(['Other']);
});

test('an optional text question left blank is not sent', () => {
  const layout = loadLayout();
  setTyped(layout, 'Email address (Opsyonal)', null);

  expect(read(layout)).toEqual(FIXTURE_ANSWERS.filter((entry) => entry.question !== 'Email address (Opsyonal)'));
});

test('a typed answer over several lines keeps its line breaks', () => {
  const layout = loadLayout();
  setTyped(layout, REMARKS, 'Salamat po.\nTatawag po ako bukas ng umaga.');

  expect(answersTo(read(layout), REMARKS)).toEqual(['Salamat po.\nTatawag po ako bukas ng umaga.']);
});

test('a title that wraps onto a second line is one question', () => {
  const layout = loadLayout();
  const { title } = block(layout, REMARKS);
  Object.assign(title, textLine(title, title.y, 'May iba pa po ba kayong'));
  layout.lines.push(textLine(title, title.y + TITLE_LINE_PITCH, 'gustong sabihin sa amin?'));

  const answers = read(layout);

  expect(answersTo(answers, REMARKS)).toEqual(['Salamat po']);
  expect(answers.map((entry) => entry.question)).not.toContain('May iba pa po ba kayong');
});

test('a ticked option whose label wraps is read whole', () => {
  const layout = loadLayout();
  tick(layout, LOAN_PURPOSE, 'Pambayad sa ibang utang');
  const option = block(layout, LOAN_PURPOSE).lines.find((line) => line.text === 'Pambayad sa ibang utang');
  if (!option) throw new Error('fixture changed: no "Pambayad sa ibang utang" option');
  Object.assign(option, textLine(option, option.y, 'Pambayad sa'));
  layout.lines.push(textLine(option, option.y + OPTION_LINE_PITCH, 'ibang utang'));

  expect(answersTo(read(layout), LOAN_PURPOSE)).toEqual(['Pambayad sa ibang utang']);
});

test('two ticked options under one question are both kept, and reported', () => {
  const layout = loadLayout();
  tick(layout, LOAN_PURPOSE, 'Tuition');
  const medical = block(layout, LOAN_PURPOSE).lines.find((line) => line.text === 'Medical');
  const ring = medical && layout.marks.find((mark) => mark.page === medical.page && mark.y >= medical.y - ROW_ABOVE && mark.y <= medical.y + ROW_BELOW);
  if (!ring) throw new Error('fixture changed: no radio beside "Medical"');
  ring.colour = PURPLE;
  layout.marks.push({ ...ring });

  const reading = answersFromLayout(layout);

  expect(answersTo(reading.answers, LOAN_PURPOSE)).toEqual(['Tuition, Medical']);
  expect(reading.problems).toEqual([`More than one option is ticked under “${LOAN_PURPOSE}”; all of them were kept.`]);
});

test('a dropdown that still shows "Choose" is unanswered, with or without its "Dropdown" label', () => {
  const labelled = loadLayout();
  setDropdown(labelled, BRANCH, 'Choose');
  const unlabelled = loadLayout();
  setDropdown(unlabelled, BRANCH, 'Choose');
  relabelDropdown(unlabelled, BRANCH, null);
  const withoutBranch = FIXTURE_ANSWERS.filter((entry) => entry.question !== BRANCH);

  expect(read(labelled)).toEqual(withoutBranch);
  expect(read(unlabelled)).toEqual(withoutBranch);
});

test('a dropdown is read without the English "Dropdown" label, and no label joins the question', () => {
  const translated = loadLayout();
  const unlabelled = loadLayout();
  for (const question of DROPDOWNS) {
    relabelDropdown(translated, question, 'Lista desplegable');
    relabelDropdown(unlabelled, question, null);
  }

  expect(read(translated)).toEqual(FIXTURE_ANSWERS);
  expect(read(unlabelled)).toEqual(FIXTURE_ANSWERS);
});

test('a typed answer set in as far as x 58 is still read', () => {
  const layout = loadLayout();
  const name = block(layout, 'Buong pangalan').lines.find((line) => line.text === 'Juana Dela Cruz');
  if (!name) throw new Error('fixture changed: no typed name');
  Object.assign(name, { x: 57.5, items: [{ ...name.items[0], x: 57.5 }] });

  expect(answersTo(read(layout), 'Buong pangalan')).toEqual(['Juana Dela Cruz']);
});

test('a title padded with a huge run of spaces reads the same, and fast', () => {
  const layout = loadLayout();
  const { title } = block(layout, REMARKS);
  // A crafted PDF can put any text on a title line. The old `/\s*\*$/` backtracked on this for tens of seconds.
  const padded = `May iba pa po ba kayong${' '.repeat(200_000)}gustong sabihin sa amin?`;
  Object.assign(title, textLine(title, title.y, padded));

  const started = performance.now();
  const answers = read(layout);
  const took = performance.now() - started;

  expect(took, `took ${Math.round(took)}ms`).toBeLessThan(500);
  expect(answers).toEqual(FIXTURE_ANSWERS);
});

test('a PDF holding more than one response ("Print all responses") is refused, never merged', () => {
  const first = loadLayout();
  const second = loadLayout();
  const both: PdfLayout = {
    lines: [...first.lines, ...second.lines.map((line) => ({ ...line, page: line.page + 7 }))],
    marks: [...first.marks, ...second.marks.map((mark) => ({ ...mark, page: mark.page + 7 }))],
  };

  expect(() => answersFromLayout(both)).toThrow(MANY_RESPONSES_MESSAGE);
});

test.describe('extractLayout stops on a PDF far bigger than one response', () => {
  // The same legacy pdf.js build the browser loads, run here in Node: still no browser.
  const legacyPdfJs = () => import('pdfjs-dist/legacy/build/pdf.mjs');
  const EMPTY: PdfLayout = { lines: [], marks: [] };

  test('more than 5,000 text lines give an empty layout, 4,800 do not', async () => {
    const pdfjs = await legacyPdfJs();
    // Both under the 20-page limit, so only the line count differs.
    expect((await extractLayout(pdfjs, new Uint8Array(linesPdf(4_800)))).lines).toHaveLength(4_800);
    expect(await extractLayout(pdfjs, new Uint8Array(linesPdf(5_100)))).toEqual(EMPTY);
  });

  test('more than 2,000 marks give an empty layout, 1,900 do not', async () => {
    const pdfjs = await legacyPdfJs();
    expect((await extractLayout(pdfjs, new Uint8Array(marksPdf(1_900)))).marks).toHaveLength(1_900);
    expect(await extractLayout(pdfjs, new Uint8Array(marksPdf(2_100)))).toEqual(EMPTY);
  });
});

test('without a name or a mobile number it is not a Fuerte response', () => {
  for (const question of ['Buong pangalan', 'Mobile number']) {
    const layout = loadLayout();
    setTyped(layout, question, null);
    expect(() => answersFromLayout(layout), `with no answer to ${question}`).toThrow(NOT_A_FORM_MESSAGE);
  }
  expect(() => answersFromLayout({ lines: [], marks: [] })).toThrow(NOT_A_FORM_MESSAGE);

  const receipt: LayoutLine = { page: 1, x: 72, y: 96, size: 12, text: 'Official receipt no. 0001', items: [{ x: 72, text: 'Official receipt no. 0001', size: 12 }] };
  expect(() => answersFromLayout({ lines: [receipt], marks: [] })).toThrow(NOT_A_FORM_MESSAGE);
});
