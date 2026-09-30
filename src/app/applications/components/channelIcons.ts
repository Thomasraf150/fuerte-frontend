import { FileText, MapPin, MessageCircle, Phone, type Icon } from 'react-feather';
import type { LoanApplicationChannel } from '@/utils/DataTypes';

/** Each Saan galing source's icon: the New application tiles and the line under a name in the list. */
export const CHANNEL_ICONS: Readonly<Record<LoanApplicationChannel, Icon>> = {
  google_form: FileText,
  facebook: MessageCircle,
  walk_in: MapPin,
  phone: Phone,
};
