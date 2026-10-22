import Select, { SelectInstance, StylesConfig } from 'react-select';
import { forwardRef, useMemo, useRef } from 'react';
import { useSelectTheme } from '@/hooks/useSelectTheme';
import { SelectOption } from '@/utils/DataTypes';

type Styles = StylesConfig<SelectOption, false>;

/**
 * Compose caller styles ON TOP OF the theme's, per style key.
 *
 * A plain object spread would let a caller's `control` (or any other key)
 * REPLACE the theme's, silently dropping dark-mode colours — the caller only
 * spreads react-select's `base`, which knows nothing about our theme. Chaining
 * the two functions instead means the caller extends the themed result.
 */
export function composeStyles(themeStyles: Styles, customStyles?: Styles): Styles {
  if (!customStyles) return themeStyles;

  const merged: Styles = { ...themeStyles };
  (Object.keys(customStyles) as (keyof Styles)[]).forEach((key) => {
    const custom = customStyles[key] as ((base: any, state: any) => any) | undefined;
    if (!custom) return;
    const themed = themeStyles[key] as ((base: any, state: any) => any) | undefined;
    (merged as Record<string, unknown>)[key as string] = themed
      ? (base: any, state: any) => custom(themed(base, state), state)
      : custom;
  });
  return merged;
}

/**
 * Menus open in document.body by default (2026-10-22). Inline, a menu sat under the z-20
 * StickyActions bar (the Branch list on Create Loans) and was cut off by the Borrower card's
 * overflow-clip; 65e9dbb fixed six voucher forms one by one, this fixes every form at once.
 * 'fixed', because the app scrolls inside its layout, not the page: a fixed menu cannot follow
 * that scroll, so it closes when anything but its own list scrolls instead of floating off. The
 * scroll the browser makes to bring the field into view as the menu opens does not count.
 * A dropdown opens downward: near the bottom of the screen the form first scrolls up to make room,
 * instead of react-select flipping the list above the field (Raf: "why is the menu going up?").
 * Only a field at the very end of the form, with nothing left to scroll, still opens upward.
 * The theme gives `menuPortal` z-index 9999. Pass `menuPortalTarget={null}` to keep a menu inline.
 */
const OPENING_SCROLL_MS = 300;
/** react-select's default maxMenuHeight (300) plus its 8px gap. */
const MENU_ROOM = 308;

function makeRoomBelow(): void {
  const control = document.activeElement?.closest('.react-select__control');
  if (!control) return;
  const room = Math.min(MENU_ROOM, window.innerHeight * 0.5);
  const short = control.getBoundingClientRect().bottom + room - window.innerHeight;
  if (short <= 0) return;
  let scroller = control.parentElement;
  while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /(auto|scroll)/.test(getComputedStyle(scroller).overflowY))) {
    scroller = scroller.parentElement;
  }
  (scroller ?? document.scrollingElement)?.scrollBy({ top: short, behavior: 'instant' as ScrollBehavior });
}

export function useMenuPlacement(
  target: HTMLElement | null | undefined,
  position: 'fixed' | 'absolute' | undefined,
) {
  const openedAt = useRef(0);
  const portal = target === undefined ? (typeof document !== 'undefined' ? document.body : null) : target;
  const menuPosition = position ?? (portal ? 'fixed' : undefined);
  return {
    menuPortalTarget: portal,
    menuPosition,
    onMenuOpen: () => {
      openedAt.current = Date.now();
      if (portal && menuPosition === 'fixed') makeRoomBelow();
    },
    closeMenuOnScroll: portal && menuPosition === 'fixed'
      ? (event: Event) =>
          Date.now() - openedAt.current > OPENING_SCROLL_MS
          && !(event.target instanceof Element && event.target.closest('.react-select__menu-list'))
      : false,
  };
}

interface ReactSelectComponentProps {
  options: SelectOption[];
  onChange: (selectedOption: SelectOption | null) => void;
  value: SelectOption | null;
  placeholder?: string;
  styles?: StylesConfig<SelectOption, false>;
  menuPortalTarget?: HTMLElement | null;
  menuPosition?: 'fixed' | 'absolute';
  /** Below this much room under the field, the menu opens upward instead of shrinking. */
  minMenuHeight?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
  loadingMessage?: () => string;
  noOptionsMessage?: (obj: { inputValue: string }) => string | null;
  /** Accessible name for the underlying combobox input (react-select forwards it). */
  'aria-label'?: string;
  /** Forwarded to react-select so an external <label htmlFor> can bind to it (as AsyncReactSelect). */
  inputId?: string;
  /** Marks the combobox input invalid, as FormInput does for its fields. */
  'aria-invalid'?: boolean;
  /** The id of the element holding this field's error message. */
  'aria-errormessage'?: string;
}

/**
 * The ref reaches react-select itself: a Controller's `{...field}` carries one, and with
 * it react-hook-form can put the cursor here when the field fails validation.
 */
const ReactSelect = forwardRef<SelectInstance<SelectOption, false>, ReactSelectComponentProps>(({
  options,
  onChange,
  value,
  placeholder = 'Select an option...',
  styles: customStyles,
  menuPortalTarget,
  menuPosition,
  minMenuHeight,
  isDisabled,
  isLoading = false,
  loadingMessage = () => 'Loading options...',
  noOptionsMessage,
  'aria-label': ariaLabel,
  inputId,
  'aria-invalid': ariaInvalid,
  'aria-errormessage': ariaErrorMessage,
}, ref) => {
  // Get theme-aware styles and theme config
  const { styles: themeStyles, theme } = useSelectTheme<SelectOption>();

  const mergedStyles = useMemo(
    () => composeStyles(themeStyles, customStyles),
    [themeStyles, customStyles],
  );
  const placement = useMenuPlacement(menuPortalTarget, menuPosition);

  return (
    <Select
      ref={ref}
      options={options}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      className="w-full"
      classNamePrefix="react-select"
      styles={mergedStyles}
      theme={theme}
      menuPortalTarget={placement.menuPortalTarget}
      menuPosition={placement.menuPosition}
      minMenuHeight={minMenuHeight}
      closeMenuOnScroll={placement.closeMenuOnScroll}
      onMenuOpen={placement.onMenuOpen}
      isDisabled={isDisabled}
      isLoading={isLoading}
      loadingMessage={loadingMessage}
      noOptionsMessage={noOptionsMessage}
      aria-label={ariaLabel}
      inputId={inputId}
      aria-invalid={ariaInvalid}
      aria-errormessage={ariaErrorMessage}
    />
  );
});

ReactSelect.displayName = 'ReactSelect';

export default ReactSelect;
