'use client';

// src/components/app/CoverageDashboard.tsx
// Enterprise Coverage Management Dashboard
// Phase 7.1 — KPI Cards, Tabbed Coverage Table, Details Drawer, New Coverage Wizard

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, ShieldOff, Clock, Plus, Search, Filter,
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Eye, CheckCircle2,
  XCircle, RotateCcw, Timer, AlertTriangle, Users2, UserCheck, UserX,
  ArrowRight, X, Check, ChevronDown, Zap, Activity, RefreshCw, Pencil, Trash2
} from 'lucide-react';

// ─── Types ───
interface CoverageRecord {
  id: string;
  tenantId: string;
  workspaceId: string;
  workspaceType: string;
  coverageSource: string;
  originalOwnerId: string;
  temporaryOwnerId: string;
  scopeType: string;
  scopeTargetIds?: string[];
  startTime: string;
  endTime: string;
  priority: string;
  status: string;
  effectiveStatus: string;
  approvalStatus: string;
  coverageMode: string;
  coverageType?: string;
  createdBy: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  revokedBy?: string;
  revokedDate?: string;
  extensionReason?: string;
  coverageVersion: number;
  isDeleted: boolean;
}

type TabKey = 'active' | 'scheduled' | 'expired' | 'revoked';

// ─── Mock User Directory (for name resolution) ───
const USER_DIRECTORY: Record<string, string> = {
  'user-waseem': 'Waseem Mohamed',
  'user-zuhaib': 'Zuhaib Ahmed',
  'user-tushti': 'Tushti Sharma',
  'user-ravi': 'Ravi Kumar',
  'user-admin': 'Admin User',
};

function resolveUserName(userId: string): string {
  if (!userId) return 'Unknown User';
  return USER_DIRECTORY[userId] || 'Unknown User';
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Priority Badge ───
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  const icons: Record<string, React.ReactNode> = {
    CRITICAL: <AlertTriangle size={10} />,
    HIGH: <Zap size={10} />,
    MEDIUM: <Activity size={10} />,
    LOW: <Clock size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${styles[priority] || styles.LOW}`}>
      {icons[priority] || icons.LOW}
      {priority}
    </span>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
    REVOKED: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  const icons: Record<string, React.ReactNode> = {
    ACTIVE: <CheckCircle2 size={10} />,
    PENDING: <Clock size={10} />,
    SCHEDULED: <Calendar size={10} />,
    EXPIRED: <Timer size={10} />,
    REVOKED: <XCircle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${styles[status] || styles.EXPIRED}`}>
      {icons[status] || icons.EXPIRED}
      {status}
    </span>
  );
}

// ─── Time Display ───
function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function timeRemaining(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Coverage Details Drawer ───
function CoverageDetailsDrawer({ coverage, onClose, onApprove, onRevoke, onExtend }: {
  coverage: CoverageRecord;
  onClose: () => void;
  onApprove: (id: string) => void;
  onRevoke: (id: string) => void;
  onExtend: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Coverage Details</h3>
                <p className="text-[10px] text-slate-400 font-bold">{coverage.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6">

            {/* Status + Priority */}
            <div className="flex items-center gap-2">
              <StatusBadge status={coverage.effectiveStatus} />
              <PriorityBadge priority={coverage.priority} />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                {coverage.coverageMode}
              </span>
            </div>

            {/* Owner Transfer Visual */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Ownership Transfer</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs border-2 border-blue-200">
                    {getInitials(resolveUserName(coverage.originalOwnerId))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">{resolveUserName(coverage.originalOwnerId)}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Original</span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-blue-200 via-emerald-300 to-emerald-400 relative">
                    <ArrowRight size={14} className="absolute -right-1 -top-[7px] text-emerald-500" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs border-2 border-emerald-200">
                    {getInitials(resolveUserName(coverage.temporaryOwnerId))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">{resolveUserName(coverage.temporaryOwnerId)}</span>
                  <span className="text-[9px] text-emerald-500 font-semibold">Covering</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Coverage Type', value: coverage.coverageType || 'Manual' },
                { label: 'Scope', value: coverage.scopeType?.replace('_', ' ') },
                { label: 'Start', value: formatDateTime(coverage.startTime) },
                { label: 'End', value: formatDateTime(coverage.endTime) },
                { label: 'Time Remaining', value: timeRemaining(coverage.endTime) },
                { label: 'Approval', value: coverage.approvalStatus },
                { label: 'Created By', value: resolveUserName(coverage.createdBy) },
                { label: 'Version', value: `v${coverage.coverageVersion}` },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-xl px-3 py-2.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Audit Timeline */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Audit Timeline</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Coverage Created</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(coverage.createdDate)} by {resolveUserName(coverage.createdBy)}</p>
                  </div>
                </div>
                {coverage.approvedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Coverage Approved</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(coverage.approvedDate)} by {resolveUserName(coverage.approvedBy || '')}</p>
                    </div>
                  </div>
                )}
                {coverage.revokedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle size={12} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Coverage Revoked</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(coverage.revokedDate)} by {resolveUserName(coverage.revokedBy || '')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {coverage.effectiveStatus === 'ACTIVE' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onExtend(coverage.id)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} /> Extend
                </button>
                <button
                  onClick={() => onRevoke(coverage.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={13} /> Revoke
                </button>
              </div>
            )}
            {coverage.effectiveStatus === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onApprove(coverage.id)}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #00C853, #00E676)' }}
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  onClick={() => onRevoke(coverage.id)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── New Coverage Wizard Modal ───
function NewCoverageWizard({ onClose, onSubmit, users }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  users: { id: string; name: string }[];
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    originalOwnerId: '',
    temporaryOwnerId: '',
    coverageType: 'PLANNED',
    priority: 'MEDIUM',
    scopeType: 'ALL_CONTACTS',
    startTime: '',
    endTime: '',
    coverageMode: 'FULL_TRANSFER',
  });

  const totalSteps = 6;

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.originalOwnerId;
      case 2: return !!form.temporaryOwnerId && form.temporaryOwnerId !== form.originalOwnerId;
      case 3: return !!form.coverageType;
      case 4: return !!form.scopeType;
      case 5: return !!form.startTime && !!form.endTime && new Date(form.endTime) > new Date(form.startTime);
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = () => {
    onSubmit({
      ...form,
      priority: form.coverageType === 'EMERGENCY' ? 'HIGH' : form.priority,
    });
  };

  const stepLabels = ['Select Owner', 'Select Backup', 'Coverage Type', 'Scope', 'Duration', 'Review'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">New Coverage Transfer</h3>
              <p className="text-[10px] text-slate-400 font-bold">Step {step} of {totalSteps} — {stepLabels[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-5 min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Select Owner */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-3">Who is going out of office?</p>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setForm({ ...form, originalOwnerId: u.id })}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        form.originalOwnerId === u.id
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        form.originalOwnerId === u.id ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getInitials(u.name)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{u.name}</span>
                      {form.originalOwnerId === u.id && <Check size={16} className="ml-auto text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Select Backup */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-3">Who will cover their contacts?</p>
                  {users.filter(u => u.id !== form.originalOwnerId).map(u => (
                    <button
                      key={u.id}
                      onClick={() => setForm({ ...form, temporaryOwnerId: u.id })}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        form.temporaryOwnerId === u.id
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        form.temporaryOwnerId === u.id ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getInitials(u.name)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{u.name}</span>
                      {form.temporaryOwnerId === u.id && <Check size={16} className="ml-auto text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Coverage Type */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-3">What type of coverage?</p>
                  {[
                    { key: 'PLANNED', label: 'Planned Leave', desc: 'Vacation, PTO, scheduled absence', icon: <Calendar size={18} />, color: 'blue' },
                    { key: 'EMERGENCY', label: 'Emergency Leave', desc: 'Sudden absence, medical leave', icon: <AlertTriangle size={18} />, color: 'rose' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setForm({ ...form, coverageType: opt.key, priority: opt.key === 'EMERGENCY' ? 'HIGH' : 'MEDIUM' })}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        form.coverageType === opt.key
                          ? `bg-${opt.color}-50 border-${opt.color}-300 shadow-sm`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        form.coverageType === opt.key ? `bg-${opt.color}-100 text-${opt.color}-600` : 'bg-slate-100 text-slate-400'
                      }`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{opt.desc}</p>
                      </div>
                      {form.coverageType === opt.key && <Check size={16} className="ml-auto text-emerald-500" />}
                    </button>
                  ))}

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Priority</label>
                    <div className="flex gap-2">
                      {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, priority: p })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold border transition-all ${
                            form.priority === p
                              ? p === 'CRITICAL' ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : p === 'HIGH' ? 'bg-orange-50 border-orange-300 text-orange-700'
                              : p === 'MEDIUM' ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-slate-50 border-slate-300 text-slate-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Scope */}
              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-3">What should the backup user access?</p>
                  {[
                    { key: 'ALL_CONTACTS', label: 'All Contacts', desc: 'Full access to all assigned contacts', icon: <Users2 size={16} /> },
                    { key: 'SELECTED_CONTACTS', label: 'Selected Contacts', desc: 'Choose specific contacts', icon: <UserCheck size={16} /> },
                    { key: 'LABEL_BASED', label: 'Label Based', desc: 'Filter by labels or tags', icon: <Filter size={16} /> },
                    { key: 'TEAM_BASED', label: 'Team Based', desc: 'Transfer to entire team', icon: <Users2 size={16} /> },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setForm({ ...form, scopeType: opt.key })}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        form.scopeType === opt.key
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        form.scopeType === opt.key ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{opt.label}</p>
                        <p className="text-[10px] text-slate-400">{opt.desc}</p>
                      </div>
                      {form.scopeType === opt.key && <Check size={14} className="ml-auto text-emerald-500" />}
                    </button>
                  ))}

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Coverage Mode</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'FULL_TRANSFER', label: 'Full Transfer' },
                        { key: 'SHARED', label: 'Shared Access' },
                      ].map(m => (
                        <button
                          key={m.key}
                          onClick={() => setForm({ ...form, coverageMode: m.key })}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            form.coverageMode === m.key
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Duration */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700 mb-3">Set the coverage period</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={e => setForm({ ...form, endTime: e.target.value })}
                      min={form.startTime}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
                    />
                  </div>
                  {form.startTime && form.endTime && new Date(form.endTime) > new Date(form.startTime) && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <Timer size={14} />
                      Duration: {timeRemaining(form.endTime)}
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Review */}
              {step === 6 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-3">Review & Submit</p>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                    {[
                      { label: 'Original Owner', value: resolveUserName(form.originalOwnerId) },
                      { label: 'Backup Owner', value: resolveUserName(form.temporaryOwnerId) },
                      { label: 'Type', value: form.coverageType },
                      { label: 'Priority', value: form.priority },
                      { label: 'Scope', value: form.scopeType.replace('_', ' ') },
                      { label: 'Mode', value: form.coverageMode },
                      { label: 'Start', value: form.startTime ? formatDateTime(form.startTime) : '—' },
                      { label: 'End', value: form.endTime ? formatDateTime(form.endTime) : '—' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.label}</span>
                        <span className="text-xs font-extrabold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg"
              style={{ background: canProceed() ? 'linear-gradient(135deg, #00C853, #00E676)' : '#94a3b8' }}
            >
              Next <ChevronRight size={14} className="inline ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #00C853, #00E676)' }}
            >
              <ShieldCheck size={14} className="inline mr-1" /> Create Coverage
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═════════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ═════════════════════════════════════════════

export default function CoverageDashboard({ workspaceId: propWorkspaceId }: { workspaceId?: string }) {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const wsId = propWorkspaceId || activeWorkspace?.id || 'salescloud-ws-1';
  const isSalesCloud = activeWorkspace?.type === 'salescloud' || wsId === 'salescloud-ws-1';
  const wsKey = isSalesCloud
    ? (process.env.NEXT_PUBLIC_WORKSPACE_SALESCLOUD_API_KEY || 'salescloud-ws-key-secret')
    : (process.env.NEXT_PUBLIC_WORKSPACE_SFMC_API_KEY || 'sfmc-secret-key-123');

  const [coverages, setCoverages] = useState<CoverageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageRecord | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string }[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/users');
      const data = await res.json();
      if (data.success && data.users) {
        const mapped = data.users.map((u: any) => ({
          id: u.id,
          name: u.fullName || u.name || u.email,
        }));
        setAvailableUsers(mapped);
        mapped.forEach((m: any) => {
          USER_DIRECTORY[m.id] = m.name;
        });
      }
    } catch (e) {
      console.error('[CoverageDashboard] fetchUsers error:', e);
    }
  }, []);

  // Fetch coverages
  const fetchCoverages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${wsId}/coverage`, {
        headers: { 'X-Workspace-Key': wsKey },
      });
      const data = await res.json();
      if (data.success && data.coverages) {
        setCoverages(data.coverages);
      }
    } catch (e) {
      console.error('[CoverageDashboard] fetchCoverages error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [wsId, wsKey]);

  useEffect(() => { 
    fetchCoverages(); 
    fetchUsers();
  }, [fetchCoverages, fetchUsers]);

  // KPIs
  const kpis = useMemo(() => {
    const now = Date.now();
    let active = 0, scheduled = 0, expiringToday = 0, emergency = 0;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const endOfToday = new Date().setHours(23, 59, 59, 999);

    coverages.forEach(c => {
      if (c.isDeleted) return;
      if ((c.priority === 'CRITICAL' || c.priority === 'HIGH') && (c.effectiveStatus === 'ACTIVE' || c.effectiveStatus === 'PENDING')) emergency++;
      if (c.effectiveStatus === 'ACTIVE') {
        active++;
        const end = new Date(c.endTime).getTime();
        if (end >= startOfToday && end <= endOfToday) expiringToday++;
      } else if (c.effectiveStatus === 'PENDING' || c.effectiveStatus === 'SCHEDULED') {
        scheduled++;
      }
    });

    return { active, scheduled, expiringToday, emergency };
  }, [coverages]);

  // Filtered coverages
  const filteredCoverages = useMemo(() => {
    const now = Date.now();
    let filtered = coverages.filter(c => !c.isDeleted);

    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(c => c.effectiveStatus === 'ACTIVE' || c.effectiveStatus === 'PENDING');
        break;
      case 'scheduled':
        filtered = filtered.filter(c => c.effectiveStatus === 'SCHEDULED' || (c.effectiveStatus === 'PENDING' && new Date(c.startTime).getTime() > now));
        break;
      case 'expired':
        filtered = filtered.filter(c => c.effectiveStatus === 'EXPIRED' || (c.effectiveStatus === 'ACTIVE' && new Date(c.endTime).getTime() < now));
        break;
      case 'revoked':
        filtered = filtered.filter(c => c.effectiveStatus === 'REVOKED');
        break;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        resolveUserName(c.originalOwnerId).toLowerCase().includes(q) ||
        resolveUserName(c.temporaryOwnerId).toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [coverages, activeTab, searchQuery]);

  // Actions
  const handleCreateCoverage = async (formData: any) => {
    try {
      const res = await fetch(`/api/workspaces/${wsId}/coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workspace-Key': wsKey },
        body: JSON.stringify({
          ...formData,
          tenantId: user?.tenantId || 'tenant-1',
          workspaceId: wsId,
          workspaceType: isSalesCloud ? 'salescloud' : 'sfmc',
          coverageSource: 'DASHBOARD',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsWizardOpen(false);
        fetchCoverages();
      } else {
        alert(data.error || 'Failed to create coverage');
      }
    } catch (e) {
      alert('Network error while creating coverage');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const coverage = coverages.find(c => c.id === id);
      await fetch(`/api/workspaces/${wsId}/coverage/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workspace-Key': wsKey },
        body: JSON.stringify({ version: coverage?.coverageVersion || 1 }),
      });
      setSelectedCoverage(null);
      fetchCoverages();
    } catch (e) {
      alert('Failed to approve coverage');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this coverage?')) return;
    try {
      await fetch(`/api/workspaces/${wsId}/coverage/${id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workspace-Key': wsKey },
      });
      setSelectedCoverage(null);
      fetchCoverages();
    } catch (e) {
      alert('Failed to revoke coverage');
    }
  };

  const handleExtend = async (id: string) => {
    const newEnd = prompt('Enter new end date/time (YYYY-MM-DDTHH:MM):', '');
    if (!newEnd) return;
    const coverage = coverages.find(c => c.id === id);
    try {
      await fetch(`/api/workspaces/${wsId}/coverage/${id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Workspace-Key': wsKey },
        body: JSON.stringify({
          version: coverage?.coverageVersion || 1,
          newEndTime: new Date(newEnd).toISOString(),
          reason: 'Extended from dashboard',
        }),
      });
      setSelectedCoverage(null);
      fetchCoverages();
    } catch (e) {
      alert('Failed to extend coverage');
    }
  };

  const kpiCards = [
    {
      title: 'Active Coverages',
      value: kpis.active,
      icon: <ShieldCheck size={20} />,
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      subtitle: `${kpis.active} agents covered`,
      trend: kpis.active > 0 ? '+' + kpis.active : '0',
      isUp: kpis.active > 0,
    },
    {
      title: 'Scheduled',
      value: kpis.scheduled,
      icon: <Calendar size={20} />,
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600',
      subtitle: 'Pending activation',
      trend: kpis.scheduled > 0 ? '+' + kpis.scheduled : '0',
      isUp: kpis.scheduled > 0,
    },
    {
      title: 'Expiring Today',
      value: kpis.expiringToday,
      icon: <Timer size={20} />,
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
      subtitle: 'Requires attention',
      trend: kpis.expiringToday > 0 ? kpis.expiringToday + '' : '0',
      isUp: false,
    },
    {
      title: 'Emergency',
      value: kpis.emergency,
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-rose-50 border-rose-100 text-rose-600',
      subtitle: 'High/Critical priority',
      trend: kpis.emergency > 0 ? kpis.emergency + '' : '0',
      isUp: false,
    },
  ];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: coverages.filter(c => c.effectiveStatus === 'ACTIVE' || c.effectiveStatus === 'PENDING').length },
    { key: 'scheduled', label: 'Scheduled', count: coverages.filter(c => c.effectiveStatus === 'SCHEDULED').length },
    { key: 'expired', label: 'Expired', count: coverages.filter(c => c.effectiveStatus === 'EXPIRED').length },
    { key: 'revoked', label: 'Revoked', count: coverages.filter(c => c.effectiveStatus === 'REVOKED').length },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-[#00C853]" />
              Coverage Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage temporary ownership transfers, delegations, and out-of-office coverage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoverages}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Coverage
            </button>
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-lg hover:border-emerald-200/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${card.iconBg}`}>
                    {card.icon}
                  </div>
                  <span className="text-xs font-black text-slate-900 tracking-tight">{card.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  card.isUp
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : card.value > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {card.trend}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {card.value}
              </span>
              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-400">
                {card.subtitle}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── Tabs + Search ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search coverages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none w-64"
            />
          </div>
        </div>

        {/* ─── Coverage Table ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transfer</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="text-slate-300 animate-spin" />
                        <p className="text-sm text-slate-400 font-semibold">Loading coverages...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCoverages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <ShieldOff size={24} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">No {activeTab} coverages found</p>
                        <p className="text-xs text-slate-400">Create a new coverage transfer to get started.</p>
                        <button
                          onClick={() => setIsWizardOpen(true)}
                          className="mt-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #00C853, #00E676)' }}
                        >
                          <Plus size={14} className="inline mr-1" /> New Coverage
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCoverages.map((cov, idx) => (
                    <motion.tr
                      key={cov.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCoverage(cov)}
                    >
                      {/* Transfer (Original → Backup) */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {getInitials(resolveUserName(cov.originalOwnerId))}
                          </div>
                          <ArrowRight size={12} className="text-slate-300 shrink-0" />
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {getInitials(resolveUserName(cov.temporaryOwnerId))}
                          </div>
                          <div className="ml-1">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{resolveUserName(cov.originalOwnerId)}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold leading-tight">→ {resolveUserName(cov.temporaryOwnerId)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-slate-600">{cov.coverageType || cov.coverageMode || 'Manual'}</span>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={cov.priority} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={cov.effectiveStatus} />
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-[10px] text-slate-500 font-semibold">{formatDate(cov.startTime)}</p>
                          <p className="text-[10px] text-slate-400">→ {formatDate(cov.endTime)}</p>
                        </div>
                      </td>

                      {/* Remaining */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold ${
                          cov.effectiveStatus === 'ACTIVE' && new Date(cov.endTime).getTime() > Date.now()
                            ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {cov.effectiveStatus === 'ACTIVE' ? timeRemaining(cov.endTime) : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCoverage(cov); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleExtend(cov.id); }} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit/Extend">
                            <Pencil size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRevoke(cov.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Revoke/Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Details Drawer ─── */}
      {selectedCoverage && (
        <CoverageDetailsDrawer
          coverage={selectedCoverage}
          onClose={() => setSelectedCoverage(null)}
          onApprove={handleApprove}
          onRevoke={handleRevoke}
          onExtend={handleExtend}
        />
      )}

      {/* ─── New Coverage Wizard ─── */}
      {isWizardOpen && (
        <NewCoverageWizard
          onClose={() => setIsWizardOpen(false)}
          onSubmit={handleCreateCoverage}
          users={availableUsers}
        />
      )}
    </div>
  );
}
