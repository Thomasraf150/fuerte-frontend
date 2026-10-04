"use client";

import React, { useRef, useState } from 'react';
import { useStore } from 'zustand';
import LoadError from '@/app/applications/components/LoadError';
import { useCanUpload } from '@/app/applications/components/useCanUpload';
import useApplicationBorrowerMatch from '@/hooks/useApplicationBorrowerMatch';
import useBranchAccess from '@/hooks/useBranchAccess';
import useLoanApplication from '@/hooks/useLoanApplication';
import { useAuthStore } from '@/store/authStore';
import { notConvertibleReason, parseApplicationId } from '@/utils/convertApplication';
import type { LoanApplicationRecord } from '@/utils/DataTypes';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationHeader } from './ApplicationHeader';
import { ApplicationToolbar } from './ApplicationToolbar';
import ConvertedApplication from './ConvertedApplication';
import { GoogleFormPanel } from './GoogleFormPanel';
import { ApplicationSkeleton, NotFoundCard } from './PageStates';
import { RepeatApplicantCheck } from './RepeatApplicantCheck';

type Application = ReturnType<typeof useLoanApplication>;

/**
 * A loaded application: the header, the actions, the repeat-applicant warning when there is
 * one, and under them the form (or, once the application is a borrower, the summary) with the
 * Google Form's notes beside it.
 *
 * The warning sits under the actions, not above them: it arrives a moment after the page, and
 * the buttons must not move under a finger when it does. It comes before the form and the notes
 * in the page's order, so a screen reader and the Tab key meet it first. It never changes what
 * Print or Create as borrower do.
 *
 * The notes come FIRST in the page's order, so a screen reader and the Tab key meet the
 * intake flags before a long form, as a sighted phone user does; from 1280px the grid puts
 * them in the right-hand column.
 */
const ApplicationView: React.FC<{ app: Application; record: LoanApplicationRecord }> = ({ app, record }) => {
  // Owner, Admin and Call Center may place an application on any branch; Call Center never creates borrowers.
  const mayAssign = useCanUpload();
  const isCallCenter = useStore(useAuthStore, (state) => state.user?.role?.code === 'CALLCTR');
  // Whether the form holds changes that are not saved. Print and Create as borrower use the saved application.
  const [dirty, setDirty] = useState(false);
  // The header's title: where the focus goes when a Retry of the repeat-applicant check finds nothing.
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const flags = record.intake_flags ?? [];
  const answers = record.form_answers ?? [];
  const hasPanel = flags.length > 0 || answers.length > 0;
  // A borrower already: the status Borrower created, or a borrower linked. The server refuses every
  // edit of it (editable() needs no borrower), so the page is a record, not a form. One check, New
  // Borrower's own, for the form, the toolbar and the status select.
  const converted = notConvertibleReason(record) === 'converted';
  // Whether the applicant is a borrower already is a fraud signal for staff, and whether the user may create
  // one for this application's branch is the same population's question. A borrower has nothing to warn
  // about or to create, and Call Center does neither (the server answers null to the first), so neither
  // is asked; and nothing is asked before the role is known (read a frame after mount), or a Call Center
  // user's first frame would ask.
  const worksTheApplication = mayAssign !== null && !converted && !isCallCenter;
  const repeatApplicant = useApplicationBorrowerMatch(parseApplicationId(record.id), worksTheApplication, app.saves);
  const branchAccess = useBranchAccess(worksTheApplication);

  // The role is read a frame after mount, and the form's branch choices depend on it.
  if (mayAssign === null) return <ApplicationSkeleton />;

  return (
    <div className="space-y-4">
      <ApplicationHeader record={record} headingRef={pageHeading} />
      <ApplicationToolbar
        record={record}
        converted={converted}
        canCreateBorrower={!isCallCenter}
        branchAccess={branchAccess}
        unsaved={!converted && (dirty || app.saving)}
        onStatus={app.setStatus}
        printing={app.printing}
        onPrint={app.print}
      />
      {worksTheApplication && <RepeatApplicantCheck check={repeatApplicant} fallbackFocus={pageHeading} />}
      {/*
        grid-cols-1, not the implicit auto column: an auto track is as wide as its widest
        unbreakable word (a long Google Form answer, say), and the page scrolls sideways.
        grid-cols-1 is minmax(0, 1fr), so the column keeps to the screen and the words wrap.
      */}
      <div className={hasPanel ? 'grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]' : undefined}>
        {hasPanel && <GoogleFormPanel flags={flags} answers={answers} />}
        <div className={`min-w-0 ${hasPanel ? 'xl:col-start-1 xl:row-start-1' : ''}`}>
          {converted ? (
            <ConvertedApplication record={record} canOpenBorrower={!isCallCenter} />
          ) : (
            <ApplicationForm
              key={record.id}
              record={record}
              mayAssign={mayAssign}
              saving={app.saving}
              save={app.save}
              onDirtyChange={setDirty}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/** /applications/[id]: loads the application, then shows it, or says why it cannot. */
const ApplicationPage: React.FC<{ id: string }> = ({ id }) => {
  const app = useLoanApplication(id);

  if (app.notFound) return <NotFoundCard />;
  if (app.error) return <LoadError message={app.error} onRetry={app.reload} />;
  if (!app.record) return <ApplicationSkeleton />;
  return <ApplicationView app={app} record={app.record} />;
};

export default ApplicationPage;
