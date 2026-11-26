import {
  Award, BarChart2, Bell, Clipboard, CornerDownLeft, CornerUpRight, Inbox, PauseCircle, RefreshCw, Repeat, Send,
  TrendingDown, TrendingUp, type Icon,
} from "react-feather";

/** A branch's collection state, where the notice is about one: drawn as a rule, a filled bubble and the word. */
export type NoticeTone = "red" | "green";

export interface NoticeLook {
  icon: Icon;
  /** The bubble's background and icon colour. */
  bubble: string;
  tone?: NoticeTone;
}

// Bubble colours. Red is loud (solid), as Rejected is on the Applications rows; Green is a tint,
// so a Red notice stands out among the rest. The word tag carries the state too: never colour alone.
const RED = "bg-danger text-white";
const GREEN = "bg-success/15 text-success dark:bg-success/25";
const NEUTRAL = "bg-primary/10 text-primary dark:bg-primary/20";
/** Gold: someone has to act on it (approve, request funds). The text gold, 5.42:1 on white. */
const ACTION = "bg-accent/20 text-[#8A6312] dark:text-accent";

/**
 * Each Collections notice type's icon and colours (types from AtmNotifier and
 * NotifySubBranchOfRefundPayable). Red and Green differ in shape as well as colour: the cut-off's
 * Red is the pause the /atm-collections pill uses ("releases on hold"); the monthly report trends
 * down or up.
 */
const LOOKS: Record<string, NoticeLook> = {
  atm_branch_red: { icon: PauseCircle, bubble: RED, tone: "red" },
  atm_monthly_rate_red: { icon: TrendingDown, bubble: RED, tone: "red" },
  atm_monthly_rate_green: { icon: TrendingUp, bubble: GREEN, tone: "green" },
  // Saved before the type said Red or Green: the report, with no state shown.
  atm_monthly_rate: { icon: BarChart2, bubble: NEUTRAL },
  atm_fully_paid: { icon: Award, bubble: GREEN },
  refund_payable_booked: { icon: CornerDownLeft, bubble: NEUTRAL },
  refund_payable_released: { icon: CornerUpRight, bubble: NEUTRAL },
  atm_review_resolved: { icon: RefreshCw, bubble: NEUTRAL },
  atm_intergroup_receipt: { icon: Repeat, bubble: NEUTRAL },
  atm_funds_request: { icon: Inbox, bubble: ACTION },
  // Owners are told, not asked (a notice, not an approval: claude-docs/atm-collections.md).
  atm_funds_release: { icon: Send, bubble: NEUTRAL },
  opex_replenishment: { icon: Clipboard, bubble: ACTION },
};

const DEFAULT_LOOK: NoticeLook = { icon: Bell, bubble: NEUTRAL };

export const collectionNoticeLook = (type: string): NoticeLook => LOOKS[type] ?? DEFAULT_LOOK;
