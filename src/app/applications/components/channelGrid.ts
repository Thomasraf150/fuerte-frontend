/**
 * Where the nth of `count` items sits on a six-column grid, so no row is left with a gap:
 * rows of three ('third', two columns each), then a remainder of two shares a row ('half',
 * three columns each) and a remainder of one takes the row ('full'). `odd` marks the last
 * item of an odd count, which spans both columns of a two-column (phone) grid. Shared by the
 * Saan galing tiles and the Source tracker's cards, which map it to their own breakpoints
 * (Tailwind needs literal class names).
 */
export type GridPlace = { span: 'third' | 'half' | 'full'; odd: boolean };

export function gridPlace(index: number, count: number): GridPlace {
  const left = count % 3;
  const inTail = index >= count - left;
  const span = !inTail || left === 0 ? 'third' : left === 2 ? 'half' : 'full';
  return { span, odd: count % 2 === 1 && index === count - 1 };
}
