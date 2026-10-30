'use client';

// src/app/admin/tenants/page.tsx
// Super Admin Tenants & Client Management
import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Users2, Shield, Cloud, Power, CheckCircle2, AlertCircle, Trash2, Plus, X, Loader2, LogIn, ServerCrash, FolderOpen } from 'lucide-react';

type TenantStatus = 'loading' | 'auth_error' | 'error' | 'success';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [pageStatus, setPageStatus] = useState<TenantStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantCode, setNewTenantCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadTenants = useCallback(async () => {
    setPageStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.status === 401) {
        setPageStatus('auth_error');
        setErrorMessage('You must be logged in as a Super Admin to access this page.');
        return;
      }
      if (res.status === 403) {
        setPageStatus('auth_error');
        setErrorMessage('Access denied. Super Admin privileges are required to manage tenants.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPageStatus('error');
        setErrorMessage(data.error || `Server error (${res.status})`);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.tenants)) {
        setTenants(data.tenants);
      } else {
        setTenants([]);
      }
      setPageStatus('success');
    } catch (err: any) {
      setPageStatus('error');
      setErrorMessage(err.message || 'Failed to connect to the server.');
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const toggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          tenantId,
          status: newStatus,
        }),
      });
      if (res.ok) loadTenants();
    } catch {
      // ignore
    }
  };

  const deleteTenant = async (tenantId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete tenant "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          tenantId,
        }),
      });
      if (res.ok) loadTenants();
    } catch {
      // ignore
    }
  };

  const createTenant = async () => {
    if (!newTenantName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: newTenantName.trim(),
          tenantCode: newTenantCode.trim() || newTenantName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTenantName('');
        setNewTenantCode('');
        loadTenants();
      }
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  // --- Loading State ---
  if (pageStatus === 'loading') {
    return (
      <div className="space-y-8 max-w-7xl">
        <div>
          <div className="h-9 w-96 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="h-3 w-36 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="flex gap-2">
                  <div className="h-7 w-20 bg-gray-50 rounded-lg animate-pulse" />
                  <div className="h-7 w-28 bg-gray-50 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Auth Error State ---
  if (pageStatus === 'auth_error') {
    return (
      <div className="space-y-8 max-w-7xl">
        <div>
          <h1 className="font-[Syne] text-3xl font-bold text-gray-900 tracking-tight">
            Tenants & Enterprise Clients Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Monitor all active client organizations, licensed workspace products, and user allocations.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
            <LogIn size={36} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500 text-sm text-center max-w-md mb-6">{errorMessage}</p>
          <a
            href="/login"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]"
          >
            Sign In as Super Admin
          </a>
        </div>
      </div>
    );
  }

  // --- Server Error State ---
  if (pageStatus === 'error') {
    return (
      <div className="space-y-8 max-w-7xl">
        <div>
          <h1 className="font-[Syne] text-3xl font-bold text-gray-900 tracking-tight">
            Tenants & Enterprise Clients Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Monitor all active client organizations, licensed workspace products, and user allocations.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center mb-6">
            <ServerCrash size={36} className="text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-500 text-sm text-center max-w-md mb-6">{errorMessage}</p>
          <button
            onClick={loadTenants}
            className="px-6 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold shadow-lg hover:bg-gray-800 transition-all hover:scale-[1.02]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- Success: Empty State ---
  if (tenants.length === 0) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-[Syne] text-3xl font-bold text-gray-900 tracking-tight">
              Tenants & Enterprise Clients Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Monitor all active client organizations, licensed workspace products, and user allocations.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Plus size={16} /> Add Tenant
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center mb-6">
            <FolderOpen size={40} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Tenants Yet</h2>
          <p className="text-gray-500 text-sm text-center max-w-md mb-6">
            No enterprise client organizations have been created or approved yet.<br />
            Create your first tenant to get started, or approve pending signup requests from the Approvals Queue.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Plus size={18} /> Create First Tenant
            </button>
            <a
              href="/admin/approvals"
              className="px-6 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={18} /> View Approvals
            </a>
          </div>
        </div>

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <CreateTenantModal
            name={newTenantName}
            code={newTenantCode}
            isCreating={isCreating}
            onNameChange={setNewTenantName}
            onCodeChange={setNewTenantCode}
            onCreate={createTenant}
            onClose={() => { setShowCreateModal(false); setNewTenantName(''); setNewTenantCode(''); }}
          />
        )}
      </div>
    );
  }

  // --- Success: Tenants List ---
  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[Syne] text-3xl font-bold text-gray-900 tracking-tight">
            Tenants & Enterprise Clients Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Monitor all active client organizations, licensed workspace products, and user allocations.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] flex items-center gap-2"
        >
          <Plus size={16} /> Add Tenant
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-2xl font-black text-gray-900">{tenants.length}</div>
          <div className="text-xs text-gray-500 font-semibold mt-0.5">Total Tenants</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-2xl font-black text-emerald-600">{tenants.filter(t => t.status === 'active').length}</div>
          <div className="text-xs text-gray-500 font-semibold mt-0.5">Active</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-2xl font-black text-amber-600">{tenants.filter(t => t.status !== 'active').length}</div>
          <div className="text-xs text-gray-500 font-semibold mt-0.5">Disabled</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="text-2xl font-black text-gray-900">{tenants.reduce((sum, t) => sum + (t.userUsage || 0), 0)}</div>
          <div className="text-xs text-gray-500 font-semibold mt-0.5">Total Users</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {t.tenantCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{t.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(t.id, t.status)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    t.status === 'active'
                      ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                  }`}
                  title={t.status === 'active' ? 'Disable Tenant' : 'Enable Tenant'}
                >
                  <Power size={18} />
                </button>

                <button
                  onClick={() => deleteTenant(t.id, t.name)}
                  className="p-2.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                  title="Delete Tenant"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-700">
              <div className="font-semibold text-gray-500">Licensed Workspace Products:</div>
              <div className="flex items-center gap-2 flex-wrap">
                {t.tenantWorkspaces?.map((ws: any) => (
                  <span key={ws.workspaceType} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-mono font-bold flex items-center gap-1">
                    <Cloud size={12} className="text-[#25D366]" /> {ws.workspaceType}
                  </span>
                ))}
                {(!t.tenantWorkspaces || t.tenantWorkspaces.length === 0) && (
                  <span className="text-gray-400 italic">No workspaces assigned</span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-700">
              <div className="font-semibold text-gray-500">User Allocation & Usage:</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${t.userUsage >= t.userLimit ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (t.userUsage / Math.max(1, t.userLimit)) * 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-gray-700 whitespace-nowrap">
                  {t.userUsage} / {t.userLimit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          name={newTenantName}
          code={newTenantCode}
          isCreating={isCreating}
          onNameChange={setNewTenantName}
          onCodeChange={setNewTenantCode}
          onCreate={createTenant}
          onClose={() => { setShowCreateModal(false); setNewTenantName(''); setNewTenantCode(''); }}
        />
      )}
    </div>
  );
}

/* ---------- Create Tenant Modal ---------- */
function CreateTenantModal({
  name, code, isCreating,
  onNameChange, onCodeChange, onCreate, onClose,
}: {
  name: string; code: string; isCreating: boolean;
  onNameChange: (v: string) => void; onCodeChange: (v: string) => void;
  onCreate: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Tenant</h2>
            <p className="text-xs text-gray-500 mt-1">Provision a new enterprise client organization</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Organization Name *</label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tenant Code (optional)</label>
            <input
              value={code}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
              placeholder="Auto-generated from name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1">Uppercase letters, numbers, and underscores only</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isCreating ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Create Tenant</>}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
