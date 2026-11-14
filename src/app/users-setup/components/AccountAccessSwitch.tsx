"use client"
import React from 'react';
import { AlertTriangle, Lock } from 'react-feather';

interface AccountAccessSwitchProps {
  /** Whether the account can sign in. */
  active: boolean;
  /** What the account was when the form opened: the warning shows only for a change to off. */
  wasActive: boolean;
  onChange: (active: boolean) => void;
  /** The editor's own account: switching it off would lock them out, so the server refuses it. */
  isOwnAccount: boolean;
  userName?: string;
}

/**
 * Offboarding (security defect 5, 2026-11-13). One real switch (role="switch", a 48px row), olive
 * when the account can sign in, warm grey when it cannot. Turning it off says what Save will do
 * before it happens, as Google Workspace's "Suspend user" and Slack's "Deactivate account" do;
 * nothing is applied until Save.
 */
const AccountAccessSwitch: React.FC<AccountAccessSwitchProps> = ({ active, wasActive, onChange, isOwnAccount, userName }) => {
  const switchingOff = wasActive && !active;
  const who = userName?.trim() || 'this person';

  return (
    <fieldset className="mb-6 mt-6 rounded-md border border-stroke bg-whiten px-4 py-4 dark:border-strokedark dark:bg-meta-4">
      <legend className="sr-only">Account access</legend>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span aria-hidden className="block text-sm font-semibold text-black dark:text-white">Account access</span>
        <span className="text-[11px] uppercase tracking-wide text-body">Owner · Admin</span>
      </div>

      <label
        htmlFor="user_is_active"
        className={`flex min-h-12 items-center justify-between gap-4 rounded border border-stroke bg-white px-4 py-2 dark:border-form-strokedark dark:bg-form-input ${isOwnAccount ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-black dark:text-white">
            {active ? 'Active' : 'Deactivated'}
          </span>
          <span className="text-xs text-body">
            {active ? 'Can sign in and work as usual.' : 'Cannot sign in. Every session is signed out.'}
          </span>
        </span>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            id="user_is_active"
            type="checkbox"
            role="switch"
            aria-checked={active}
            aria-describedby={isOwnAccount ? 'user_is_active_own' : switchingOff ? 'user_is_active_warn' : undefined}
            className="peer sr-only"
            checked={active}
            disabled={isOwnAccount}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span
            aria-hidden
            className="h-6 w-11 rounded-full bg-[#CFC8B6] transition-colors duration-200 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary dark:bg-strokedark"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5"
          />
        </span>
      </label>

      {isOwnAccount && (
        <p id="user_is_active_own" className="mt-3 flex items-center gap-2 text-xs text-body">
          <Lock size={14} aria-hidden /> You cannot deactivate your own account.
        </p>
      )}
      {switchingOff && (
        <p
          id="user_is_active_warn"
          role="status"
          className="mt-3 flex items-start gap-2 rounded border border-[#E3A92E]/60 bg-[#F7E7BF] px-3 py-2 text-xs text-[#5C4410] dark:bg-[#3B3020] dark:text-[#E9BE60]"
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>Saving signs {who} out on every device and blocks sign-in. Their records and history stay. Switch it back on any time.</span>
        </p>
      )}
    </fieldset>
  );
};

export default AccountAccessSwitch;
