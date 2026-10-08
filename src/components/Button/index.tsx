import React, { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** `sm`: a row action in a table, 40px from lg (still 48px on phones). */
  size?: Size;
}

/**
 * One button system (UI modernisation B, 2026-10-07). A form has ONE primary button, its main
 * action ("Avoid using multiple default buttons", GOV.UK); everything else is secondary, and
 * danger is outlined. Text is always shown (an icon may sit beside it, never alone), 48px tall on
 * phones and 40px from lg. Square, by the house rule (css/style.css button radius 0, Rafael
 * 2026-10-06). The label never wraps and its icon never shrinks: a table row that wraps its text
 * on hover (react-data-table-component) squeezed "Edit" into "Edi / t" (Rafael 2026-10-07).
 */
const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors [&_svg]:shrink-0 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const SIZES: Record<Size, string> = {
  md: 'min-h-12 px-4 lg:min-h-10',
  sm: 'min-h-12 px-3 lg:min-h-9 lg:px-2.5',
};

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-primary bg-primary text-white hover:bg-olive-700 hover:border-olive-700',
  secondary:
    'border border-field bg-white text-black hover:border-primary hover:text-primary ' +
    'dark:border-field-dark dark:bg-boxdark dark:text-white dark:hover:border-olive-300 dark:hover:text-olive-300',
  danger: 'border border-danger bg-white text-danger hover:bg-danger/10 dark:bg-boxdark',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', type = 'button', ...rest }, ref) => (
    <button ref={ref} type={type} className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...rest} />
  ),
);

Button.displayName = 'Button';

export default Button;
