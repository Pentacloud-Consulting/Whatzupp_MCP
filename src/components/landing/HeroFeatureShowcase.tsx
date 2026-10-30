'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  PhoneCall,
  Calendar,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Layers,
  Cloud,
  Check,
  CheckCheck,
  ArrowRight,
  Play,
  Lock,
  Database,
  Archive,
  BarChart3,
  Clock,
  Ban,
  Activity,
  MessageCircle,
  Headphones,
  Bot,
  ExternalLink,
  PhoneForwarded,
  Workflow,
  GitBranch,
  Radio,
  ArrowDown,
  Volume2,
  Star
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  name: string;
  tabLabel: string;
  shortLabel: string;
  badge: string;
  tagline: string;
  color: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'architecture-flow',
    name: 'Architecture Flow',
    tabLabel: 'Architecture Flow',
    shortLabel: 'PLATFORM FLOW DIAGRAM',
    badge: 'LIVE FLOW • META API ↔ WHATZUPP ↔ SALESFORCE',
    tagline: 'End-to-end data pipeline connecting WhatsApp directly into Salesforce',
    color: '#00C853',
    url: 'whatzupp.lightning.force.com/pipeline/live_flow',
    icon: Workflow,
  },
  {
    id: 'whatsapp-crm',
    name: 'WhatsApp CRM',
    tabLabel: 'WhatsApp CRM',
    shortLabel: '2-WAY CRM INBOX',
    badge: 'CHATS • 2-WAY CRM INBOX & SALESFORCE SYNC',
    tagline: 'Real-time WhatsApp Web-style inbox native to Salesforce record',
    color: '#00C853',
    url: 'whatzupp.lightning.force.com/lightning/r/Lead/00Q8.../view',
    icon: MessageSquare,
  },
  {
    id: 'ai-lead-scoring',
    name: 'AI Lead Score',
    tabLabel: 'AI Lead Score',
    shortLabel: 'AI LEAD SCORING GAUGE',
    badge: 'CRM INTELLIGENCE • LEAD_SCORE__C ON SALESFORCE RECORD',
    tagline: 'Live engagement scoring stored directly on the Salesforce Lead',
    color: '#F59E0B',
    url: 'whatzupp.lightning.force.com/lightning/o/Lead/scoring',
    icon: Flame,
  },
  {
    id: 'auto-followups',
    name: 'Auto Follow-Ups',
    tabLabel: 'Auto Follow-Ups',
    shortLabel: 'SCHEDULED FLOW PIPELINE',
    badge: 'AUTOMATION • SCHEDULED SALESFORCE ACTIVITY',
    tagline: 'Schedule WhatsApp messages; background processor auto-sends',
    color: '#3B82F6',
    url: 'whatzupp.lightning.force.com/pipeline/auto_followups',
    icon: Calendar,
  },
  {
    id: 'big-object-archive',
    name: 'Big Object Archive',
    tabLabel: 'Big Object',
    shortLabel: 'STORAGE RECLAIM PIPELINE',
    badge: 'STORAGE OPTIMIZER • WHATZUPP_CHAT_ARCHIVE__B',
    tagline: 'Scheduled Apex batch copies older chats to Big Object storage',
    color: '#8B5CF6',
    url: 'whatzupp.lightning.force.com/apex/WhatZuppChatArchival',
    icon: Archive,
  },
  {
    id: 'call-history',
    name: 'Call History',
    tabLabel: 'Call History',
    shortLabel: 'CALL AUDIT WAVEFORM',
    badge: 'CALL HISTORY • VOICE & VIDEO AUDIT TRAIL',
    tagline: 'Complete audit trail of customer calls logged next to chat history',
    color: '#10B981',
    url: 'whatzupp.lightning.force.com/lightning/r/Task/calls/live',
    icon: PhoneCall,
  },
  {
    id: 'sms-omnichannel',
    name: 'SMS Omnichannel',
    tabLabel: 'SMS Channel',
    shortLabel: 'FAILOVER ROUTE DIAGRAM',
    badge: 'OMNICHANNEL • 2-WAY ENTERPRISE SMS & FAILOVER',
    tagline: 'Reliable SMS fallback and 2-way messaging synced with Salesforce',
    color: '#06B6D4',
    url: 'whatzupp.lightning.force.com/omnichannel/failover',
    icon: MessageCircle,
  },
  {
    id: 'telephony-cti',
    name: 'Telephony & CTI',
    tabLabel: 'Telephony',
    shortLabel: 'SOFTPHONE CTI FLOW',
    badge: 'SALESFORCE CTI • SOFTPHONE & CLICK-TO-DIAL',
    tagline: 'Integrated Lightning softphone dialer with automated task logging',
    color: '#6366F1',
    url: 'whatzupp.lightning.force.com/cti/softphone/webrtc',
    icon: Headphones,
  },
  {
    id: 'ai-receptionist',
    name: 'AI Receptionist',
    tabLabel: 'AI Receptionist',
    shortLabel: 'DECISION TREE FLOWCHART',
    badge: 'CONVERSATION FLOWS • 24/7 AI AGENT QUALIFIER',
    tagline: 'Round-the-clock AI chatbot qualifying leads and booking meetings',
    color: '#EC4899',
    url: 'whatzupp.lightning.force.com/automation/ai_receptionist',
    icon: Bot,
  },
];

export default function HeroFeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0); // Starts on Architecture Flow Diagram!
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  // Auto-rotate every 3.0 seconds as specified
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
      setProgressKey((k) => k + 1);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused, activeIndex]);

  const handleSelectFeature = (index: number) => {
    setActiveIndex(index);
    setProgressKey((k) => k + 1);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);
    setProgressKey((k) => k + 1);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    setProgressKey((k) => k + 1);
  };

  const currentFeature = FEATURES[activeIndex];

  return (
    <div className="w-full relative">
      {/* ── Two-Column Left & Right Hero Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center w-full">
        
        {/* ── Left Column: Clean Editorial Headline, CTAs & Capability Badges ── */}
        <div
          className="lg:col-span-5 space-y-6 sm:space-y-7 xl:space-y-8 text-left relative z-20 flex flex-col justify-center"
        >
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 backdrop-blur-md border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-xs tracking-wide w-fit"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]"></span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles size={11} className="text-[#00C853]" />
              Enterprise WhatsApp &amp; Omnichannel Platform
            </span>
          </motion.div>

          {/* Main Headline - Spacious, rhythmic line heights */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="font-['Inter',_sans-serif] text-3xl sm:text-4xl lg:text-[37px] xl:text-[43px] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.22] sm:leading-[1.18]"
          >
            One Platform. <br className="hidden sm:inline" />
            Every WhatsApp Conversation.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-[#00C853] to-teal-500 italic block mt-2 sm:mt-2.5">
              Native to Every Enterprise CRM.
            </span>
          </motion.h1>

          {/* Description with comfortable line-height */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-slate-600 text-sm sm:text-[15px] lg:text-[15.5px] max-w-[500px] font-normal leading-[1.7]"
          >
            WhatZupp connects <strong>Meta WhatsApp Business API</strong> directly into your CRM — capturing every conversation, AI lead score, scheduled follow-up, and continuous customer timeline in real time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1 sm:pt-2"
          >
            <Link
              href="/signup"
              className="relative group overflow-hidden px-7 py-3.5 rounded-full bg-gradient-to-r from-[#00C853] to-[#00A844] hover:from-[#00B248] hover:to-[#00963C] text-white font-bold text-sm shadow-md shadow-[#00C853]/30 hover:shadow-lg hover:shadow-[#00C853]/40 transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start 15-day trial</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="#video"
              className="px-6 py-3.5 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-bold text-sm shadow-xs border border-slate-200/90 hover:shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 hover:-translate-y-0.5 group cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                <Play size={9} className="text-slate-600 group-hover:text-[#00C853] ml-0.5 fill-current" />
              </div>
              <span>Watch in 90 seconds</span>
            </Link>
          </motion.div>

          {/* Multi-CRM Enterprise Capability Badges (Fills bottom height harmoniously) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="pt-6 sm:pt-8 border-t border-slate-200/70 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-slate-500 font-medium"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C853]" />
              <span>Multi-CRM Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C853]" />
              <span>Official Meta Cloud API</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C853]" />
              <span>Zero-Lag Webhooks</span>
            </div>
          </motion.div>
        </div>

        {/* ── Right Column: Top Feature Navigation + Mint Glass Chassis Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 relative w-full flex flex-col items-center justify-center"
        >
          
          {/* Luminous Glow Halo */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-tr from-[#00C853]/15 via-teal-300/20 to-emerald-200/10 blur-3xl rounded-full pointer-events-none -z-10" />

          {/* Top Interactive Feature Navigation Bar */}
          <div className="w-full max-w-[640px] xl:max-w-[690px] mb-2 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
              {FEATURES.map((feat, i) => {
                const isActive = i === activeIndex;
                const Icon = feat.icon;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => handleSelectFeature(i)}
                    className={`relative px-3 py-1.5 rounded-full text-[10px] sm:text-[10.5px] font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#00C853] shadow-xs border border-[#00C853]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 border border-transparent'
                    }`}
                  >
                    <Icon
                      size={12}
                      className={isActive ? 'text-[#00C853]' : 'text-slate-400'}
                    />
                    <span className="whitespace-nowrap">{feat.tabLabel}</span>

                    {/* Active progress underline bar */}
                    {isActive && (
                      <div className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-emerald-100 rounded-full overflow-hidden">
                        <motion.div
                          key={`tab-bar-${progressKey}`}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3.0, ease: 'linear' }}
                          className="h-full bg-[#00C853] rounded-full"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="relative w-full max-w-[640px] xl:max-w-[690px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Soft Mint Glass Chassis */}
            <div className="rounded-[32px] sm:rounded-[36px] bg-gradient-to-br from-[#D1FAE5]/85 via-[#ECFDF5]/95 to-[#CCFBF1]/80 p-3.5 sm:p-4 lg:p-5 shadow-xl shadow-emerald-950/10 border-2 border-[#A7F3D0]/90 relative">
              
              {/* Dynamic Top Badge for Active Feature */}
              <div className="flex justify-center mb-2.5">
                <motion.div
                  key={currentFeature.badge}
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#A7F3D0] text-[#065F46] text-[9.5px] font-extrabold shadow-2xs tracking-wider uppercase"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                  {currentFeature.badge}
                </motion.div>
              </div>

              {/* White Dashboard Window with Flow Diagrams (~358px height for 100vh fit) */}
              <div className="bg-white rounded-[22px] shadow-lg border border-slate-200/90 overflow-hidden relative h-[356px] sm:h-[365px] flex flex-col justify-between">
                
                {/* Window Titlebar */}
                <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/10 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/10 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/10 inline-block" />
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-0.5 bg-white rounded-full border border-slate-200/70 shadow-2xs text-[9.5px] text-slate-500 font-mono max-w-[280px] truncate">
                    <Lock size={9} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{currentFeature.url}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                    Live Sync
                  </div>
                </div>

                {/* Dashboard Multi-Pane Body: Left Mini-Sidebar + Main Visual Flow Canvas */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Left Mini-Sidebar (Quick Switcher Strip) */}
                  <div className="w-11 sm:w-12 bg-white border-r border-slate-100 flex flex-col items-center py-2.5 gap-1.5 shrink-0">
                    {/* Top Brand WhatsApp Trigger */}
                    <div className="w-8 h-8 rounded-xl bg-[#00C853] text-white flex items-center justify-center shadow-xs mb-0.5">
                      <MessageSquare size={14} className="fill-white" />
                    </div>

                    {FEATURES.map((feat, i) => {
                      const isActive = i === activeIndex;
                      const Icon = feat.icon;
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => handleSelectFeature(i)}
                          title={feat.name}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-[#00C853] font-bold shadow-2xs border border-emerald-200'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/60'
                          }`}
                        >
                          <Icon size={12} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Visual Diagram Canvas */}
                  <div className="p-3 sm:p-4 flex-1 relative flex flex-col justify-center overflow-hidden bg-white">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentFeature.id}
                        initial={{ opacity: 0, scale: 0.98, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -6 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="w-full"
                      >
                        {activeIndex === 0 && <ArchitectureFlowDiagram />}
                        {activeIndex === 1 && <WhatsAppCrmContent />}
                        {activeIndex === 2 && <AiLeadScoringContent />}
                        {activeIndex === 3 && <AutoFollowupsContent />}
                        {activeIndex === 4 && <BigObjectArchiveContent />}
                        {activeIndex === 5 && <CallHistoryContent />}
                        {activeIndex === 6 && <SmsOmnichannelContent />}
                        {activeIndex === 7 && <TelephonyCtiContent />}
                        {activeIndex === 8 && <AiReceptionistContent />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bottom Pagination & Interactive Navigation */}
                <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      aria-label="Previous feature"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      aria-label="Next feature"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  {/* Pagination Indicators */}
                  <div className="flex items-center gap-1">
                    {FEATURES.map((feat, i) => {
                      const isActive = i === activeIndex;
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => handleSelectFeature(i)}
                          className={`relative transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                            isActive ? 'w-6 bg-[#00C853]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                          aria-label={`Jump to ${feat.name}`}
                        >
                          {isActive && (
                            <motion.div
                              key={`prog-${progressKey}`}
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 3.0, ease: 'linear' }}
                              className="absolute inset-0 bg-[#052E2B] rounded-full opacity-30"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[9.5px] font-bold text-slate-600 tracking-wider">
                    {FEATURES[activeIndex].shortLabel}
                  </div>
                </div>

              </div>

              {/* Floating Salesforce AppExchange Micro-Badge */}
              <div className="absolute -bottom-3 -right-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 scale-90 sm:scale-100 origin-bottom-right z-30">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg"
                  alt="Salesforce"
                  className="h-4 w-auto"
                />
                <span className="text-[10px] font-bold text-slate-800 tracking-tight">
                  AppExchange Ready
                </span>
              </div>

            </div>
          </div>
        </motion.div>

      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 0: END-TO-END ARCHITECTURE & DATA FLOW DIAGRAM
   (Meta API ↔ WhatZupp Engine ↔ Salesforce Sales Cloud & SFMC)
───────────────────────────────────────────────────────────── */
function ArchitectureFlowDiagram() {
  return (
    <div className="space-y-2.5 w-full">
      {/* Flow Title Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-[#00C853] flex items-center justify-center">
            <Workflow size={11} />
          </div>
          <span className="text-[11.5px] font-black text-slate-800">
            Real-Time Enterprise Architecture Pipeline
          </span>
        </div>
        <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          ● Zero-Lag Webhooks
        </span>
      </div>

      {/* 3-Tier Visual Flow Diagram */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 items-center relative py-1">
        
        {/* Node 1: Inbound Meta API & Omnichannel */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-white to-emerald-50/40 border border-emerald-200/80 shadow-xs flex flex-col items-center text-center space-y-1 relative group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
            <MessageSquare size={13} className="fill-white" />
          </div>
          <div className="text-[10px] sm:text-[10.5px] font-black text-slate-900 leading-none">Meta WhatsApp API</div>
          <div className="text-[8px] font-bold text-slate-500 leading-tight">Inbound Customer Reply</div>
          <div className="text-[7.5px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
            + SMS &amp; CTI Calls
          </div>
        </div>

        {/* Connecting Arrow 1 */}
        <div className="absolute left-[31%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
          <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-white border border-emerald-300 flex items-center justify-center shadow-2xs">
            <ArrowRight size={10} className="text-[#00C853]" />
          </div>
        </div>

        {/* Node 2: WhatZupp Intelligent Engine */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-white to-slate-50 border-2 border-[#00C853] shadow-md shadow-emerald-500/10 flex flex-col items-center text-center space-y-1 relative">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-[#00C853] flex items-center justify-center shadow-xs">
            <Zap size={13} className="fill-current" />
          </div>
          <div className="text-[10px] sm:text-[10.5px] font-black text-slate-900 leading-none">WhatZupp Gateway</div>
          <div className="text-[8px] font-bold text-emerald-700 leading-tight">AI Scoring &amp; Routing</div>
          <div className="text-[7.5px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-full">
            Lead_Score__c &amp; STOP
          </div>
        </div>

        {/* Connecting Arrow 2 */}
        <div className="absolute left-[65%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
          <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-white border border-emerald-300 flex items-center justify-center shadow-2xs">
            <ArrowRight size={10} className="text-[#00C853]" />
          </div>
        </div>

        {/* Node 3: Salesforce Core Ecosystem */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-b from-white to-blue-50/50 border border-blue-200/80 shadow-xs flex flex-col items-center text-center space-y-1 relative">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#00A1E0] text-white flex items-center justify-center shadow-xs">
            <Cloud size={14} className="fill-white" />
          </div>
          <div className="text-[10px] sm:text-[10.5px] font-black text-slate-900 leading-none">Salesforce Cloud</div>
          <div className="text-[8px] font-bold text-slate-500 leading-tight">Sales Cloud &amp; SFMC</div>
          <div className="text-[7.5px] font-extrabold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded-full">
            Big Object Storage
          </div>
        </div>

      </div>

      {/* Live Data Packets Flow Bar */}
      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-[8.5px] font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-pulse" />
          <span>Bi-Directional Sync: <strong>263 msgs synced today</strong></span>
        </div>
        <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer">
          100% Tenant Isolation &rarr;
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 1: WHATSAPP CRM VISUAL 2-WAY PIPELINE (Slide 6 & 7)
───────────────────────────────────────────────────────────── */
function WhatsAppCrmContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Contact Header Bar with Live Salesforce Link */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#052e16] to-[#047857] text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
              MR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#25D366] border border-white flex items-center justify-center">
              <Check size={6} className="text-white stroke-[3]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase leading-none">
              <span>LEAD #00Q8...</span>
              <span>·</span>
              <span className="text-emerald-700 font-extrabold">STATUS: QUALIFIED</span>
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              Michael Rodriguez <span className="text-[9px] font-normal text-slate-400">(Acme Corp)</span>
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#047857] text-[8px] font-bold">
          <span className="w-1 h-1 rounded-full bg-[#25D366]" />
          2-WAY CRM CHAT
        </div>
      </div>

      {/* Outbound Rich Template Message */}
      <div className="p-2 rounded-xl bg-[#E7F8EE] border border-emerald-200/80 shadow-xs space-y-0.5 ml-3">
        <div className="flex items-center justify-between text-[8px] font-bold text-emerald-800">
          <span className="flex items-center gap-1">
            <FileText size={9} className="text-emerald-700" /> Enterprise_Quote_Q4.pdf (2.4 MB)
          </span>
          <span className="text-emerald-700 text-[7.5px] flex items-center gap-0.5">
            10:04 AM <CheckCheck size={9} className="text-blue-500" />
          </span>
        </div>
        <p className="text-[10px] text-slate-800 font-medium leading-tight">
          Hi Michael, your WhatsApp + Salesforce deployment proposal has been submitted.
        </p>
      </div>

      {/* Inbound Customer Reply */}
      <div className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-0.5 mr-3">
        <div className="flex items-center justify-between text-[7.5px] font-bold text-slate-400">
          <span>MICHAEL · 10:05 AM</span>
          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[6.5px] font-black">REPLIED</span>
        </div>
        <p className="text-[10px] font-semibold text-slate-800 leading-tight">
          Proposal looks great! Can we enable the Salesforce CTI &amp; Big Object archive module?
        </p>
      </div>

      {/* Salesforce Record Details Strip (from Slide 7) */}
      <div className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[8px] font-bold text-slate-600">
        <div className="flex items-center gap-2">
          <span>Opportunity: <strong className="text-slate-900">$48,000 ARR</strong></span>
          <span>·</span>
          <span>Owner: <strong className="text-slate-900">Alex Morgan</strong></span>
        </div>
        <span className="text-emerald-700 font-black cursor-pointer hover:underline flex items-center gap-0.5">
          View in Salesforce &rarr;
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 2: AI LEAD SCORING VISUAL GAUGE & BREAKDOWN (Slide 8)
───────────────────────────────────────────────────────────── */
function AiLeadScoringContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
            <Flame size={13} className="fill-white" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              SALESFORCE CUSTOM FIELD · LEAD_SCORE__C
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              Visual AI Lead Score Gauge
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[8.5px] font-extrabold">
          HOT LEAD 🔥
        </div>
      </div>

      {/* Visual Radial Gauge + Point Breakdown Flow */}
      <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-200/90">
        
        {/* Circular Score Gauge */}
        <div className="col-span-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Circle Progress Arc */}
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#00C853"
                strokeWidth="5"
                fill="none"
                strokeDasharray="163"
                strokeDashoffset="24"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-900 leading-none">85</span>
              <span className="text-[7.5px] font-bold text-slate-400 uppercase">/ 100</span>
            </div>
          </div>
          <span className="text-[8px] font-black text-emerald-800 mt-1 uppercase">TAG: QUALIFIED</span>
        </div>

        {/* Visual Points Breakdown Pipeline */}
        <div className="col-span-8 space-y-1 text-[8.5px]">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span>Message Velocity (4 msgs/hr)</span>
            <span className="text-emerald-700 font-extrabold">+10 pts</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#00C853] h-full rounded-full w-[85%]" />
          </div>

          <div className="flex items-center justify-between font-bold text-slate-700 pt-0.5">
            <span>Response Speed (&lt;42s)</span>
            <span className="text-emerald-700 font-extrabold">+10 pts</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#00C853] h-full rounded-full w-[90%]" />
          </div>

          <div className="flex items-center justify-between font-bold text-slate-700 pt-0.5">
            <span>Enterprise Quote Downloaded</span>
            <span className="text-emerald-700 font-extrabold">+5 pts</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#00C853] h-full rounded-full w-[100%]" />
          </div>
        </div>

      </div>

      {/* Outcome pill */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-600">
        <span>Auto-synced into Salesforce Lead record in real time</span>
        <span className="text-emerald-600 font-black">Slide 8 Verified</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 3: AUTO FOLLOW-UPS LIFECYCLE WORKFLOW (Slide 9 & 10)
───────────────────────────────────────────────────────────── */
function AutoFollowupsContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <Calendar size={13} className="text-blue-600" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              AUTOMATION ENGINE · SCHEDULED WORKFLOW
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              Scheduled WhatsApp Follow-Up Flow
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[8px] font-bold">
          <Clock size={8} />
          OCT 30 · 2:30 PM
        </div>
      </div>

      {/* Visual Pipeline Steps */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center space-y-0.5">
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black flex items-center justify-center">1</span>
          <div className="text-[8.5px] font-black text-slate-800">Activity Queued</div>
          <div className="text-[7.5px] text-slate-500">Status: Scheduled</div>
        </div>

        <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col items-center space-y-0.5">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black flex items-center justify-center">2</span>
          <div className="text-[8.5px] font-black text-emerald-900">Background Job</div>
          <div className="text-[7.5px] text-emerald-700">Meta API Dispatch</div>
        </div>

        <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center space-y-0.5">
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[9px] font-black flex items-center justify-center">3</span>
          <div className="text-[8.5px] font-black text-slate-800">SF Record Updated</div>
          <div className="text-[7.5px] text-blue-600">Status: Sent ✓✓</div>
        </div>
      </div>

      {/* STOP Compliance Decision Branch */}
      <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[9px] text-amber-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} className="text-amber-700" />
          <span>Opt-Out Branch: If reply matches <strong>&quot;STOP&quot;</strong> &rarr; Auto-sets <em>Unsubscribed</em></span>
        </div>
        <span className="text-[7.5px] bg-amber-200/70 text-amber-900 font-black px-1.5 py-0.2 rounded">GDPR SAFE</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 4: BIG OBJECT STORAGE ARCHITECTURE (Slide 28)
───────────────────────────────────────────────────────────── */
function BigObjectArchiveContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <Archive size={13} className="text-purple-600" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              SALESFORCE STORAGE OPTIMIZER · WHATZUPP_CHAT_ARCHIVE__B
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              Automated Archival &amp; Storage Reclaim
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[8px] font-bold">
          <Database size={8} />
          84% RECLAIMED
        </div>
      </div>

      {/* Visual Storage Reclaim Chart */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
        <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase">
          <span>Standard CRM Storage (&lt; 15 Days)</span>
          <span className="text-purple-700 font-black">Big Object Archive (&gt; 15 Days)</span>
        </div>

        {/* Visual Split Storage Bar */}
        <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden">
          <div className="bg-slate-400 h-full w-[16%]" title="16% Live Chats" />
          <div className="bg-[#8B5CF6] h-full w-[84%]" title="84% Big Object Archive" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5 text-center">
          <div className="p-1 rounded bg-white border border-slate-200 text-[8px]">
            <span className="text-slate-400 uppercase font-bold">Apex Scheduled Batch</span>
            <div className="text-[10px] font-black text-slate-800">WhatZuppChatArchivalBatch</div>
          </div>
          <div className="p-1 rounded bg-white border border-slate-200 text-[8px]">
            <span className="text-slate-400 uppercase font-bold">Archived Rows</span>
            <div className="text-[10px] font-black text-purple-600">128,450 messages</div>
          </div>
        </div>
      </div>

      {/* 1-Click Retrieval Banner */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[8px] font-bold text-purple-900">
        <span>Click <strong>Historical (3)</strong> in chat &rarr; Merges archived history instantly</span>
        <span className="text-purple-700 font-black">Zero Latency</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 5: CALL HISTORY & AUDIO WAVEFORM (Slide 16)
───────────────────────────────────────────────────────────── */
function CallHistoryContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <PhoneCall size={13} className="text-[#00C853]" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              CALL AUDIT TRAIL · VOICE &amp; VIDEO
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              WhatsApp Call Audio Waveform Log
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[8px] font-bold">
          <Activity size={8} />
          LOGGED IN SF
        </div>
      </div>

      {/* Audio Waveform Player Widget */}
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-1">
        <div className="flex items-center justify-between text-[8px] font-bold text-emerald-950">
          <span>Contact: David Chen (CTO, Nexus Corp) &mdash; 04:18 duration</span>
          <span className="px-1 py-0.2 rounded bg-emerald-200 text-emerald-900 font-black text-[7px]">RECORDED</span>
        </div>

        {/* Visual Animated Audio Waveform */}
        <div className="flex items-center gap-1 py-1 px-2 bg-white rounded-lg border border-emerald-200">
          <div className="w-5 h-5 rounded-full bg-[#00C853] text-white flex items-center justify-center shrink-0">
            <Play size={8} className="fill-white ml-0.5" />
          </div>
          <div className="flex-1 flex items-center gap-0.5 h-6">
            {[40, 65, 80, 45, 90, 75, 30, 60, 85, 95, 50, 70, 85, 40, 60, 80, 95, 70, 55, 35, 65, 80, 50].map(
              (h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-emerald-400 rounded-full"
                  style={{ height: `${h}%` }}
                />
              )
            )}
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 font-bold">04:18</span>
        </div>

        <p className="text-[8.5px] text-slate-600 leading-tight">
          Agent: <strong>Alex Morgan</strong> · Disposition: <em>Demo Completed, Quote Proposal Sent</em>
        </p>
      </div>

      {/* Outcome pill */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-600">
        <span>Audio recording and call logs synced directly to Salesforce Contact Task</span>
        <span className="text-emerald-700 font-black">CTI Ready</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 6: SMS OMNICHANNEL FAILOVER FLOW
───────────────────────────────────────────────────────────── */
function SmsOmnichannelContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <MessageCircle size={13} className="text-cyan-600" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              OMNICHANNEL MESSAGING · AUTO-FAILOVER ROUTE
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              WhatsApp &rarr; SMS Failover Diagram
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[8px] font-bold">
          <Zap size={8} />
          99.8% DELIVERY
        </div>
      </div>

      {/* Visual Failover Flow */}
      <div className="grid grid-cols-3 gap-1.5 text-center items-center">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
          <div className="text-[8px] font-bold text-slate-400 uppercase">Primary Route</div>
          <div className="text-[10px] font-black text-slate-800">WhatsApp Msg</div>
          <div className="text-[7px] text-amber-600 font-extrabold">Unread (15 min)</div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-[7.5px] font-bold text-cyan-700 uppercase">Auto-Switch</span>
          <ArrowRight size={14} className="text-cyan-600 animate-pulse my-0.5" />
          <span className="text-[7px] text-slate-400">Zero Drop</span>
        </div>

        <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-300 space-y-0.5">
          <div className="text-[8px] font-bold text-cyan-700 uppercase">Fallback Route</div>
          <div className="text-[10px] font-black text-cyan-950">Carrier SMS</div>
          <div className="text-[7px] text-emerald-700 font-extrabold">Delivered ✓✓</div>
        </div>
      </div>

      {/* Message Sample */}
      <div className="p-2 rounded-xl bg-white border border-slate-200 text-[8.5px] space-y-0.5">
        <div className="text-slate-400 font-bold">RECIPIENT: SARAH JENKINS (VP OPS) · +1 (415) 890-3412</div>
        <p className="text-slate-800 font-medium leading-tight">
          &ldquo;Your security code for WhatZupp SFMC Portal is <strong>894-210</strong>. Valid 10m.&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 7: TELEPHONY SOFTPHONE CTI FLOW
───────────────────────────────────────────────────────────── */
function TelephonyCtiContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <Headphones size={13} className="text-indigo-600" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              SALESFORCE CTI · SOFTPHONE DIALER FLOW
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              1-Click Dialing &amp; Task Logging
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[8px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] animate-pulse" />
          ON CALL · 02:45
        </div>
      </div>

      {/* Visual Softphone Call Widget */}
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-[8px] font-bold text-indigo-950">
          <span className="flex items-center gap-1">
            <PhoneForwarded size={10} className="text-indigo-600" /> Marcus Vance (VP Procurement, Acme Corp)
          </span>
          <span className="text-[7.5px] bg-indigo-200/70 text-indigo-900 font-black px-1.5 py-0.2 rounded">
            WebRTC HD Audio
          </span>
        </div>

        {/* CTI Controls Bar */}
        <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-[8px] font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Recording Active (18ms latency)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-slate-100 border text-[7.5px]">Mute</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 border text-[7.5px]">Hold</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[7.5px]">Transfer</span>
          </div>
        </div>

        {/* Auto Disposition */}
        <div className="flex items-center justify-between text-[8px] text-slate-600">
          <span>Disposition: <strong className="text-indigo-700">Qualified Lead (250 Seats)</strong></span>
          <span className="text-blue-600 font-extrabold">Auto-Created SF Task &rarr;</span>
        </div>
      </div>

      {/* Outcome pill */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-600">
        <span>Automatic Task &amp; Notes creation on Salesforce Account upon hangup</span>
        <span className="text-indigo-600 font-black">CTI Connected</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIEW 8: AI RECEPTIONIST DECISION TREE FLOWCHART (Slide 18)
───────────────────────────────────────────────────────────── */
function AiReceptionistContent() {
  return (
    <div className="space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pink-50 border border-pink-200 text-pink-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
            <Bot size={13} className="text-pink-600" />
          </div>
          <div>
            <div className="text-[8px] font-bold text-slate-400 uppercase leading-none">
              CONVERSATION FLOWS · 24/7 BOT DECISION TREE
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 leading-tight mt-0.5">
              Automated Qualification &amp; Booking Flow
            </h3>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[8px] font-bold">
          <Sparkles size={8} />
          &lt; 2s SLA
        </div>
      </div>

      {/* Decision Tree Flow Nodes */}
      <div className="p-2 rounded-xl bg-pink-50/60 border border-pink-200/80 space-y-1 text-[8.5px]">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-pink-600 text-white text-[7.5px] font-black flex items-center justify-center shrink-0">1</span>
          <span className="font-bold text-slate-700">Visitor: &ldquo;Looking for enterprise Salesforce WhatsApp integration&rdquo;</span>
        </div>

        <div className="pl-5 border-l-2 border-pink-300 ml-1.5 py-0.5">
          <div className="flex items-center gap-1 text-pink-900 font-extrabold">
            <Bot size={9} className="text-pink-600" /> AI Bot asks team size &amp; budget:
          </div>
          <p className="text-[8px] text-slate-600 font-medium">Lead responds: &ldquo;40 sales reps across EMEA and US&rdquo;</p>
        </div>

        <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-pink-200 text-[8px]">
          <span className="font-extrabold text-emerald-700">AI Qualification: Hot Lead (Score 92/100)</span>
          <span className="bg-pink-100 text-pink-800 font-black px-1.5 py-0.2 rounded">BOOKED IN SF CALENDAR</span>
        </div>
      </div>

      {/* Outcome pill */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-600">
        <span>Zero human intervention needed · Reps wake up to pre-qualified meetings</span>
        <span className="text-pink-600 font-black">Slide 18 Verified</span>
      </div>
    </div>
  );
}
