import { showConfirmationModal } from '@/components/ConfirmationModal';
import { journalDateWarning } from '@/utils/reportPeriod';

/**
 * Before saving a voucher whose journal date is outside the voucher list's last 30 days, ask
 * whether the date is right: such a voucher does not show on the list after Save. True when the
 * date is inside the window or the user confirms it. Opens on Back, so a habitual Enter goes back.
 */
export async function confirmJournalDate(journalDate: string | null | undefined): Promise<boolean> {
  const warning = journalDateWarning(journalDate);
  if (!warning) return true;
  return showConfirmationModal(
    'Is the journal date right?',
    `${warning} The voucher list opens on the last 30 days, so this voucher will not show there after saving.`,
    'Yes, the date is right',
    true,
    false,
    { focusCancel: true },
  );
}
