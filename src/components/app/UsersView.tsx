'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Activity, Mail, CheckCircle2, Clock, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface TenantUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  workspacePermissions: { workspaceType: string }[];
}

interface TenantUsage {
  plan: string;
  userLimit: number;
  activeUsers: number;
  pendingInvites: number;
  salesCloudUsers: number;
  sfmcUsers: number;
  renewalDate: string | null;
}

export default function UsersView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [inviteWorkspaces, setInviteWorkspaces] = useState<string[]>([]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tenant/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setUsage(data.usage);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    try {
      const method = modalMode === 'EDIT' ? 'PUT' : 'POST';
      const payload: any = {
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        workspaces: inviteWorkspaces,
      };
      if (modalMode === 'CREATE') {
        payload.password = invitePassword;
      }
      if (modalMode === 'EDIT') {
        payload.userId = editingUserId;
        if (invitePassword) {
          payload.password = invitePassword;
        }
      }

      const res = await fetch('/api/tenant/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setInviteError(data.error || `Failed to ${modalMode.toLowerCase()} user`);
        return;
      }

      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInvitePassword('');
      setShowPassword(false);
      setInviteName('');
      setInviteRole('AGENT');
      setInviteWorkspaces(user?.workspacePermissions?.length ? [user.workspacePermissions[0]] : []);
      fetchUsers();
    } catch (e: any) {
      setInviteError(e.message || 'Network error');
    }
  };

  const toggleWorkspace = (ws: string) => {
    if (inviteWorkspaces.includes(ws)) {
      setInviteWorkspaces(inviteWorkspaces.filter(w => w !== ws));
    } else {
      setInviteWorkspaces([...inviteWorkspaces, ws]);
    }
  };

  const openEditModal = (u: TenantUser) => {
    setModalMode('EDIT');
    setEditingUserId(u.id);
    setInviteName(u.fullName);
    setInviteEmail(u.email);
    setInviteRole(u.role);
    setInvitePassword('');
    setShowPassword(false);
    setInviteWorkspaces(u.workspacePermissions.map(wp => wp.workspaceType));
    setInviteError('');
    setIsInviteModalOpen(true);
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingUserId(null);
    setInviteName('');
    setInviteEmail('');
    setInvitePassword('');
    setShowPassword(false);
    setInviteRole('AGENT');
    setInviteWorkspaces(user?.workspacePermissions?.length ? [user.workspacePermissions[0]] : []);
    setInviteError('');
    setIsInviteModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/tenant/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(data.error || 'Failed to delete user');
        return;
      }
      
      fetchUsers();
    } catch (err) {
      alert('Network error while deleting user');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="text-[#00C853]" />
              Users & Teams
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your tenant employees, roles, and workspace access.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus size={16} />
            Create User
          </button>
        </div>

        {/* License Usage Dashboard */}
        {usage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
              <div className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">Total Licenses</div>
              <div className="text-3xl font-black text-emerald-900">
                {usage.activeUsers + usage.pendingInvites} <span className="text-lg text-emerald-600/70">/ {usage.userLimit}</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-1">{usage.plan} Plan</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Sales Cloud</div>
              <div className="text-3xl font-black text-slate-800">{usage.salesCloudUsers}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Users Enabled</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">SFMC</div>
              <div className="text-3xl font-black text-slate-800">{usage.sfmcUsers}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">Users Enabled</div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
              <div className="text-blue-800 text-xs font-bold uppercase tracking-wider mb-1">Pending</div>
              <div className="text-3xl font-black text-blue-900">{usage.pendingInvites}</div>
              <div className="text-[10px] text-blue-600 font-medium mt-1">Invitations Sent</div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Workspaces</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          <Shield size={10} />
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {u.workspacePermissions.map((wp) => (
                            <span key={wp.workspaceType} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold">
                              {wp.workspaceType.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {u.status === 'ACTIVE' && <CheckCircle2 size={14} className="text-[#00C853]" />}
                          {u.status === 'PENDING_INVITATION' && <Clock size={14} className="text-amber-500" />}
                          <span className={`text-xs font-bold ${
                            u.status === 'ACTIVE' ? 'text-[#00C853]' : 
                            u.status === 'PENDING_INVITATION' ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {u.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" 
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" 
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {modalMode === 'EDIT' ? 'Edit User' : 'Create New User'}
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-5">
              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  disabled={modalMode === 'EDIT'}
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] outline-none ${modalMode === 'EDIT' ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {modalMode === 'EDIT' ? 'Reset Password (Optional)' : 'Password'}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required={modalMode === 'CREATE'}
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] outline-none pr-10"
                    placeholder={modalMode === 'EDIT' ? 'Leave blank to keep unchanged' : '••••••••'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#00C853] outline-none bg-white"
                >
                  <option value="TENANT_ADMIN">Tenant Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="AGENT">Agent</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Workspace Access</label>
                <div className="grid grid-cols-2 gap-2">
                  {['SFMC', 'SALES_CLOUD']
                    .filter(ws => user?.workspacePermissions?.includes(ws))
                    .map(ws => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => toggleWorkspace(ws)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                        inviteWorkspaces.includes(ws)
                          ? 'bg-emerald-50 border-[#00C853] text-[#00C853]'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {ws.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm shadow-md transition-all"
                >
                  {modalMode === 'EDIT' ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
