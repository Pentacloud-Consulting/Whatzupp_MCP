'use client';

// src/app/onboarding-workspace/page.tsx
// Onboarding Workspace route

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function OnboardingWorkspacePage() {
  return (
    <WorkspaceProvider initialScreen="onboarding-workspace">
      <AppShell />
    </WorkspaceProvider>
  );
}
