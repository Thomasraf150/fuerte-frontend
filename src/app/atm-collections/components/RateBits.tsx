"use client";

import React from 'react';
import { CheckCircle, PauseCircle } from 'react-feather';

/**
 * A branch's release status: Green (may release loans) or Red (releases on hold). Same pill as the
 * app's other statuses, carrying icon + word + colour, so it never relies on colour alone.
 */
export const RateStatus: React.FC<{ green: boolean; size?: 'sm' | 'md' }> = ({ green, size = 'md' }) => {
  const Icon = green ? CheckCircle : PauseCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'} ${green ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
      <Icon size={size === 'md' ? 16 : 14} aria-hidden="true" strokeWidth={2.4} />
      {green ? 'Green' : 'Red'}{' '}
      <span className="font-normal opacity-80">· {green ? 'Releases allowed' : 'Releases on hold'}</span>
    </span>
  );
};

/** Collection rate bar with the release line drawn at the threshold. */
export const RateMeter: React.FC<{ percent: string; threshold: string; green: boolean }> = ({ percent, threshold, green }) => {
  const width = Math.max(0, Math.min(100, Number(percent)));
  return (
    <div className="mt-2">
      <div className="atm-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} aria-label={`${percent}% collected, release line ${threshold}%`}>
        <span style={{ width: `${width}%`, background: green ? 'var(--atm-green)' : 'var(--atm-red)' }} />
        <i style={{ left: `calc(${Number(threshold)}% - 1px)` }} />
      </div>
      <div className="mt-1 flex justify-between text-[0.7rem] text-body"><span>0%</span><span>Release line {threshold}%</span><span>100%</span></div>
    </div>
  );
};

/** Accounting's red pen tick, shown beside a posted (checked) amount, as on the paper list. */
export const PenTick: React.FC<{ title?: string }> = ({ title = 'Posted' }) => (
  <svg className="atm-tick" viewBox="0 0 16 16" role="img" aria-label={title}>
    <path d="M2 9.5 L6 13 L14.5 2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
