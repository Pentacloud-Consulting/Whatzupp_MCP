import { Suspense } from 'react';
import CoverageDashboard from '@/components/app/CoverageDashboard';

export const metadata = {
  title: 'Coverage Management - WhatZupp',
};

export default function CoveragePage({ params }: { params: { workspaceId: string } }) {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="px-8 py-6 flex flex-col gap-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Coverage Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage temporary ownership transfers and out-of-office delegations.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400 animate-pulse">Loading dashboard...</div>}>
          <CoverageDashboard workspaceId={params.workspaceId} />
        </Suspense>
      </div>
    </div>
  );
}
