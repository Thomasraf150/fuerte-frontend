/**
 * Draws a PdfLayout back into a real PDF with jsPDF, so the browser's reader can be
 * driven end to end without a real response. Text goes at the same positions and
 * sizes; each option gets a grey ring, and a ticked one a purple ring with a purple
 * dot inside. Titles are bold, so their `*` stays a separate text item, as in Chrome's print.
 */
import { jsPDF } from 'jspdf';
import { COLOURFUL_SPREAD } from '../../../src/utils/googleFormPdf/answersFromLayout';
import type { LayoutMark, PdfLayout } from '../../../src/utils/googleFormPdf/layout';

const RING_RADIUS = 6.75;
const DOT_RADIUS = 1.85;

const isColourful = ({ colour: [r, g, b] }: LayoutMark): boolean => Math.max(r, g, b) - Math.min(r, g, b) > COLOURFUL_SPREAD;

/** A ring for the first mark at a spot, a dot for the second (a ticked radio), and a dot for a bullet. */
function drawMark(doc: jsPDF, mark: LayoutMark, ringDrawn: boolean): void {
  const [r, g, b] = mark.colour;
  doc.setDrawColor(r, g, b);
  doc.setFillColor(r, g, b);
  doc.setLineWidth(1.5);
  // Description bullets are near-black dots; rings are grey or purple.
  const bullet = !isColourful(mark) && r < 100;
  if (bullet || (isColourful(mark) && ringDrawn)) doc.circle(mark.x, mark.y, DOT_RADIUS, 'F');
  else doc.circle(mark.x, mark.y, RING_RADIUS, 'S');
}

/** The layout as a PDF, padded with blank pages up to `minPages`. */
export function layoutToPdf(layout: PdfLayout, minPages = 1): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pages = Math.max(minPages, ...layout.lines.map((line) => line.page), ...layout.marks.map((mark) => mark.page));
  for (let page = 2; page <= pages; page++) doc.addPage('letter', 'portrait');
  for (const line of layout.lines) {
    doc.setPage(line.page);
    for (const item of line.items) {
      doc.setFont('helvetica', Math.abs(item.size - 12) < 0.5 && item.text !== '*' ? 'bold' : 'normal');
      doc.setFontSize(item.size);
      doc.text(item.text, item.x, line.y);
    }
  }
  const rings = new Set<string>();
  for (const mark of layout.marks) {
    const at = `${mark.page}:${mark.x}:${mark.y}`;
    doc.setPage(mark.page);
    drawMark(doc, mark, rings.has(at));
    rings.add(at);
  }
  return Buffer.from(doc.output('arraybuffer'));
}

/** `count` one-letter text lines, 2.8pt apart (more than the reader's 2pt line tolerance), 270 to a page. */
export function linesPdf(count: number): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(2);
  for (let index = 0; index < count; index++) {
    if (index > 0 && index % 270 === 0) doc.addPage('letter', 'portrait');
    doc.text('x', 300, 20 + (index % 270) * 2.8);
  }
  return Buffer.from(doc.output('arraybuffer'));
}

/** `count` small filled circles where radio marks sit (x 55, 3pt across), 105 to a page. */
export function marksPdf(count: number): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  for (let index = 0; index < count; index++) {
    if (index > 0 && index % 105 === 0) doc.addPage('letter', 'portrait');
    doc.circle(55, 30 + (index % 105) * 7, 1.5, 'F');
  }
  return Buffer.from(doc.output('arraybuffer'));
}

/** A one-page PDF with a single line of text: a valid PDF that is not a form response. */
export function plainPdf(text: string): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setFontSize(12);
  doc.text(text, 72, 96);
  return Buffer.from(doc.output('arraybuffer'));
}
