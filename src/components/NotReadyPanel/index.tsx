import React from 'react';
import { Card, CardBody } from '@/components/Card';

/**
 * Stands in for a menu page that has no content yet, so staff see a plain answer instead of
 * a blank screen under the title. Server-renderable: no hooks.
 */
const NotReadyPanel: React.FC = () => (
  <Card>
    <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-whiten text-primary dark:bg-meta-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>
      <p className="font-display text-xl text-black dark:text-white">This page isn&apos;t ready yet.</p>
      <p className="text-body dark:text-bodydark">It&apos;s being built. Nothing here can be used yet.</p>
    </CardBody>
  </Card>
);

export default NotReadyPanel;
