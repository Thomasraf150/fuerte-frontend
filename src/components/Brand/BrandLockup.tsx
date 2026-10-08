import React, { useId } from 'react';

/**
 * The castle from Fuerte's logo, traced from its proportions: five merlons over a cornice, a
 * body with two square windows, no door. Decorative: whatever wraps it names the link.
 */
const CASTLE_PATH =
  'M0 0H56V28H88V0H143V28H178V0H233V28H268V0H323V28H358V0H415V53H390V225H26V53H0Z' +
  'M108 103H172V170H108ZM244 103H308V170H244Z';

/** The bare castle in the logo's gold, for dark grounds (the sidebar). */
export const Castle: React.FC<{ className?: string }> = ({ className = 'h-7 w-auto' }) => {
  const gradientId = `castle-gold-${useId().replace(/:/g, '')}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 415 225" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC93D" />
          <stop offset="0.55" stopColor="#E3A92E" />
          <stop offset="1" stopColor="#F2B634" />
        </linearGradient>
      </defs>
      <path d={CASTLE_PATH} fill={`url(#${gradientId})`} fillRule="evenodd" />
    </svg>
  );
};

/** The castle in ink on a gold tile, for the cream header on phones. */
export const CastleMark: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => (
  <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-secondary shadow-sm ${className}`}>
    <svg viewBox="0 0 415 225" className="w-[66%]" fill="#28261A">
      <path d={CASTLE_PATH} fillRule="evenodd" />
    </svg>
  </span>
);

/**
 * Fuerte's logo on the dark sidebar, laid out as the logo is: the gold castle, FUERTE in large
 * and small capitals, a gold rule, then LENDING. The styled letters are hidden from screen
 * readers; the link's accessible name comes from the sr-only "FUERTE Lending" (e2e finds the logo link by /FUERTE/).
 */
const BrandLockup: React.FC = () => (
  <span className="flex items-center gap-3">
    <Castle className="h-8 w-auto shrink-0" />
    <span className="flex flex-col items-stretch leading-none">
      <span className="sr-only">FUERTE Lending</span>
      <span aria-hidden="true" className="font-display text-[25px] font-medium tracking-[0.1em] text-[#FBF7EC]">
        F<span className="text-[0.78em]">UERT</span>E
      </span>
      <span aria-hidden="true" className="mt-1 h-px bg-secondary" />
      <span aria-hidden="true" className="mt-1 text-center font-display text-[11px] font-medium tracking-[0.34em] text-[#FBF7EC]/90">
        LENDING
      </span>
    </span>
  </span>
);

export default BrandLockup;
