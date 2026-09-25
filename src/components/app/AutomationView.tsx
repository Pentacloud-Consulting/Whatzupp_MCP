'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { Zap, Save, Trash2, Pencil, PlayCircle, PauseCircle, RotateCcw, Eye } from 'lucide-react';
import NativeJourneyBuilder from '@/components/automation/NativeJourneyBuilder';
import JourneyBuilderV2 from '@/components/automationV2/JourneyBuilderV2';

interface JourneyItem {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  workspaceId: string;
  nodes: any[];
  edges: any[];
  updatedAt: string;
}

export default function AutomationView() {
  const { activeWorkspace, state } = useWorkspace();
  const [journeys, setJourneys] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'builder' | 'builder_v2'>('list');
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);

  const fetchJourneys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation');
      const data = await res.json();
      if (data.success) setJourneys(data.data);
    } catch (e) {
      console.error('Failed to fetch automations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'list') fetchJourneys();
  }, [activeView, fetchJourneys]);

  const deleteJourney = async (id: string) => {
    if (!confirm('Delete this automation permanently?')) return;
    try {
      await fetch(`/api/automation/${id}`, { method: 'DELETE' });
      setJourneys((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (j: JourneyItem, newAction: 'activate' | 'deactivate' | 'reopen') => {
    try {
      if (newAction === 'activate') {
        const res = await fetch(`/api/automation/${j.id}/activate`, { method: 'POST' });
        const data = await res.json();
        if (data.success) alert(`Journey activated! ${data.contactsEnrolled} contacts enrolled.`);
        else alert(`Error: ${data.error}`);
      } else if (newAction === 'deactivate') {
        await fetch(`/api/automation/${j.id}/deactivate`, { method: 'POST' });
      } else if (newAction === 'reopen') {
        await fetch(`/api/automation/${j.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'draft' }),
        });
      }
      fetchJourneys();
    } catch (e) {
      console.error(e);
    }
  };

  const openBuilder = (journeyId: string | null) => {
    setEditingJourneyId(journeyId);
    setActiveView('builder');
  };

  const openBuilderV2 = (journeyId: string | null) => {
    setEditingJourneyId(journeyId);
    setActiveView('builder_v2');
  };

  const getWorkspaceName = (wsId: string) => {
    const ws = state.workspaces.find((w) => w.id === wsId);
    return ws?.name || wsId || '—';
  };

  if (activeView === 'builder') {
    return (
      <NativeJourneyBuilder
        journeyId={editingJourneyId}
        onClose={() => setActiveView('list')}
      />
    );
  }

  if (activeView === 'builder_v2') {
    return (
      <JourneyBuilderV2
        journeyId={editingJourneyId}
        onClose={() => setActiveView('list')}
      />
    );
  }

  // ── List View ──
  return (
    <div className="flex-1 overflow-y-auto p-8" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
              <Zap size={22} className="text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automation</h1>
              <p className="text-sm text-slate-500">Design WhatsApp messaging journeys</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openBuilder(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Save size={16} /> New Legacy Journey
            </button>
            <button
              onClick={() => openBuilderV2(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold shadow hover:bg-slate-800 transition-colors"
            >
              <Zap size={16} className="text-emerald-400" /> New Enterprise Journey
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          </div>
        ) : journeys.length === 0 ? (
          /* ── Empty State ── */
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-5">
              <Zap size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No automations yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Create your first journey to start automating WhatsApp conversations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => openBuilder(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors"
              >
                Create Legacy Journey
              </button>
              <button
                onClick={() => openBuilderV2(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold shadow hover:bg-slate-800 transition-colors"
              >
                Create Enterprise Journey
              </button>
            </div>
          </div>
        ) : (
          /* ── Table ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Modified</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map((j) => (
                  <tr key={j.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-sm text-slate-800">{j.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({j.nodes?.length || 0} steps)</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md tracking-wide ${
                          j.status === 'active'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getWorkspaceName(j.workspaceId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(j.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {j.status === 'draft' && (
                          <>
                            <button onClick={() => updateStatus(j, 'activate')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 font-bold text-[11px] transition-colors"><PlayCircle size={14} /> ACTIVATE</button>
                            <button onClick={() => openBuilder(j.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 font-bold text-[11px] transition-colors"><Pencil size={14} /> EDIT</button>
                          </>
                        )}
                        {j.status === 'active' && (
                          <>
                            <button onClick={() => updateStatus(j, 'deactivate')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded hover:bg-red-100 font-bold text-[11px] transition-colors"><PauseCircle size={14} /> DEACTIVATE</button>
                            <button onClick={() => openBuilder(j.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-bold text-[11px] transition-colors"><Eye size={14} /> VIEW</button>
                          </>
                        )}
                        {(j.status === 'completed' || j.status === 'cancelled') && (
                          <button onClick={() => updateStatus(j, 'reopen')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-bold text-[11px] transition-colors"><RotateCcw size={14} /> REOPEN</button>
                        )}
                        <button onClick={() => deleteJourney(j.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded hover:bg-red-50 hover:text-red-600 font-bold text-[11px] transition-colors"><Trash2 size={14} /> DELETE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
