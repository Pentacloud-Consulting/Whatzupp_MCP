'use client';

// src/app/fast-reply/page.tsx
// Fast Reply route — renders AppShell with initialScreen="fast-reply"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function FastReplyPage() {
  return (
    <WorkspaceProvider initialScreen="fast-reply">
      <AppShell />
    </WorkspaceProvider>
  );
}
