import React from "react";

/**
 * The signed-out frame (sign-in is its only user): a full-height column on the cream ground, so
 * a top band, a vertically centred main and a footer can stack at every width. The one
 * ToastContainer lives in AppShell, so toasts outlive a page change.
 */
export default function BlankLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-whiten dark:bg-boxdark-2">{children}</div>;
}
