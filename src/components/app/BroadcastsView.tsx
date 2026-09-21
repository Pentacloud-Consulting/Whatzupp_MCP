'use client';

// src/components/app/BroadcastsView.tsx
// Campaign builder for sending template messages to multiple contacts.
// Left: form (campaign details, template, schedule, audience)
// Right: live preview + campaign summary

import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import {
  Megaphone, Search, Users2, Phone, ChevronDown, Clock, Send,
  ExternalLink, Loader2, CheckCircle2, AlertTriangle, ArrowLeft,
  Eye, Calendar, X, Check, LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: Array<{ type: string; text: string; url?: string }>;
}

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: TemplateComponent[];
}

interface BroadcastResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ phone: string; wamid: string | null; success: boolean; error?: string }>;
}

type AudienceMode = 'contacts' | 'manual';
type ScheduleMode = 'now' | 'schedule';

const getComponentText = (template: Template, type: string): string | undefined => {
  return template.components?.find(c => c.type === type)?.text;
};

const getButtons = (template: Template): Array<{ type: string; text: string; url?: string }> => {
  const buttonsComponent = template.components?.find(c => c.type === 'BUTTONS');
  return (buttonsComponent as unknown as { buttons?: Array<{ type: string; text: string; url?: string }> })?.buttons || [];
};

export default function BroadcastsView() {
  const { activeWorkspace, activeContacts } = useWorkspace();

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Audience
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('contacts');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState('');
  const [manualNumbers, setManualNumbers] = useState('');

  // Send state
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.templates)) {
            setTemplates(data.templates);
          }
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (!contactSearch) return activeContacts;
    const q = contactSearch.toLowerCase();
    return activeContacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q)
    );
  }, [activeContacts, contactSearch]);

  // Audience count
  const audienceCount = useMemo(() => {
    if (audienceMode === 'contacts') {
      return selectedContactIds.size;
    }
    return manualNumbers.split(/[,\n]/).map(n => n.trim()).filter(n => n.length > 0).length;
  }, [audienceMode, selectedContactIds, manualNumbers]);

  const toggleContact = (id: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allIds = new Set(selectedContactIds);
    filteredContacts.forEach(c => allIds.add(c.id));
    setSelectedContactIds(allIds);
  };

  const clearSelection = () => setSelectedContactIds(new Set());

  // Build phone list and send
  const handleSend = async () => {
    if (!selectedTemplate || audienceCount === 0) return;

    const phoneList: string[] = [];

    if (audienceMode === 'contacts') {
      activeContacts.forEach(c => {
        if (selectedContactIds.has(c.id)) {
          phoneList.push(c.phoneNumber.replace(/^\+/, ''));
        }
      });
    } else {
      manualNumbers.split(/[,\n]/).forEach(n => {
        const cleaned = n.trim().replace(/[^0-9]/g, '');
        if (cleaned.length > 0) phoneList.push(cleaned);
      });
    }

    if (phoneList.length === 0) return;

    setSending(true);
    setResult(null);
    setSendError(null);

    try {
      const contacts = phoneList.map(phone => ({
        phone,
        templateName: selectedTemplate.name,
        language: selectedTemplate.language,
      }));

      const response = await fetch('/api/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setSendError(null);
    setCampaignName('');
    setSelectedTemplate(null);
    setSelectedContactIds(new Set());
    setManualNumbers('');
  };

  const isFormValid = selectedTemplate && audienceCount > 0 && campaignName.trim().length > 0;

  // ─── Result Screen ───
  if (result) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center"
        >
          <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center ${result.failed === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            {result.failed === 0 
              ? <CheckCircle2 size={32} className="text-emerald-500" />
              : <AlertTriangle size={32} className="text-amber-500" />
            }
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Broadcast {result.failed === 0 ? 'Sent!' : 'Completed'}</h2>
          <p className="text-sm text-gray-500 mb-6">
            Campaign &quot;{campaignName}&quot; has been processed.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mt-1">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-emerald-600">{result.success}</p>
              <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider mt-1">Sent</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-500">{result.failed}</p>
              <p className="text-[11px] text-red-500 font-semibold uppercase tracking-wider mt-1">Failed</p>
            </div>
          </div>

          {result.failed > 0 && (
            <div className="bg-red-50 rounded-xl p-3 mb-6 text-left max-h-[160px] overflow-y-auto">
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2">Failed Numbers</p>
              {result.results.filter(r => !r.success).map((r, i) => (
                <div key={i} className="text-[12px] text-red-600 flex justify-between py-1 border-b border-red-100 last:border-0">
                  <span className="font-mono">{r.phone}</span>
                  <span className="text-red-400 truncate ml-2">{r.error}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={resetForm}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1db954] transition-colors shadow-sm"
          >
            New Broadcast
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      
      {/* ─── Left: Campaign Form ─── */}
      <div className="flex-1 overflow-y-auto p-8 max-w-[640px]">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={22} className="text-[#25D366]" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Broadcasts</h1>
            {activeWorkspace && (
              <span className="text-[11px] font-bold text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-lg">
                {activeWorkspace.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Send bulk WhatsApp messages to segments of your contacts.</p>
        </div>

        {/* Campaign Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Campaign details</h2>

          {/* Campaign Name */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Campaign name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Holi Festival Offer 2024"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 transition-all"
            />
          </div>

          {/* Template Selection */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Message template <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedTemplate?.name || ''}
                onChange={(e) => {
                  const tmpl = templates.find(t => t.name === e.target.value) || null;
                  setSelectedTemplate(tmpl);
                }}
                disabled={templatesLoading}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">
                  {templatesLoading ? 'Loading templates...' : 'Select a template'}
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.language}) — {t.category}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[12px] text-gray-400 mt-1">
              Approve or create templates under <span className="text-[#25D366] font-semibold cursor-pointer">Templates</span>.
            </p>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Schedule</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScheduleMode('now')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all
                  ${scheduleMode === 'now'
                    ? 'bg-[#25D366]/[0.06] border-[#25D366] text-[#25D366]'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Send size={16} /> Send now
              </button>
              <button
                onClick={() => setScheduleMode('schedule')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all
                  ${scheduleMode === 'schedule'
                    ? 'bg-[#25D366]/[0.06] border-[#25D366] text-[#25D366]'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Clock size={16} /> Schedule
              </button>
            </div>

            <AnimatePresence>
              {scheduleMode === 'schedule' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 mt-3 overflow-hidden"
                >
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                  />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Audience Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Audience</h2>
            <span className="text-[13px] font-bold text-[#25D366]">{audienceCount} selected</span>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAudienceMode('contacts')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border transition-all
                ${audienceMode === 'contacts'
                  ? 'bg-[#25D366]/[0.06] border-[#25D366] text-[#25D366]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Users2 size={16} /> Select Contacts
            </button>
            <button
              onClick={() => setAudienceMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border transition-all
                ${audienceMode === 'manual'
                  ? 'bg-[#25D366]/[0.06] border-[#25D366] text-[#25D366]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Phone size={16} /> Manual Entry
            </button>
          </div>

          {/* Contact Selection */}
          {audienceMode === 'contacts' && (
            <div>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search name, phone..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10"
                />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button onClick={selectAllVisible} className="text-[12px] font-semibold text-[#25D366] hover:underline">
                  Select visible
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={clearSelection} className="text-[12px] font-semibold text-gray-500 hover:text-gray-700 hover:underline">
                  Clear
                </button>
              </div>

              <div className="max-h-[240px] overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">No contacts in this workspace.</div>
                ) : (
                  filteredContacts.map(contact => {
                    const isChecked = selectedContactIds.has(contact.id);
                    const initials = contact.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <label
                        key={contact.id}
                        onClick={() => toggleContact(contact.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                          ${isChecked ? 'bg-[#25D366]/[0.03]' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                          ${isChecked ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300'}
                        `}>
                          {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-gray-900 truncate">{contact.name}</p>
                          <p className="text-[12px] text-gray-500 font-mono">{contact.phoneNumber}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Manual Number Entry */}
          {audienceMode === 'manual' && (
            <div>
              <textarea
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                placeholder={"Enter phone numbers.\nSeparate with commas or new lines.\n\ne.g. 919952374972, 917019633010"}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/10 h-36 resize-none font-mono transition-all"
              />
              <p className="text-[12px] text-gray-400 mt-1.5">
                {audienceCount} number{audienceCount !== 1 ? 's' : ''} entered • Max 50 per batch
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {sendError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to send</p>
              <p className="text-[13px] text-red-600 mt-0.5">{sendError}</p>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !isFormValid}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm
            ${sending || !isFormValid
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#25D366] text-white hover:bg-[#1db954] hover:shadow-md shadow-green-600/15 active:scale-[0.99]'}
          `}
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending broadcast...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Broadcast ({audienceCount} contact{audienceCount !== 1 ? 's' : ''})
            </>
          )}
        </button>
      </div>

      {/* ─── Right: Preview + Summary ─── */}
      <div className="w-[420px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-6 hidden lg:block">
        
        {/* Message Preview */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Message preview</h2>
          </div>

          {/* Phone Frame */}
          <div className="bg-gray-900 rounded-[1.5rem] p-2.5 shadow-lg">
            <div className="bg-[#128C7E] rounded-t-[1.2rem] px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">W</div>
              <div>
                <p className="text-white font-semibold text-[13px]">WhatZupp Business</p>
                <p className="text-white/60 text-[10px]">Official Business Account</p>
              </div>
            </div>

            <div className="bg-[#ECE5DD] min-h-[200px] px-3 py-4 flex flex-col justify-end">
              {selectedTemplate ? (
                <div className="max-w-[85%] self-start">
                  <div className="bg-white rounded-xl rounded-tl-sm shadow-sm overflow-hidden">
                    {getComponentText(selectedTemplate, 'HEADER') && (
                      <div className="px-3 pt-2.5 pb-1">
                        <p className="text-[13px] font-bold text-gray-900">{getComponentText(selectedTemplate, 'HEADER')}</p>
                      </div>
                    )}
                    {getComponentText(selectedTemplate, 'BODY') && (
                      <div className="px-3 py-1.5">
                        <p className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                          {getComponentText(selectedTemplate, 'BODY')}
                        </p>
                      </div>
                    )}
                    {getComponentText(selectedTemplate, 'FOOTER') && (
                      <div className="px-3 pb-1">
                        <p className="text-[11px] text-gray-400 italic">{getComponentText(selectedTemplate, 'FOOTER')}</p>
                      </div>
                    )}
                    <div className="flex justify-end px-3 pb-1.5">
                      <span className="text-[9px] text-gray-400">
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    {getButtons(selectedTemplate).length > 0 && (
                      <div className="border-t border-gray-100">
                        {getButtons(selectedTemplate).map((btn, idx) => (
                          <div key={idx} className="flex items-center justify-center gap-1 py-2 text-[13px] text-[#25D366] font-medium border-b border-gray-50 last:border-0">
                            {btn.url && <ExternalLink size={12} />}
                            {btn.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[13px] text-gray-500">Select a template to preview your message</p>
                </div>
              )}
            </div>

            <div className="bg-[#F0F0F0] rounded-b-[1.2rem] px-3 py-2 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[12px] text-gray-400">Type a message</div>
              <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="m21.4 11.6-17-8c-.7-.3-1.4.3-1.2 1l1.8 6.4h9v2h-9l-1.8 6.4c-.2.7.5 1.3 1.2 1l17-8c.6-.3.6-1.1 0-1.4z"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900">Campaign summary</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Name', value: campaignName || '—' },
              { label: 'Template', value: selectedTemplate?.name || '—' },
              { label: 'Audience', value: audienceCount > 0 ? `${audienceCount} contacts` : '0 contacts' },
              { label: 'Schedule', value: scheduleMode === 'now' ? 'Send immediately' : (scheduleDate && scheduleTime ? `${scheduleDate} at ${scheduleTime}` : 'Not set') },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-gray-500">{row.label}</span>
                <span className="text-[13px] font-semibold text-gray-900 text-right max-w-[180px] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Templates Link */}
        <button
          onClick={() => {/* could navigate to templates screen */}}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LayoutTemplate size={16} />
          Manage templates
        </button>
      </div>
    </div>
  );
}
