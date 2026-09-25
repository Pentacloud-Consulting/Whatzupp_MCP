'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { WorkspaceContact } from '@/types/workspace';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: WorkspaceContact[];
  workspaceId: string;
  onSuccess: () => void;
}

interface TenantUser {
  id: string;
  fullName: string;
  role: string;
}

export default function AssignModal({ isOpen, onClose, contacts, workspaceId, onSuccess }: AssignModalProps) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/tenant/users')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) {
            setUsers(data.users);
          } else {
            setError(data.error || 'Failed to fetch users');
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError('Please select a user to assign.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: contacts.map(c => c.id),
          assigneeId: selectedUserId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to assign contacts.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Assign Contacts</h2>
              <p className="text-xs font-medium text-slate-500">
                Assigning {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Assignee</label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedUserId === 'unassigned' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input
                    type="radio"
                    name="assignee"
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={selectedUserId === 'unassigned'}
                    onChange={() => setSelectedUserId('unassigned')}
                  />
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Unassigned</div>
                    <div className="text-[10px] font-semibold text-slate-500">Remove owner from contacts</div>
                  </div>
                </label>
                
                {users.map(u => (
                  <label key={u.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedUserId === u.id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="assignee"
                      className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={selectedUserId === u.id}
                      onChange={() => setSelectedUserId(u.id)}
                    />
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] font-semibold text-slate-500">{u.role.replace('_', ' ')}</div>
                    </div>
                  </label>
                ))}
                {users.length === 0 && !loading && (
                  <p className="text-xs text-slate-500 mt-2 px-1">No users found in your tenant.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={saving || !selectedUserId}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${selectedUserId === 'unassigned' ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/25' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25'}`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            <span>{selectedUserId === 'unassigned' ? 'Unassign' : 'Assign'} {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
