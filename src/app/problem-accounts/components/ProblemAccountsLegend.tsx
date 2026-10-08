"use client";

import React from "react";
import { METRIC_HELP, RED } from "./ProblemAccountsColumns";

/**
 * Says what the red figures on this screen actually mean.
 *
 * The column headers carry the same wording as a `title` tooltip, but `title`
 * never fires on a touch screen and is easy to miss on a desktop — so the three
 * terms that carry the whole report (missed cut-offs, UA, SP) are defined in
 * plain text above the list as well. The three definitions are rendered from
 * METRIC_HELP, the same strings as the tooltips, so they cannot drift apart.
 *
 * Red marks two kinds of figure: the money columns (UA, SP, shortfall) and the
 * missed cut-offs COUNT, so the opening sentence names both.
 */
const ProblemAccountsLegend: React.FC = () => (
  <div className="border-b border-stroke px-4 py-3 sm:px-6 text-xs leading-relaxed text-body dark:border-strokedark dark:text-bodydark">
    <p>
      <span className="font-semibold" style={{ color: RED }}>
        Red figures
      </span>{" "}
      are money still owed, or the number of cut-offs missed.
    </p>
    <dl className="mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2 2xl:grid-cols-3">
      <div>
        <dt className="inline font-semibold text-black dark:text-white">
          Missed cut-offs:
        </dt>{" "}
        <dd className="inline">{METRIC_HELP.missed}</dd>
      </div>
      <div>
        <dt className="inline font-semibold text-black dark:text-white">
          Uncollected (UA):
        </dt>{" "}
        <dd className="inline">{METRIC_HELP.ua}</dd>
      </div>
      <div>
        <dt className="inline font-semibold text-black dark:text-white">
          Shorts (SP):
        </dt>{" "}
        <dd className="inline">{METRIC_HELP.sp}</dd>
      </div>
    </dl>
  </div>
);

export default ProblemAccountsLegend;
