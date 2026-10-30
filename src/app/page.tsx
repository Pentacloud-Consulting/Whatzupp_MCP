'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
  MessageSquare, ShieldCheck, Zap, Layers, Sparkles, CheckCircle2,
  Users2, ArrowRight, Play, Lock, BarChart3, Cloud, Workflow,
  ChevronDown, Search, ArrowUpRight, Check, CheckCheck,
  Smartphone, EyeOff, Clock, Unplug, Send, AlertTriangle, Bot, Radio,
  PhoneCall, Phone, Mail, Linkedin, Instagram, Facebook, X, Star, Quote
} from 'lucide-react';
import HeroFeatureShowcase from '@/components/landing/HeroFeatureShowcase';

/* ── Numerical Metric Counter for Testimonials ── */
function AnimatedMetric({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }
    if (!isInView) return;

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(value * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>;
  }

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function SaaSLandingPage() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const y1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 150]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#00C853]/20 overflow-x-hidden font-sans">
      
      {/* ── Top Navigation Bar (High-End Glassmorphic Design with Big Brand Logo) ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] py-2 sm:py-2.5' 
          : 'bg-white/40 backdrop-blur-md border-b border-slate-200/40 py-2.5 sm:py-3'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center group py-0.5">
            <img 
              src="/logo_current.png" 
              alt="WhatZupp Logo" 
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs" 
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-sm font-semibold text-slate-600 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
            <a href="#products" className="px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-white/80 transition-all flex items-center gap-1 group">
              <span>Products</span>
              <ChevronDown size={13} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a href="#solutions" className="px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-white/80 transition-all flex items-center gap-1 group">
              <span>Solutions</span>
              <ChevronDown size={13} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a href="#pricing" className="px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-white/80 transition-all">Pricing</a>
            <a href="#resources" className="px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-white/80 transition-all flex items-center gap-1 group">
              <span>Resources</span>
              <ChevronDown size={13} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
            </a>
            <a href="#integrations" className="px-3 py-1.5 rounded-full hover:text-slate-900 hover:bg-white/80 transition-all">Integrations</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/login" 
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="relative group overflow-hidden px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00C853] via-[#00B248] to-[#00963C] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#00C853]/30 hover:shadow-lg hover:shadow-[#00C853]/45 transition-all flex items-center gap-2 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Request Demo</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Left & Right Hero Section (Calibrated for 1-Screen Desktop Viewport Fit) ── */}
      <section className="relative z-10 pt-28 sm:pt-32 lg:pt-32 xl:pt-36 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 xl:px-12 max-w-[1440px] mx-auto w-full min-h-screen flex items-center justify-center">
        {/* Modern Full-Bleed Dot Mesh & Aurora Ambient Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:26px_26px] opacity-45 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_35%,#000_65%,transparent_100%)]" />
          <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-emerald-100/70 via-teal-100/35 to-transparent blur-[120px] rounded-full opacity-80" />
          <div className="absolute top-[25%] right-[2%] w-[650px] h-[650px] bg-gradient-to-br from-[#00C853]/15 via-teal-200/20 to-transparent blur-[140px] rounded-full opacity-65" />
          <div className="absolute top-[30%] left-[2%] w-[650px] h-[650px] bg-gradient-to-tr from-emerald-100/40 via-green-100/25 to-transparent blur-[140px] rounded-full opacity-65" />
        </div>

        <HeroFeatureShowcase />
      </section>

      {/* ── Official Integrations Logo Cloud ── */}
      <section id="integrations" className="py-14 border-y border-slate-200/70 bg-gradient-to-b from-white/60 via-slate-50/50 to-white/70 backdrop-blur-lg overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
           <motion.div 
             initial={{ opacity: 0, y: 22 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-60px" }}
             transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
             className="text-center mb-9"
           >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-600 text-[10.5px] font-bold uppercase tracking-widest border border-slate-200/80 mb-3 shadow-2xs">
                Official Enterprise Ecosystem
              </div>
              <h2 className="font-[Syne] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                 One Platform. Multiple Workspaces. <br/>
                 <span className="text-[#00C853]">Infinite Possibilities.</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto font-medium">
                Connect, automate, and grow customer relationships seamlessly across official enterprise CRM and marketing platforms.
              </p>
           </motion.div>
           
           {/* Official Partner Brand Logo Cards with Staggered Entrance */}
           <div className="flex flex-wrap justify-center items-center gap-3.5 sm:gap-5">
              {[
                { src: "/logos/salesforce.svg", alt: "Salesforce Sales Cloud" },
                { src: "/logos/sfmc.svg", alt: "Salesforce Marketing Cloud" },
                { src: "/logos/whatsapp.svg", alt: "Meta WhatsApp Business API" },
                { src: "/logos/meta.svg", alt: "Meta" },
                { src: "/logos/hubspot.svg", alt: "HubSpot" },
                { src: "/logos/zoho.svg", alt: "Zoho CRM" },
                { src: "/logos/twilio.svg", alt: "Twilio" },
              ].map((logo, idx) => (
                <motion.div
                  key={logo.alt}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, scale: 1.04, transition: { duration: 0.2 } }}
                  className="bg-white/90 hover:bg-white backdrop-blur-md px-6 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex items-center justify-center group cursor-pointer"
                >
                  <img src={logo.src} alt={logo.alt} className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105" />
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* ── The Problem & The Solution (Revamped World-Class UI/UX, 1-Desktop Screen Fit) ── */}
      <section id="solutions" className="min-h-[calc(100vh-68px)] lg:h-[calc(100vh-68px)] py-6 sm:py-8 lg:py-3.5 xl:py-5 bg-[#060C16] text-white relative overflow-hidden border-b border-slate-800/80 flex flex-col justify-center">
        {/* Sleek Aurora Ambient Lighting Backdrop */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[700px] h-[450px] bg-rose-500/[0.05] blur-[150px] rounded-full" />
          <div className="absolute top-1/3 right-1/4 translate-x-1/3 w-[750px] h-[500px] bg-[#00C853]/[0.12] blur-[140px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00A1E0]/[0.05] blur-[140px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:26px_26px] opacity-35 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_50%,#000_65%,transparent_100%)]" />
        </div>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 w-full">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto space-y-2 mb-4 sm:mb-5 lg:mb-3.5 xl:mb-5"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,200,83,0.12)] text-[10.5px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>THE PROBLEM &amp; THE SOLUTION</span>
            </div>

            <h2 className="font-['Inter',_sans-serif] text-2xl sm:text-3xl lg:text-[32px] xl:text-[36px] font-black text-white leading-[1.2] tracking-tight">
              <span className="block">
                Conversations are Everywhere on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] via-[#00C853] to-[#059669] drop-shadow-[0_0_25px_rgba(0,230,118,0.4)]">WhatsApp.</span>
              </span>
              <span className="block mt-0.5 sm:mt-1">
                Your <span className="italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A1E0] to-[#38BDF8] drop-shadow-[0_0_20px_rgba(0,161,224,0.35)]">Salesforce</span> is Somewhere Else.
              </span>
            </h2>

            <p className="text-slate-400 text-xs sm:text-[13.5px] font-medium max-w-xl mx-auto leading-relaxed">
              See what happens when customer chats stay scattered &mdash; and how WhatZupp unifies your entire network into Salesforce.
            </p>
          </motion.div>

          {/* Comparison Cards Chassis with Center Transformation Bridge */}
          <div className="relative max-w-5xl mx-auto">
            {/* Center Transformation Connector Bridge (Desktop) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#081220] border border-emerald-500/40 shadow-[0_0_30px_rgba(0,200,83,0.25)] items-center justify-center text-[11px] font-mono font-black text-emerald-400 ring-4 ring-[#060C16] group/vs cursor-default"
            >
              <ArrowRight size={16} className="text-[#00E676] group-hover/vs:translate-x-0.5 transition-transform duration-200" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 xl:gap-6 items-stretch">
              
              {/* ── Card 1: The Problem (Without WhatZupp) ── */}
              <motion.div
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="rounded-[26px] bg-gradient-to-b from-[#0F172A]/90 via-[#0A101E]/95 to-[#070D18] border border-rose-500/20 hover:border-rose-500/40 p-5 sm:p-6 lg:p-5 xl:p-5.5 shadow-2xl shadow-rose-950/20 relative backdrop-blur-xl flex flex-col justify-between overflow-hidden group transition-all"
              >
                {/* Subtle top rose light flair */}
                <div className="absolute top-0 left-0 w-36 h-36 bg-rose-500/[0.08] blur-2xl pointer-events-none rounded-full" />

                <div>
                  <div className="flex items-center justify-between pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      <h3 className="font-['Inter',_sans-serif] text-lg sm:text-xl font-black text-white tracking-tight">
                        The Problem
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/25 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Without WhatZupp
                    </span>
                  </div>

                  <p className="italic text-slate-400 text-xs sm:text-[12px] mt-0.5 leading-relaxed">
                    &ldquo;Conversations, contacts, and customer relationships stay trapped on personal phones.&rdquo;
                  </p>

                  {/* Clean Bento Micro-Rows */}
                  <div className="space-y-2 mt-3.5">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <Smartphone size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-slate-300 font-medium">Scattered contacts across personal rep phones</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <Radio size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-slate-300 font-medium">No campaign broadcasts or message templates</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <EyeOff size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-slate-300 font-medium">Zero conversation tracking or team accountability</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <Clock size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-slate-300 font-medium">Manual replies with zero automated flows</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <Unplug size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-slate-300 font-medium">Completely disconnected from Salesforce Sales Cloud</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Result Pill */}
                <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-rose-950/25 border border-rose-500/25 flex items-center gap-2.5 text-xs">
                  <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                  <span><strong className="text-rose-300">Impact:</strong> <span className="text-slate-300">Lost customer network &amp; zero visibility in Salesforce.</span></span>
                </div>
              </motion.div>

              {/* ── Card 2: The Solution: WhatZupp (With WhatZupp) ── */}
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="rounded-[26px] bg-gradient-to-b from-[#06261B]/95 via-[#071F17]/95 to-[#04140F] border-2 border-[#00C853]/60 hover:border-[#00C853] p-5 sm:p-6 lg:p-5 xl:p-5.5 shadow-[0_0_60px_-15px_rgba(0,200,83,0.35)] relative backdrop-blur-xl flex flex-col justify-between overflow-hidden group transition-all"
              >
                {/* Glowing corner green light flair */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#00C853]/25 via-emerald-500/10 to-transparent blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00E676] shadow-[0_0_10px_#00E676]" />
                      <h3 className="font-['Inter',_sans-serif] text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-[#00C853] tracking-tight">
                        The Solution: WhatZupp
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,200,83,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                      Social &amp; Network Engine
                    </span>
                  </div>

                  <p className="italic text-emerald-200/80 text-xs sm:text-[12px] mt-0.5 leading-relaxed">
                    &ldquo;Turn conversations into opportunities with unified social messaging and flows.&rdquo;
                  </p>

                  {/* Clean Bento Micro-Rows */}
                  <div className="space-y-2 mt-3.5">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00E676] shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.3)]">
                        <MessageSquare size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-white font-semibold">One unified 2-way team chat &amp; contact hub</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00E676] shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.3)]">
                        <Send size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-white font-semibold">Targeted WhatsApp broadcasts &amp; templates</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00E676] shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.3)]">
                        <Bot size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-white font-semibold">Automated conversation flows &amp; instant bots</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00E676] shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.3)]">
                        <BarChart3 size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-white font-semibold">Real-time message &amp; conversion analytics</span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 hover:bg-emerald-500/[0.1] hover:border-emerald-500/40 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-[#00C853]/20 border border-[#00C853]/40 flex items-center justify-center text-[#00E676] shrink-0 shadow-[0_0_8px_rgba(0,200,83,0.3)]">
                        <Cloud size={14} />
                      </div>
                      <span className="text-xs sm:text-[12.5px] text-white font-semibold">100% native 2-way sync with Salesforce</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Vision Pill */}
                <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-emerald-950/50 border border-[#00C853]/50 text-emerald-300 text-xs font-bold leading-snug flex items-center justify-between shadow-[0_0_20px_rgba(0,200,83,0.15)]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#00E676] shrink-0" />
                    <span><strong className="text-white">Result:</strong> Turn every conversation into a Salesforce opportunity.</span>
                  </div>
                  <span className="flex h-2.5 w-2.5 relative shrink-0 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C853]" />
                  </span>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Four Channels · One Platform: 8-Card Enterprise Showcase ── */}
      <section id="products" className="py-20 lg:py-24 bg-gradient-to-b from-[#F8FAFC] via-white to-slate-50/70 border-t border-slate-200/70 relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-emerald-50/40 blur-[160px] rounded-full" />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2.5 text-[#00C853] text-[11px] sm:text-xs font-bold tracking-[0.24em] uppercase mb-3.5">
              <span className="w-6 h-px bg-[#00C853]" />
              FOUR CHANNELS · ONE PLATFORM
              <span className="w-6 h-px bg-[#00C853]" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.18]">
              Explore everything WhatZupp brings to <br className="hidden sm:inline" />
              <span className="italic font-bold text-[#00A1E0]">Salesforce.</span>
            </h2>
          </motion.div>

          {/* 8-Card Enterprise Grid (4 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* ── Card 1: Unified WhatsApp Inbox ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-emerald-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#00C853] flex items-center justify-center text-white shadow-md shadow-[#00C853]/30 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.155.57 4.178 1.564 5.928l-1.664 6.084 6.241-1.637c1.701.928 3.65 1.458 5.723 1.458 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                  </svg>
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Unified WhatsApp Inbox
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Real-time conversations, rich media, voice notes, quick replies, interactive buttons, and live chat updates.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Real-time 2-way chat &amp; live updates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Rich media, voice notes &amp; PDFs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Quick replies &amp; interactive buttons</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Direct Salesforce record linking</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/chats" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Inbox</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 2: Contacts & AI Lead Intelligence ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-blue-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1E88E5] flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <Users2 size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Contacts &amp; AI Lead Intelligence
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Shared contacts, ownership assignment, Salesforce profiles, AI lead scoring, and engagement insights.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Shared team contacts &amp; ownership</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Real-time AI Lead_Score__c rating</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Native Salesforce contact profiles</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Buyer engagement intent insights</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/contacts" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Contacts</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 3: Campaigns & Broadcasts ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-indigo-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <Send size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Campaigns &amp; Broadcasts
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Dynamic campaign lists, audience segmentation, personalized broadcasts, and scheduled campaigns.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Dynamic campaign lists &amp; filters</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Audience segmentation by labels</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>High-throughput bulk broadcasts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Scheduled WhatsApp drip journeys</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/broadcasts" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Campaigns</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 4: Templates & Messaging Compliance ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-teal-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Templates &amp; Messaging Compliance
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Meta-synced templates, approval tracking, dynamic variables, media, CTA buttons, and automated STOP opt-outs.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Official Meta-approved templates</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Dynamic variables &amp; CTA buttons</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Approval status live sync tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Automated STOP opt-out compliance</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/templates" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Templates</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 5: Automation & Conversation Flows ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-purple-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#9333EA] flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <Bot size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Automation &amp; Conversation Flows
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Keyword triggers, out-of-office replies, SLA alerts, auto-tagging, chatbot journeys, lead qualification, and automatic follow-ups.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Visual chatbot journey builder</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Keyword triggers &amp; auto-responders</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Lead qualification &amp; auto-tagging</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>SLA alerts &amp; automated follow-ups</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/automation" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Automation</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 6: Salesforce Integration & Smart Archiving ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-sky-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#00A1E0] flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <Cloud size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Salesforce Integration &amp; Archiving
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Sales Cloud and Marketing Cloud connectivity, two-way synchronization, workspace isolation, and Big Object chat archiving.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Native Sales Cloud &amp; SFMC sync</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Real-time 2-way data bridge</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Multi-tenant workspace isolation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Big Object archive (84% storage saved)</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/salescloud" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Integration</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 7: Analytics & Call History ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-amber-50/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Analytics &amp; Call History
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Delivery and read metrics, engagement funnels, campaign performance, searchable voice/video call logs, and agent activity.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Sent, Delivered, Read &amp; Replied funnel</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Searchable voice &amp; video call logs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Campaign conversion ROI tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Agent response times &amp; performance</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/analytics" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Analytics</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* ── Card 8: Enterprise Admin & Team Coverage ── */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-[28px] bg-white border border-slate-100 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.12)] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between transition-all group"
            >
              <div className="w-32 h-32 rounded-full bg-slate-100/90 absolute -top-8 -right-8 pointer-events-none transition-transform group-hover:scale-110 duration-300" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0B1528] flex items-center justify-center text-white shadow-md shadow-slate-900/25 group-hover:scale-105 transition-transform duration-300 relative z-10">
                  <Lock size={20} className="text-white" />
                </div>
                <h3 className="font-serif text-[20px] sm:text-[21px] font-bold text-slate-900 mt-5 mb-2.5 tracking-tight min-h-[54px] flex items-center">
                  Enterprise Admin &amp; Team Coverage
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] leading-relaxed font-normal mb-5 min-h-[58px]">
                  Dashboard KPIs, users and teams, role-based permissions, workspace access, temporary coverage transfers, license tracking, and settings.
                </p>
                <ul className="space-y-2 mb-6 text-xs sm:text-[12px] text-slate-600 font-medium min-h-[104px]">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Role-based permissions &amp; security</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Executive dashboard &amp; live KPIs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Temporary team coverage transfers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C853] shrink-0" />
                    <span>Workspace licensing &amp; audit controls</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/settings" 
                className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#00C853] hover:text-[#00B248] tracking-wider uppercase transition-all group-hover:gap-2.5"
              >
                <span>Explore Admin</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Enterprise Testimonials Section ── */}
      <section id="testimonials" className="py-14 sm:py-16 bg-[#F8FAFC] border-t border-slate-200/60 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-48 bg-gradient-to-b from-[#00C853]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00C853]/10 border border-[#00C853]/25 text-[#00963C] text-[11px] font-bold tracking-wider uppercase mb-3">
              <Sparkles size={12} className="text-[#00C853]" />
              <span>TESTIMONIALS · ENTERPRISE PROOF</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trusted by high-growth teams running on <span className="text-[#00A1E0]">Salesforce</span>
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Discover how leading sales, marketing, and support organizations accelerate deals and scale WhatsApp conversations with WhatZupp.
            </p>
          </motion.div>

          {/* Quick Stats Proof Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {[
              { component: <AnimatedMetric value={98.4} decimals={1} suffix="%" />, label: 'Average Open Rate', desc: 'vs. 21% standard email' },
              { component: <AnimatedMetric value={3.8} decimals={1} suffix="x" />, label: 'Faster Deal Cycles', desc: 'instant WhatsApp close' },
              { component: <AnimatedMetric value={84} decimals={0} suffix="%" />, label: 'SF Storage Saved', desc: 'Big Object archiving' },
              { component: <AnimatedMetric value={90} prefix="< " suffix="s" />, label: 'First Response SLA', desc: 'AI routing & softphone' },
            ].map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs text-center"
              >
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{m.component}</div>
                <div className="text-[12px] font-bold text-slate-800 mt-0.5">{m.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{m.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* 3 Customer Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Sales Cloud
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed mb-6 font-normal">
                  &ldquo;WhatZupp solved our biggest blind spot. Our sales reps chat with prospects directly inside Salesforce, leads get scored instantly by AI, and every message logs right back to the Lead record. Pipeline velocity jumped by 42%.&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0055D4] to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  MS
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    Marcus Sterling
                    <CheckCircle2 size={12} className="text-[#00C853] shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">VP of RevOps, ApexFin Global</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                    Marketing Cloud
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed mb-6 font-normal">
                  &ldquo;Managing WhatsApp broadcasts across 200,000+ subscribers used to be a compliance nightmare. With WhatZupp, we sync our SFMC audience segments, trigger Meta-approved templates, and achieve a 98% delivery rate within minutes.&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  ER
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    Elena Rostova
                    <CheckCircle2 size={12} className="text-[#00C853] shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Head of Growth, CloudScale Retail</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                    Service Cloud
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-[13px] leading-relaxed mb-6 font-normal">
                  &ldquo;The unified inbox with live agent handoff and built-in CTI softphone cut our support resolution time from hours to under 3 minutes. Plus, Big Object archiving keeps our Salesforce storage costs under control effortlessly.&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-400 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  DR
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    Devon Reynolds
                    <CheckCircle2 size={12} className="text-[#00C853] shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Director of Support, NovaTech Group</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Compact Floating WhatZupp CTA Card ── */}
      <section className="py-10 sm:py-12 bg-gradient-to-b from-white to-slate-100/70 relative">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] bg-gradient-to-r from-[#0055D4] via-[#006CE6] to-[#0094EC] p-6 sm:p-8 lg:p-9 shadow-[0_20px_50px_-12px_rgba(0,85,212,0.35)] relative overflow-hidden"
          >
            {/* Ambient lighting effects */}
            <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-cyan-300/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-4xl">
              <div className="text-[10px] sm:text-[11px] font-bold text-white/90 tracking-[0.22em] uppercase mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                FOUR CHANNELS · ONE PLATFORM · WHATZUPP
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-snug mb-2">
                Ready to Bring WhatsApp into Salesforce?
              </h2>
              <p className="text-white/85 text-xs sm:text-[13.5px] font-normal max-w-2xl leading-relaxed mb-6">
                Unify conversations, run dynamic broadcasts, automate smart chatbot journeys, and sync customer intelligence in real time with WhatZupp.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/20">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/signup"
                    className="px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 group hover:-translate-y-0.5"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#0055D4]" />
                  </Link>
                  <Link
                    href="#products"
                    className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold text-xs sm:text-sm transition-all hover:-translate-y-0.5"
                  >
                    <span>Explore Platform</span>
                  </Link>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-white/75 text-[11px] font-medium mr-2">Questions?</span>
                  <a 
                    href="mailto:sales@whatzupp.com" 
                    className="text-white font-bold text-xs sm:text-sm hover:underline transition-all inline-block"
                  >
                    sales@whatzupp.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Short, Simple & Clean Enterprise Dark Navy Footer ── */}
      <footer className="bg-[#060C18] text-white pt-10 sm:pt-12 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[1240px] mx-auto relative z-10"
        >
          
          {/* Main Link Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-8 sm:mb-10">
            
            {/* Column 1: Brand & Contact (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3.5">
                <img 
                  src="/logo_current.png" 
                  alt="WhatZupp Logo" 
                  className="h-14 sm:h-16 lg:h-18 w-auto object-contain brightness-110 drop-shadow-lg transition-transform hover:scale-105 duration-200" 
                />
                <div className="border-l border-slate-700/80 pl-3.5">
                  <div className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase">WhatZupp Platform</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Social &amp; Network Engine for Salesforce</div>
                </div>
              </div>
              
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Enterprise WhatsApp messaging built natively for Salesforce Sales Cloud &amp; Marketing Cloud. Connect conversations and AI scoring directly into your CRM.
              </p>

              <div className="pt-1 text-xs">
                <a href="mailto:sales@whatzupp.com" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                  <Send size={12} className="text-[#00A1E0]" />
                  <span>sales@whatzupp.com</span>
                </a>
              </div>
            </div>

            {/* Column 2: Platform (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wider uppercase">Platform</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><Link href="/chats" className="hover:text-white transition-colors">Inbox</Link></li>
                <li><Link href="/contacts" className="hover:text-white transition-colors">Contacts</Link></li>
                <li><Link href="/broadcasts" className="hover:text-white transition-colors">Broadcasts</Link></li>
                <li><Link href="/templates" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="/automation" className="hover:text-white transition-colors">Automation</Link></li>
              </ul>
            </div>

            {/* Column 3: Enterprise (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wider uppercase">Enterprise</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li><Link href="/salescloud" className="hover:text-white transition-colors">Salesforce Sync</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics &amp; Logs</Link></li>
                <li><Link href="/salescloud" className="hover:text-white transition-colors">Big Object Archive</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security &amp; Trust</Link></li>
              </ul>
            </div>

          </div>

          {/* Full Name WhatZupp Watermark Typography - 100% visible, no clipping */}
          <div className="w-full my-4 sm:my-6 select-none pointer-events-none flex justify-center overflow-hidden px-2">
            <svg viewBox="0 0 1300 145" className="w-full max-w-[1240px] max-h-[105px] sm:max-h-[125px] h-auto select-none overflow-visible">
              <text
                x="50%"
                y="52%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#0E1B36"
                fontSize="145"
                fontWeight="900"
                fontFamily="'Syne', system-ui, -apple-system, sans-serif"
                letterSpacing="-2"
                className="select-none"
              >
                WHATZUPP
              </text>
            </svg>
          </div>

          {/* Bottom Sub-Footer Bar */}
          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-400 font-medium text-center sm:text-left">
              © 2026 WhatZupp Platform. All rights reserved.
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#00A1E0] hover:border-[#00A1E0]/50 hover:bg-slate-800 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin size={13} />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                aria-label="X (Twitter)"
              >
                <X size={12} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#E1306C] hover:border-[#E1306C]/50 hover:bg-slate-800 transition-all"
                aria-label="Instagram"
              >
                <Instagram size={13} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-slate-800 transition-all"
                aria-label="Facebook"
              >
                <Facebook size={13} />
              </a>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-3 text-slate-400">
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span className="text-slate-700">·</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span className="text-slate-700">·</span>
              <Link href="/security" className="hover:text-[#00C853] transition-colors">Security</Link>
            </div>
          </div>

        </motion.div>
      </footer>
    </div>
  );
}