'use client';

// src/app/contacts/page.tsx
// Contacts route — renders AppShell with initialScreen="contacts"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function ContactsPage() {
  return (
    <WorkspaceProvider initialScreen="contacts">
      <AppShell />
    </WorkspaceProvider>
  );
}
