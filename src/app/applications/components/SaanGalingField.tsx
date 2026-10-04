"use client";

import React, { useId } from 'react';
import { Check } from 'react-feather';
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from 'react-hook-form';
import { CHANNELS, CHANNEL_LABELS } from '@/utils/applicationForm';
import type { LoanApplicationChannel } from '@/utils/DataTypes';
import { CHANNEL_ICONS, TINTS } from './channelIcons';

export const CHANNEL_ERROR = 'Piliin kung saan galing ang application.';

const HINTS: Readonly<Record<LoanApplicationChannel, string>> = {
  google_form: 'Sumagot sa form online',
  facebook: 'Nag-message sa FB page',
  walk_in: 'Pumunta mismo sa branch',
  phone: 'Tumawag o nag-text',
};

/*
 * The visible tile is a sibling of the real radio (sr-only, the `peer`), so the
 * native radio group gives Tab, the arrow keys and screen readers for free.
 */
const TILE =
  'flex h-full min-h-16 rounded-lg border border-stroke bg-white p-3 transition-colors duration-150 ' +
  'hover:border-primary/50 dark:border-strokedark dark:bg-boxdark dark:hover:border-primary/50 ' +
  'peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-inset peer-checked:ring-primary ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary';

/*
 * The icon beside the words needs a tile about 190px wide.
 *   Four tiles: two columns on phones (124px each at 360px, so the icon sits above the
 *   words), and four in a row only from xl: beside the 290px sidebar, 1024-1279px
 *   would leave four tiles 133px wide.
 *   Three tiles: one column on phones, three in a row from md (180px or more each).
 */
const FOUR = { grid: 'grid-cols-2 xl:grid-cols-4', tile: 'flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3' };
const THREE = { grid: 'grid-cols-1 md:grid-cols-3', tile: 'flex-row items-center gap-3' };

interface ChannelTileProps {
  channel: LoanApplicationChannel;
  /** useId's prefix, for the label and hint ids. */
  idPrefix: string;
  layout: string;
  field: UseFormRegisterReturn;
  /** The error's id, while the field shows one. */
  errorId?: string;
}

const ChannelTile: React.FC<ChannelTileProps> = ({ channel, idPrefix, layout, field, errorId }) => {
  const ChannelIcon = CHANNEL_ICONS[channel];
  const labelId = `${idPrefix}-${channel}-label`;
  const hintId = `${idPrefix}-${channel}-hint`;
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        value={channel}
        className="peer sr-only"
        aria-labelledby={labelId}
        aria-describedby={errorId ? `${hintId} ${errorId}` : hintId}
        {...field}
      />
      <span className={`${TILE} ${layout}`}>
        <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TINTS[channel]}`}>
          <ChannelIcon size={18} />
        </span>
        <span className="min-w-0">
          <span id={labelId} className="block text-sm font-medium text-black dark:text-white">
            {CHANNEL_LABELS[channel]}
          </span>
          <span id={hintId} className="block text-xs text-body dark:text-bodydark">
            {HINTS[channel]}
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute right-2 top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-primary text-white peer-checked:flex"
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </label>
  );
};

interface SaanGalingFieldProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  /** Call Center, Owner and Admin (useCanUpload); null until the role has been read. */
  canChooseGoogleForm: boolean | null;
}

/**
 * "Saan galing ang application?": where the application came from, as big tiles,
 * never a dropdown. Registered as `channel` on BorrowerDetails' own form (through
 * renderExtraFields), required. Google Form is offered only to the roles that upload
 * the Google Form responses; everyone else gets three tiles.
 */
const SaanGalingField: React.FC<SaanGalingFieldProps> = ({ register, errors, canChooseGoogleForm }) => {
  const id = useId();
  const errorId = `${id}-error`;
  const error = errors.channel?.message ? String(errors.channel.message) : '';
  const field = register('channel', { required: CHANNEL_ERROR });
  const channels = canChooseGoogleForm ? CHANNELS : CHANNELS.filter((channel) => channel !== 'google_form');
  const layout = channels.length === 4 ? FOUR : THREE;

  return (
    <fieldset>
      <legend className="mb-3 block text-sm font-medium text-black dark:text-white">
        Saan galing ang application?
        <span className="ml-1 font-bold" style={{ color: '#DC2626' }}>*</span>
      </legend>
      {canChooseGoogleForm === null ? (
        // Until the role is read (a frame after mount), hold a tile row's height rather than show the wrong tiles.
        <div aria-hidden="true" className="min-h-16" />
      ) : (
        <div className={`grid gap-3 ${layout.grid}`}>
          {channels.map((channel) => (
            <ChannelTile key={channel} channel={channel} idPrefix={id} layout={layout.tile} field={field} errorId={error ? errorId : undefined} />
          ))}
        </div>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default SaanGalingField;
