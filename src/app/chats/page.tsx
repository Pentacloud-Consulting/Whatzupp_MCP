'use client';

// src/app/chats/page.tsx
// Chats route — renders AppShell with initialScreen="chats"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function ChatsPage() {
  return (
    <WorkspaceProvider initialScreen="chats">
      <AppShell />
    </WorkspaceProvider>
  );
}
