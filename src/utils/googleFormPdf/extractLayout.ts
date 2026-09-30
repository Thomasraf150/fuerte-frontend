import type * as PdfJs from 'pdfjs-dist';
import type { LayoutLine, LayoutMark, PdfLayout, Rgb } from './layout';

/**
 * PDF → PdfLayout, with pdf.js. The pdf.js module is a parameter: the browser passes
 * the lazily loaded legacy build, and a local node script can pass the same.
 */
export type PdfJsModule = Pick<typeof PdfJs, 'getDocument' | 'OPS'>;
type Ops = PdfJsModule['OPS'];
type PdfPage = Awaited<ReturnType<PdfJs.PDFDocumentProxy['getPage']>>;
type OperatorList = Awaited<ReturnType<PdfPage['getOperatorList']>>;

/** A 2D affine matrix as pdf.js writes it: [a, b, c, d, e, f]. */
type Matrix = number[];

/** Marks are the shapes whose centre sits left of the option labels. */
const MARK_X_MIN = 40;
const MARK_X_MAX = 75;
/**
 * Radio rings are 13.5pt across; their dots and the description bullets are about 4pt.
 * Smaller is the dotted underline of a text answer (0.75pt squares). Larger is Chrome's
 * card shadows, hundreds of points tall. Neither is a mark.
 */
const MARK_MIN_SIZE = 2;
const MARK_MAX_SIZE = 20;
/** Text items within this many points of a line's baseline belong to that line. */
const SAME_LINE = 2;
/**
 * One response prints on about 7 pages, with about 100 text lines and 25 marks. A PDF
 * far past any of these is not one response: it is not read further, and its empty
 * layout reads as "not a form". This also bounds the main-thread work of reading it.
 */
const MAX_PAGES = 20;
const MAX_LINES = 5_000;
const MAX_MARKS = 2_000;

const BLACK: Rgb = [0, 0, 0];

/** `n` first, then `m`: the matrix product pdf.js calls Util.transform(m, n). */
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

const applyTo = (m: Matrix, x: number, y: number): [number, number] => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

const round = (value: number): number => Math.round(value * 100) / 100;

const isMatrix = (value: unknown): value is Matrix =>
  Array.isArray(value) && value.length === 6 && value.every((entry) => typeof entry === 'number');

// ---------------------------------------------------------------------------
// Text: items grouped into lines
// ---------------------------------------------------------------------------

interface PlacedItem {
  x: number;
  y: number;
  size: number;
  width: number;
  /** As pdf.js gave it, spaces included. */
  raw: string;
}

async function placedItems(page: PdfPage, viewport: Matrix): Promise<PlacedItem[]> {
  const content = await page.getTextContent();
  const items: PlacedItem[] = [];
  for (const item of content.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const t = item.transform as number[];
    const [x, y] = applyTo(viewport, t[4], t[5]);
    items.push({ x, y, size: Math.hypot(t[0], t[1]), width: item.width, raw: item.str });
  }
  return items.sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Joins a line's items, with a space wherever the page shows a gap. It looks at one
 * character at each seam, never the whole text so far, so a crafted line of 100k items
 * stays linear.
 */
function joinItems(items: PlacedItem[]): string {
  let text = '';
  let end = Number.NEGATIVE_INFINITY;
  let endsInSpace = false;
  for (const item of items) {
    const gap = item.x - end > item.size * 0.15;
    if (text && (gap || endsInSpace || /^\s/.test(item.raw))) text += ' ';
    text += item.raw.trim();
    end = item.x + item.width;
    endsInSpace = /\s$/.test(item.raw);
  }
  return text.replace(/\s+/g, ' ').trim();
}

function toLine(items: PlacedItem[], page: number): LayoutLine {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  return {
    page,
    x: round(sorted[0].x),
    y: round(sorted[0].y),
    size: round(sorted[0].size),
    text: joinItems(sorted),
    items: sorted.map((item) => ({ x: round(item.x), text: item.raw.trim(), size: round(item.size) })),
  };
}

function groupLines(items: PlacedItem[], page: number): LayoutLine[] {
  const groups: PlacedItem[][] = [];
  for (const item of items) {
    const current = groups[groups.length - 1];
    if (current && Math.abs(item.y - current[0].y) <= SAME_LINE) current.push(item);
    else groups.push([item]);
  }
  return groups.map((group) => toLine(group, page));
}

// ---------------------------------------------------------------------------
// Marks: painted paths, positioned from their own coordinates through the CTM
// ---------------------------------------------------------------------------

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The path's points: every end and control point, and a rectangle's four corners. */
function pathPoints(pathOps: ArrayLike<number>, coords: ArrayLike<number>, OPS: Ops): [number, number][] {
  const pointsPerOp = new Map<number, number>([
    [OPS.moveTo, 1], [OPS.lineTo, 1], [OPS.curveTo, 3], [OPS.curveTo2, 2], [OPS.curveTo3, 2],
  ]);
  const points: [number, number][] = [];
  let at = 0;
  for (const op of Array.from(pathOps)) {
    if (op === OPS.rectangle) {
      const [x, y, w, h] = [coords[at], coords[at + 1], coords[at + 2], coords[at + 3]];
      points.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
      at += 4;
      continue;
    }
    for (let point = 0; point < (pointsPerOp.get(op) ?? 0); point++, at += 2) points.push([coords[at], coords[at + 1]]);
  }
  return points;
}

/** Bounding box on the page. pdf.js v4's own minMax for a path is not in page space, so it is not used. */
function pathBox(args: unknown[], ctm: Matrix, OPS: Ops): Box | null {
  const points = pathPoints(args[0] as ArrayLike<number>, args[1] as ArrayLike<number>, OPS);
  if (!points.length) return null;
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const [px, py] of points) {
    const [x, y] = applyTo(ctm, px, py);
    box.x0 = Math.min(box.x0, x);
    box.y0 = Math.min(box.y0, y);
    box.x1 = Math.max(box.x1, x);
    box.y1 = Math.max(box.y1, y);
  }
  return box;
}

function markAt(box: Box, colour: Rgb, page: number): LayoutMark | null {
  const [width, height, x] = [box.x1 - box.x0, box.y1 - box.y0, (box.x0 + box.x1) / 2];
  const sized = Math.max(width, height) >= MARK_MIN_SIZE && width <= MARK_MAX_SIZE && height <= MARK_MAX_SIZE;
  if (!sized || x < MARK_X_MIN || x > MARK_X_MAX) return null;
  return { page, x: round(x), y: round((box.y0 + box.y1) / 2), colour };
}

/** pdf.js hands colours over as [r, g, b] (0-255), or, in some builds, as a "#rrggbb" string. */
function toRgb(args: unknown[]): Rgb {
  const hex = typeof args[0] === 'string' ? /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(args[0]) : null;
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  const [r, g, b] = Array.from(args as ArrayLike<number>);
  return [Number(r) || 0, Number(g) || 0, Number(b) || 0];
}

interface PaintState {
  ctm: Matrix;
  fill: Rgb;
  stroke: Rgb;
}

/** Replays the page's operators, tracking the CTM and colours, and keeps every small painted path. */
function readMarks(list: OperatorList, OPS: Ops, viewport: Matrix, page: number): LayoutMark[] {
  const marks: LayoutMark[] = [];
  const saved: PaintState[] = [];
  let state: PaintState = { ctm: viewport, fill: BLACK, stroke: BLACK };
  let box: Box | null = null;
  const push = () => { saved.push(state); };
  const pop = () => { state = saved.pop() ?? state; };
  const concat = (m: unknown) => { if (isMatrix(m)) state = { ...state, ctm: multiply(state.ctm, m) }; };
  const paint = (colour: 'fill' | 'stroke') => () => {
    const mark = box && markAt(box, state[colour], page);
    if (mark) marks.push(mark);
    box = null;
  };
  const handlers = new Map<number, (args: unknown[]) => void>([
    [OPS.save, push],
    [OPS.restore, pop],
    [OPS.transform, (args) => concat(args)],
    [OPS.paintFormXObjectBegin, (args) => { push(); concat(args[0]); }],
    [OPS.paintFormXObjectEnd, pop],
    [OPS.setFillRGBColor, (args) => { state = { ...state, fill: toRgb(args) }; }],
    [OPS.setStrokeRGBColor, (args) => { state = { ...state, stroke: toRgb(args) }; }],
    [OPS.constructPath, (args) => { box = pathBox(args, state.ctm, OPS); }],
    [OPS.endPath, () => { box = null; }],
    [OPS.stroke, paint('stroke')],
    [OPS.closeStroke, paint('stroke')],
    ...[OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]
      .map((op): [number, () => void] => [op, paint('fill')]),
  ]);
  list.fnArray.forEach((fn, index) => handlers.get(fn)?.(list.argsArray[index] ?? []));
  return marks;
}

// ---------------------------------------------------------------------------

/**
 * Every page's text lines and marks, in page order. The PDF is never rendered.
 * Past MAX_PAGES, MAX_LINES or MAX_MARKS the layout is empty, which reads as "not a form".
 */
export async function extractLayout(pdfjs: PdfJsModule, data: Uint8Array): Promise<PdfLayout> {
  // isEvalSupported: false closes CVE-2024-4367. Fonts are never loaded: nothing is drawn.
  const task = pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true, verbosity: 0 });
  try {
    const doc = await task.promise;
    const layout: PdfLayout = { lines: [], marks: [] };
    if (doc.numPages > MAX_PAGES) return layout;
    for (let number = 1; number <= doc.numPages; number++) {
      const page = await doc.getPage(number);
      const viewport = page.getViewport({ scale: 1 }).transform;
      const lines = groupLines(await placedItems(page, viewport), number);
      const marks = readMarks(await page.getOperatorList(), pdfjs.OPS, viewport, number);
      // Checked before the push, so a huge page is never spread into the layout.
      if (layout.lines.length + lines.length > MAX_LINES || layout.marks.length + marks.length > MAX_MARKS) {
        return { lines: [], marks: [] };
      }
      layout.lines.push(...lines);
      layout.marks.push(...marks);
    }
    return layout;
  } finally {
    // The task, not the document: a damaged or password-protected file never opens a document.
    await task.destroy();
  }
}
