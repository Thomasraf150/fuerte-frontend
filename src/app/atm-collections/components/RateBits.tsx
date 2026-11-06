"use client";

import React from 'react';

/** The rubber stamp on a list or a branch card: GREEN (can release) or RED (release on hold). */
export const RateStamp: React.FC<{ green: boolean }> = ({ green }) => (
  <span className={`atm-stamp ${green ? 'atm-stamp--green' : 'atm-stamp--red'}`} role="img" aria-label={green ? 'Green: loan releases allowed' : 'Red: loan releases on hold'}>
    <span className="text-base font-semibold leading-none">{green ? 'Green' : 'Red'}</span>
    <span className="mt-0.5 text-[0.55rem] leading-none">{green ? 'Can release' : 'Release on hold'}</span>
  </span>
);

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
