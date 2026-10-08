import React from 'react';

/**
 * The one card (Phase 8, 2026-10-08). Before it, the same class chain was hand-written about 100
 * times with three header styles and per-page gaps, which is why buttons sat flush on tables and
 * cards touched cards.
 *
 * Spacing scale (research: every design system checked uses an 8px step):
 *   4  inside a control · 8 between buttons · 16 toolbar→table and card→card
 *   24 card padding (16 on phones) · 32 between page sections.
 * Never put a Card inside a Card: an inner group is a CardSection (heading + space) or a divider.
 */
export const CARD_CLASS =
  'rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark';

type DivProps = React.HTMLAttributes<HTMLElement>;

export const Card = React.forwardRef<HTMLElement, DivProps & { as?: 'section' | 'div' }>(
  ({ as: Tag = 'section', className = '', children, ...rest }, ref) => (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={`${CARD_CLASS} ${className}`} {...rest}>
      {children}
    </Tag>
  ),
);
Card.displayName = 'Card';

interface CardHeaderProps {
  title: React.ReactNode;
  /** One short line under the title (what the card counts, what it saves). */
  description?: React.ReactNode;
  /** Buttons or controls on the right (a close button, Export…). Wraps under the title on phones. */
  actions?: React.ReactNode;
  /** Card titles sit under the page's h2 title, so h3 by default; e2e suites find them as h3. */
  as?: 'h2' | 'h3' | 'h4';
  id?: string;
  className?: string;
}

/**
 * The card's title bar. Leave it out when the page has a single card whose title would only
 * repeat the page title (Rafael 2026-10-08, Decision 3).
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, actions, as: Heading = 'h3', id, className = '' }) => (
  <div
    className={`flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-stroke px-4 py-3 sm:px-6 dark:border-strokedark ${className}`}
  >
    <div className="min-w-0">
      <Heading id={id} className="text-base font-semibold text-black dark:text-white">
        {title}
      </Heading>
      {description && <p className="mt-0.5 text-sm text-body dark:text-bodydark">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/**
 * The card's content: 16px padding on phones, 24px from sm, and 16px between its direct children
 * (toolbar, alert, table…), so nothing sits flush on the next thing.
 */
export const CardBody: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <div className={`space-y-4 p-4 sm:p-6 ${className}`} {...rest}>
    {children}
  </div>
);

/** A group inside a card: a small heading and space above it, never a nested card. */
export const CardSection: React.FC<{ title: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = '',
}) => (
  <div className={`space-y-3 border-t border-stroke pt-4 first:border-t-0 first:pt-0 dark:border-strokedark ${className}`}>
    <h4 className="text-sm font-semibold text-black dark:text-white">{title}</h4>
    {children}
  </div>
);

/** A row of buttons or controls: 8px apart, wrapping on narrow screens. */
export const Toolbar: React.FC<DivProps> = ({ className = '', children, ...rest }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`} {...rest}>
    {children}
  </div>
);

export default Card;
