'use client';

// src/components/conversationFlows/ConversationFlowsView.tsx
// Main entry point for the Conversation Flows module.
// Shows the flow list page or the flow builder based on state.

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { ConversationFlow } from '@/lib/conversationFlows/flowSchema';
import FlowBuilder from './FlowBuilder';
import {
  Zap, Plus, Search, MoreHorizontal, Play, Pause, Copy, Trash2, Edit3,
  TrendingUp, Users, MessageSquare, Target, ArrowRight, Sparkles,
  Filter, ChevronDown, BarChart3
} from 'lucide-react';

export default function ConversationFlowsView() {
  const { activeWorkspace } = useWorkspace();
  const [flows, setFlows] = useState<ConversationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null); // If set, show builder
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const workspaceId = activeWorkspace?.id || 'salescloud-ws-1';
  const workspaceType = activeWorkspace?.type === 'sfmc' ? 'sfmc' : 'salescloud';

  const fetchFlows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversation-flows?workspaceId=${workspaceId}`);
      const data = await res.json();
      setFlows(data.flows || []);
    } catch {
      setFlows([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchFlows(); }, [fetchFlows]);

  const handleCreateFlow = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/conversation-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Conversation Flow',
          tenantId: 'tenant-1',
          workspaceId,
          workspaceType,
          keywords: [],
          nodes: [
            { 
              id: 'trigger-1', 
              type: 'TRIGGER_KEYWORD', 
              label: 'Keyword Trigger', 
              data: {}, 
              position: { x: typeof window !== 'undefined' ? window.innerWidth / 2 - 140 : 400, y: 100 } 
            },
          ],
          edges: [],
          createdBy: 'Current User',
        }),
      });
      const data = await res.json();
      if (data.flow) {
        setFlows(prev => [data.flow, ...prev]);
        setActiveFlowId(data.flow.id);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (flow: ConversationFlow) => {
    const newStatus = flow.status === 'active' ? 'paused' : 'active';
    setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, status: newStatus } : f));
  };

  const handleDuplicate = async (flow: ConversationFlow) => {
    const res = await fetch('/api/conversation-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...flow,
        name: `${flow.name} (Copy)`,
        status: 'draft',
      }),
    });
    const data = await res.json();
    if (data.flow) setFlows(prev => [data.flow, ...prev]);
    setMenuOpenId(null);
  };

  const handleDelete = async (flowId: string) => {
    setFlows(prev => prev.filter(f => f.id !== flowId));
    setMenuOpenId(null);
  };

  // Filter flows
  const filteredFlows = flows.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.keywords.some(k => k.keyword.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // If a flow is being edited, show the builder
  if (activeFlowId) {
    const flow = flows.find(f => f.id === activeFlowId);
    return (
      <FlowBuilder
        flow={flow || null}
        onBack={() => { setActiveFlowId(null); fetchFlows(); }}
      />
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    archived: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const totalStarted = flows.reduce((a, f) => a + (f.analytics?.started || 0), 0);
  const totalCompleted = flows.reduce((a, f) => a + (f.analytics?.completed || 0), 0);
  const totalLeads = flows.reduce((a, f) => a + (f.analytics?.leadsCreated || 0), 0);
  const avgResponse = flows.length > 0 ? flows.reduce((a, f) => a + (f.analytics?.responseRate || 0), 0) / flows.length : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Conversation Flows</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Build keyword-triggered WhatsApp conversation journeys
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateFlow}
          disabled={isCreating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-200 transition-all active:scale-[0.97] disabled:opacity-60"
        >
          <Plus size={18} />
          New Flow
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Flows Started', value: totalStarted.toLocaleString(), icon: <Sparkles size={18} />, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-200' },
          { label: 'Completed', value: totalCompleted.toLocaleString(), icon: <Target size={18} />, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-200' },
          { label: 'Leads Created', value: totalLeads.toLocaleString(), icon: <Users size={18} />, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-200' },
          { label: 'Avg Response Rate', value: `${avgResponse.toFixed(1)}%`, icon: <BarChart3 size={18} />, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md ${card.shadow}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search flows or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-[320px] bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {['all', 'active', 'draft', 'paused'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredFlows.length} flow{filteredFlows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Flow Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full" />
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 flex items-center justify-center mb-4">
            <Zap size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Conversation Flows</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first keyword-triggered WhatsApp conversation</p>
          <button
            onClick={handleCreateFlow}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white font-bold text-sm rounded-xl"
          >
            <Plus size={16} />
            Create Flow
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60">
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Flow Name</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Keywords</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Started</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Completed</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Leads</th>
                <th className="text-left px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="text-right px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map(flow => (
                <tr
                  key={flow.id}
                  className="border-b border-slate-100 hover:bg-violet-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5" onClick={() => setActiveFlowId(flow.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0 border border-violet-200/50">
                        <Zap size={16} className="text-violet-600" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{flow.name}</span>
                        {flow.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] truncate">{flow.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" onClick={() => setActiveFlowId(flow.id)}>
                    <div className="flex flex-wrap gap-1">
                      {flow.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-md border border-violet-200/50">
                          {kw.keyword}
                        </span>
                      ))}
                      {flow.keywords.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium">+{flow.keywords.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5" onClick={() => setActiveFlowId(flow.id)}>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${statusColors[flow.status]}`}>
                      {flow.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-700" onClick={() => setActiveFlowId(flow.id)}>
                    {(flow.analytics?.started || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-700" onClick={() => setActiveFlowId(flow.id)}>
                    {(flow.analytics?.completed || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600" onClick={() => setActiveFlowId(flow.id)}>
                    {(flow.analytics?.leadsCreated || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-slate-500 font-medium" onClick={() => setActiveFlowId(flow.id)}>
                    {new Date(flow.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleStatus(flow); }}
                        className={`p-1.5 rounded-lg transition-all ${
                          flow.status === 'active'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={flow.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {flow.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setActiveFlowId(flow.id); }}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-violet-100 hover:text-violet-600 transition-all"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === flow.id ? null : flow.id); }}
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpenId === flow.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1">
                            <button
                              onClick={e => { e.stopPropagation(); handleDuplicate(flow); }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Copy size={13} /> Duplicate
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(flow.id); }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
