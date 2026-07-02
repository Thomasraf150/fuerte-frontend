import { redirect } from 'next/navigation';

// The /audit-logs page was a copy-paste of the Areas CRUD (it queried getAreas,
// rendered Area rows under Company/Address/Contact/Email headers, and its Delete
// button soft-deleted REAL areas via deleteArea -> AreaMutation@updateArea, which
// cascades to sub_areas). There is no audit-log backend yet, so the screen was
// both misleading and destructive. Redirect away until a real read-only audit
// page is built. The nav links are also hidden (Sidebar / SidebarOwner).
export default function AuditLogs() {
  redirect('/');
}
