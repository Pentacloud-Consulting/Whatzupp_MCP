'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Video, Users, User, ArrowRight, Loader2, Calendar, PhoneCall, TrendingUp, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

export default function CallHistoryView() {
  const { activeWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const tenantId = 'tenant-1';
        const wsId = activeWorkspace?.id || 'salescloud-ws-1';
        const wsType = activeWorkspace?.type || 'salescloud';

        const res = await fetch(`/api/calls/activity?tenantId=${tenantId}&workspaceId=${wsId}&workspaceType=${wsType}`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to fetch call history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [activeWorkspace?.id, activeWorkspace?.type]);

  const voiceCount = activities.filter(a => a.Activity_Source__c === 'WHATSAPP_VOICE_CALL').length;
  const videoCount = activities.filter(a => a.Activity_Source__c === 'WHATSAPP_VIDEO_CALL').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00C853] flex items-center justify-center border border-emerald-100 shadow-sm">
            <Phone size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Call History
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">
              WhatsApp native communication tracking and analytics.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
        
        {/* ANALYTICS WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><Phone size={18} /></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Voice Call Attempts</p>
            <p className="text-3xl font-black text-slate-900">{voiceCount}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4"><Video size={18} /></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Video Call Attempts</p>
            <p className="text-3xl font-black text-slate-900">{videoCount}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><Users size={18} /></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Most Contacted Leads</p>
            <p className="text-3xl font-black text-slate-900">4</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4"><TrendingUp size={18} /></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Call Activities (Today)</p>
            <p className="text-3xl font-black text-slate-900">{activities.length}</p>
          </motion.div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800">Recent Activity</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search activities..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium w-64 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm" />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10">Contact</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10">Type</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10">Agent</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10">Status</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
                      <p className="font-semibold text-sm">Loading activity log...</p>
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      No call activities found for this workspace.
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => {
                    const isVoice = act.Activity_Source__c === 'WHATSAPP_VOICE_CALL';
                    return (
                      <tr key={act.Id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{act.Contact_Name__c}</span>
                            <span className="text-xs font-semibold text-slate-500">+{act.Contact_Phone__c}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${isVoice ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                            {isVoice ? <Phone size={12} /> : <Video size={12} />}
                            {isVoice ? 'Voice' : 'Video'}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                              {act.Agent_Name__c?.charAt(0) || 'A'}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{act.Agent_Name__c}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2.5 py-1 rounded-md">
                            {act.Status__c?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-sm font-semibold text-slate-600">
                          {new Date(act.Created_Date__c).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
