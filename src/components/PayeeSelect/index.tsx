"use client"

import { FC, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { StylesConfig } from 'react-select';
import { useSelectTheme } from '@/hooks/useSelectTheme';
import { composeStyles } from '@/components/ReactSelect';
import { SelectOption } from '@/utils/DataTypes';

/** Trim and collapse internal runs of whitespace: "FLC  TELA " -> "FLC TELA". */
const normalise = (s: string): string => s.trim().replace(/\s+/g, ' ');

interface PayeeSelectProps {
  /** Every selectable payee, already sorted. */
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  /** Called with the typed name when the user picks "Add new payee". */
  onCreate: (name: string) => void;
  isLoading?: boolean;
  /** True while a create is in flight — the control locks to stop double-submits. */
  isCreating?: boolean;
  /** Read-only mode (e.g. an already-saved voucher, whose payee cannot be changed). */
  isDisabled?: boolean;
  /**
   * False when the payee list could not be loaded. Creating is then hidden, not
   * merely rejected on click: without the list there is nothing to check a new
   * name against, and the table has no unique index to catch a duplicate.
   */
  canCreate?: boolean;
  inputId?: string;
  placeholder?: string;
}

/**
 * Payee combobox: search every existing payee, or type a brand-new one.
 *
 * Replaces the read-only input + modal that forced the user to guess one of six
 * payee categories before seeing a single name, and to abandon a half-typed
 * voucher to create a missing one.
 *
 * Shared on purpose: the Journal Voucher form carries a byte-identical payee
 * block, so wiring it up later is one import and one element.
 */
const PayeeSelect: FC<PayeeSelectProps> = ({
  options,
  value,
  onChange,
  onCreate,
  isLoading = false,
  isCreating = false,
  isDisabled = false,
  canCreate = true,
  inputId,
  placeholder = 'Search or type a payee name...',
}) => {
  const { styles: themeStyles, theme } = useSelectTheme<SelectOption>();

  // Set the "Add new payee" row apart from real payees so creating one is never
  // a slip of the arrow key. Composed on top of the theme so dark mode survives.
  const customStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      // The menu is portalled to document.body to escape the form's stacking
      // context; without an explicit z-index it renders UNDER the app chrome.
      // 9999 matches the value PayeeView already uses for its category select.
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      option: (base, state) => {
        const isNew = Boolean((state.data as { __isNew__?: boolean })?.__isNew__);
        if (!isNew) return base;
        return {
          ...base,
          fontStyle: 'italic',
          borderTop: '1px solid rgba(125,125,125,0.35)',
        };
      },
    }),
    [],
  );

  const mergedStyles = useMemo(
    () => composeStyles(themeStyles, customStyles),
    [themeStyles, customStyles],
  );

  /**
   * Suppress the "Add new payee" row when the typed name already exists.
   *
   * react-select's default only compares the raw input, so "FLC " and "flc"
   * would each still offer to create a seventh FLC. Normalising both sides
   * first is what makes the near-duplicate protection actually hold — the
   * vendors table has no unique index and cannot be given one over its
   * existing duplicates, so this is the only guard there is.
   */
  const isValidNewOption = (inputValue: string, _selectValue: unknown, selectOptions: readonly unknown[]) => {
    const typed = normalise(inputValue);
    if (!typed || !canCreate) return false;
    return !selectOptions.some(
      (opt) => normalise((opt as SelectOption)?.label ?? '').toLowerCase() === typed.toLowerCase(),
    );
  };

  return (
    <CreatableSelect
      inputId={inputId}
      options={options}
      value={value}
      onChange={(opt) => onChange(opt as SelectOption | null)}
      onCreateOption={(input) => onCreate(normalise(input))}
      isValidNewOption={isValidNewOption}
      formatCreateLabel={(input) => `Add new payee: "${normalise(input)}"`}
      isClearable={!isDisabled}
      isDisabled={isDisabled || isCreating}
      isLoading={isLoading || isCreating}
      loadingMessage={() => (isCreating ? 'Adding payee...' : 'Loading payees...')}
      noOptionsMessage={() =>
        isLoading
          ? 'Loading payees...'
          : canCreate
            ? 'No payee found — type to add one'
            : 'Payee list unavailable — reload the page'
      }
      placeholder={placeholder}
      className="w-full"
      classNamePrefix="react-select"
      styles={mergedStyles}
      theme={theme}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
    />
  );
};

export default PayeeSelect;
