'use client';

// src/app/onboarding-profile/page.tsx
// Onboarding Profile route

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function OnboardingProfilePage() {
  return (
    <WorkspaceProvider initialScreen="onboarding-profile">
      <AppShell />
    </WorkspaceProvider>
  );
}
