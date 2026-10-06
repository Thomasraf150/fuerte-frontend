"use client";

import React, { useRef, useState } from 'react';
import { Eye } from 'react-feather';
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
import ApplicationSummary from './ApplicationSummary';
import { ApplicationToolbar } from './ApplicationToolbar';
import ConvertedApplication from './ConvertedApplication';
import { GoogleFormPanel } from './GoogleFormPanel';
import { NotesPanel } from './NotesPanel';
import { ApplicationSkeleton, NotFoundCard } from './PageStates';
import { RepeatApplicantCheck } from './RepeatApplicantCheck';

type Application = ReturnType<typeof useLoanApplication>;

/**
 * An application the user may see but not change (Marketing, the Collection role, on another
 * branch's application: the server says so in `can_edit`). A quiet note says whose it is, over
 * the same summary a converted application shows; the server refuses an edit, so there is no form.
 */
const ViewOnlyApplication: React.FC<{ record: LoanApplicationRecord }> = ({ record }) => (
  <div className="space-y-4">
    <p className="flex items-start gap-2.5 rounded-sm border border-stroke bg-whiten px-4 py-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-bodydark">
      <Eye aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-body dark:text-bodydark" />
      <span className="min-w-0 break-words">
        {record.branch_sub?.name
          ? `View only: ${record.branch_sub.name} handles this application.`
          : 'View only: this application has no branch yet.'}
      </span>
    </p>
    <ApplicationSummary record={record} />
  </div>
);

/**
 * A loaded application: the header, the actions, the repeat-applicant warning when there is
 * one, and under them the form (or the summary: once the application is a borrower, and for a
 * user who may only view it) with the Google Form's notes beside it.
 *
 * The warning sits under the actions, not above them: it arrives a moment after the page, and
 * the buttons must not move under a finger when it does. It comes before the form and the notes
 * in the page's order, so a screen reader and the Tab key meet it first. It never changes what
 * Print or Create as borrower do.
 *
 * The side column (the Notes, then the Google Form's flags and answers) comes FIRST in the page's
 * order, so a screen reader and the Tab key meet why it was declined or rejected, and the intake
 * flags, before a long form, as a sighted phone user does; from 1280px the grid puts it in the
 * right-hand column, where it follows the page as it scrolls.
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
  const notes = record.notes ?? [];
  const hasFormPanel = flags.length > 0 || answers.length > 0;
  const hasPanel = hasFormPanel || notes.length > 0;
  // A borrower already: the status Borrower created, or a borrower linked. The server refuses every
  // edit of it (editable() needs no borrower), so the page is a record, not a form. One check, New
  // Borrower's own, for the form, the toolbar and the status select.
  const converted = notConvertibleReason(record) === 'converted';
  // Not a borrower yet, but not the user's to change: Marketing on another branch's application. The
  // server says so (can_edit), and refuses an edit, a status or a borrower from it.
  const viewOnly = !converted && record.can_edit === false;
  // Whether the applicant is a borrower already is a fraud signal, for everyone who has the application
  // open, Call Center and a view-only reader included (Call Center tells the branch). A borrower has
  // nothing to warn about, so it is not asked; and nothing is asked before the role is known (read a
  // frame after mount).
  const checksTheApplicant = mayAssign !== null && !converted;
  // Whether the user may create a borrower for this application's branch: only for those who work on it,
  // so not Call Center (it never creates borrowers) and not a view-only reader.
  const worksTheApplication = checksTheApplicant && !isCallCenter && !viewOnly;
  const repeatApplicant = useApplicationBorrowerMatch(parseApplicationId(record.id), checksTheApplicant, app.saves);
  const branchAccess = useBranchAccess(worksTheApplication);

  // The role is read a frame after mount, and the form's branch choices depend on it.
  if (mayAssign === null) return <ApplicationSkeleton />;

  return (
    <div className="space-y-4">
      <ApplicationHeader record={record} headingRef={pageHeading} />
      <ApplicationToolbar
        record={record}
        converted={converted}
        viewOnly={viewOnly}
        canCreateBorrower={!isCallCenter && !viewOnly}
        branchAccess={branchAccess}
        unsaved={!converted && (dirty || app.saving)}
        onStatus={app.setStatus}
        printing={app.printing}
        onPrint={app.print}
      />
      {checksTheApplicant && (
        <RepeatApplicantCheck check={repeatApplicant} fallbackFocus={pageHeading} audience={isCallCenter ? 'call-center' : 'branch'} />
      )}
      {/*
        grid-cols-1, not the implicit auto column: an auto track is as wide as its widest
        unbreakable word (a long Google Form answer, say), and the page scrolls sideways.
        grid-cols-1 is minmax(0, 1fr), so the column keeps to the screen and the words wrap.
      */}
      <div className={hasPanel ? 'grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]' : undefined}>
        {hasPanel && (
          <div className="space-y-4 xl:sticky xl:top-24 xl:col-start-2 xl:row-start-1 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            <NotesPanel notes={notes} />
            {hasFormPanel && <GoogleFormPanel flags={flags} answers={answers} />}
          </div>
        )}
        <div className={`min-w-0 ${hasPanel ? 'xl:col-start-1 xl:row-start-1' : ''}`}>
          {converted ? (
            <ConvertedApplication record={record} canOpenBorrower={!isCallCenter} />
          ) : viewOnly ? (
            <ViewOnlyApplication record={record} />
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
