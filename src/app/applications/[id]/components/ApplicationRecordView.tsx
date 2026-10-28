"use client";

import React from 'react';
import { Card, CardBody, CardHeader, CardSection } from '@/components/Card';
import { formatMoneyOrBlank } from '@/utils/helper';
import type { LoanApplicationRecord } from '@/utils/DataTypes';

type Value = string | number | null | undefined;

/** A peso amount as the list shows it, or nothing for a blank or unreadable one. */
const peso = (value: Value): string => {
  const amount = formatMoneyOrBlank(value == null ? null : String(value));
  return amount ? `₱${amount}` : '';
};

const text = (value: Value): string => (value == null ? '' : String(value).trim());

/**
 * One answered field. A field nobody answered is left out rather than shown as a dash: an imported
 * application has a handful of the form's forty fields, and a wall of dashes hides the ones it has.
 */
const Field: React.FC<{ label: string; value: string; wide?: boolean }> = ({ label, value, wide = false }) =>
  value ? (
    <div className={`min-w-0 border-t border-stroke pt-3 dark:border-strokedark ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-body dark:text-bodydark">{label}</dt>
      <dd className="mt-1 break-words text-sm text-black dark:text-white">{value}</dd>
    </div>
  ) : null;

/** A group of fields under a small heading; nothing at all when none of them was answered. */
const Group: React.FC<{ title: string; fields: Array<[label: string, value: string, wide?: boolean]> }> = ({ title, fields }) => {
  const answered = fields.filter(([, value]) => value);
  if (answered.length === 0) return null;
  return (
    <CardSection title={<span className="font-display text-base font-semibold tracking-[-0.01em]">{title}</span>}>
      {/* grid-cols-1 is minmax(0, 1fr): a long answer wraps instead of widening the page. */}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {answered.map(([label, value, wide]) => (
          <Field key={label} label={label} value={value} wide={wide} />
        ))}
      </dl>
    </CardSection>
  );
};

/** The people the applicant named, one line each. */
const References: React.FC<{ references: LoanApplicationRecord['details']['references'] }> = ({ references }) => {
  const named = (references ?? []).filter((r) => text(r.name) || text(r.contact_no));
  if (named.length === 0) return null;
  return (
    <CardSection title={<span className="font-display text-base font-semibold tracking-[-0.01em]">References</span>}>
      <ul className="divide-y divide-stroke border-t border-stroke dark:divide-strokedark dark:border-strokedark">
        {named.map((reference, index) => (
          <li key={index} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
            <span className="min-w-0 break-words font-medium text-black dark:text-white">
              {text(reference.name) || 'No name given'}
              {text(reference.occupation) && <span className="ml-2 font-normal text-body dark:text-bodydark">{text(reference.occupation)}</span>}
            </span>
            {text(reference.contact_no) && <span className="tabular-nums text-black dark:text-white">{text(reference.contact_no)}</span>}
          </li>
        ))}
      </ul>
    </CardSection>
  );
};

/** The form's Type of Residency choices (BorrowerDetails): 1 Rent, 0 Own. */
const RESIDENCE: Record<number, string> = { 0: 'Own', 1: 'Rent' };

/**
 * The application as filed, read-only: what the edit form holds, group by group, answered fields
 * only. The page shows this where the always-open form used to be (Edit has its own page since
 * 2026-10-28). The ids the form picks from lists (chief, company, area) are not repeated here: the
 * Edit page shows them by name.
 */
const ApplicationRecordView: React.FC<{ record: LoanApplicationRecord }> = ({ record }) => {
  const { info, detail, spouse, work, company } = record.details;
  return (
    <Card aria-label="Application details">
      <CardHeader title="Application details" description="As filed. Use Edit to change it." />
      <CardBody>
        <Group
          title="Applicant"
          fields={[
            ['Name', text(record.full_name).toUpperCase(), true],
            ['Mobile', text(record.contact_no)],
            ['Email', text(detail?.email)],
            ['Birthday', text(detail?.dob)],
            ['Age', text(detail?.age)],
            ['Civil status', text(detail?.civil_status)],
            ['Gender', text(info?.gender)],
            ['Place of birth', text(detail?.place_of_birth)],
            ['Home address', text(info?.residence_address), true],
            ['Type of residency', info?.is_rent == null ? '' : RESIDENCE[info.is_rent] ?? ''],
          ]}
        />
        <Group
          title="Loan"
          fields={[
            ['Amount applied for', peso(record.amount_applied)],
            ['Terms of payment', text(info?.terms_of_payment)],
            ['Purpose', text(record.purpose), true],
            ['Other income', text(info?.other_source_of_inc)],
            ['Family income a month', text(info?.est_monthly_fam_inc)],
          ]}
        />
        <Group
          title="Work"
          fields={[
            ['Position', text(info?.employment_position)],
            ['Employer', text(company?.employer)],
            ['Employment status', text(work?.employment_status)],
            ['Time in service', text(work?.term_in_service)],
            ['Station', text(work?.station)],
            ['Division', text(work?.division)],
            ['Employee number', text(work?.employment_number)],
            ['Contract', text(company?.contract_duration)],
            ['Monthly gross', peso(work?.monthly_gross)],
            ['Monthly net', peso(work?.monthly_net)],
            ['Salary', peso(company?.salary)],
            ['Office address', text(work?.office_address), true],
          ]}
        />
        <Group
          title="Spouse"
          fields={[
            ['Name', text(spouse?.fullname)],
            ['Mobile', text(spouse?.contact_no)],
            ['Occupation', text(spouse?.occupation)],
            ['Company', text(spouse?.company)],
            ['Department or branch', text(spouse?.dept_branch)],
            ['Time in service', text(spouse?.length_of_service)],
            ['Salary', peso(spouse?.salary)],
            ['Company contact', text(spouse?.company_contact_person)],
            ['Work address', text(spouse?.work_address), true],
          ]}
        />
        <References references={record.details.references} />
      </CardBody>
    </Card>
  );
};

export default ApplicationRecordView;
