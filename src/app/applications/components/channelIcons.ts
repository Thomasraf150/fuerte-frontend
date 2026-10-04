import { FileText, MapPin, MessageCircle, Phone, type Icon } from 'react-feather';
import type { LoanApplicationChannel } from '@/utils/DataTypes';

/** Each Saan galing source's icon: the New application tiles and the line under a name in the list. */
export const CHANNEL_ICONS: Readonly<Record<LoanApplicationChannel, Icon>> = {
  google_form: FileText,
  facebook: MessageCircle,
  walk_in: MapPin,
  phone: Phone,
};

/**
 * Each source's colour, as classes: the icon bubble's tint (a 15% background and the matching
 * text colour). Meta colours the status dots do not use, so a source never reads as a status.
 * A solid fill in the same colour is `bg-current` on an element inside one of these. Shared by
 * the New application tiles, the application page and the Source tracker's cards and bars.
 */
export const TINTS: Readonly<Record<LoanApplicationChannel, string>> = {
  google_form: 'bg-meta-10/15 text-meta-10',
  facebook: 'bg-meta-5/15 text-meta-5',
  walk_in: 'bg-meta-8/15 text-meta-8',
  phone: 'bg-meta-3/15 text-meta-3',
};
