'use client';

// src/app/conversation-flows/page.tsx
// Conversation Flows route — renders AppShell with initialScreen="conversation-flows"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function ConversationFlowsPage() {
  return (
    <WorkspaceProvider initialScreen="conversation-flows">
      <AppShell />
    </WorkspaceProvider>
  );
}
