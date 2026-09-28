'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ShieldCheck, Zap, Layers, Sparkles, CheckCircle2,
  Users2, ArrowRight, Play, Lock, BarChart3, Cloud, Workflow,
  ChevronDown, Search, ArrowUpRight, Check, CheckCheck
} from 'lucide-react';
import ChatMockup from '@/components/landing/ChatMockup';

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
      
      {/* ── Top Navigation Bar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo_current.png" alt="WhatZupp Logo" className="h-14 md:h-20 object-contain" />
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#products" className="hover:text-slate-900 flex items-center gap-1 transition-colors">Products <ChevronDown size={14} /></a>
            <a href="#solutions" className="hover:text-slate-900 flex items-center gap-1 transition-colors">Solutions <ChevronDown size={14} /></a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#resources" className="hover:text-slate-900 flex items-center gap-1 transition-colors">Resources <ChevronDown size={14} /></a>
            <a href="#integrations" className="hover:text-slate-900 transition-colors">Integrations</a>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-sm shadow-lg shadow-[#00C853]/25 transition-all flex items-center gap-2 hover:-translate-y-0.5"
            >
              Request Demo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-32 pb-12 px-6 max-w-7xl mx-auto min-h-[85vh] flex items-center">
        {/* Background Aurora Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
           <div className="absolute top-[-5%] right-[5%] w-[900px] h-[900px] bg-gradient-to-br from-[#00C853]/10 to-teal-100/30 blur-[130px] rounded-full opacity-60" />
           <div className="absolute top-[30%] left-[-15%] w-[700px] h-[700px] bg-gradient-to-tr from-emerald-50/50 to-green-100/20 blur-[110px] rounded-full opacity-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-6 text-left relative z-20"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 backdrop-blur-sm border border-emerald-100/80 text-emerald-700 text-[11px] font-bold shadow-sm tracking-wide">
              <Sparkles size={12} className="text-[#00C853]" />
              Enterprise-Grade WhatsApp CRM Platform
            </div>

            <h1 className="font-['Inter',_sans-serif] text-5xl sm:text-[54px] lg:text-[56px] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.05]">
              Unified Customer Conversations for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C853] via-emerald-500 to-teal-500">
                Multi-Tenant Enterprises
              </span>
            </h1>

            <p className="text-slate-500 text-[17px] max-w-[420px] font-medium leading-relaxed mt-2">
              Isolated tenant environments, Salesforce Cloud & SFMC connectors, approval-gated onboarding, and granular workspace permissions in one secure platform.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-[15px] shadow-lg shadow-[#00C853]/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                Request a Demo <ArrowRight size={16} />
              </Link>

              <Link
                href="#video"
                className="px-6 py-3.5 rounded-full bg-white text-slate-700 font-bold text-[15px] shadow-sm border border-slate-200 hover:shadow-md transition-all flex items-center gap-2.5 hover:-translate-y-0.5 group"
              >
                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                  <Play size={10} className="text-slate-600 group-hover:text-[#00C853] ml-0.5" />
                </div>
                Watch Video
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 text-[11px] font-bold text-slate-500 tracking-wide">
               <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-[6px] bg-emerald-50 flex items-center justify-center text-[#00C853]"><Layers size={11}/></div>
                 Multi-Tenant Architecture
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-[6px] bg-blue-50 flex items-center justify-center text-blue-500"><Cloud size={11}/></div>
                 Salesforce & SFMC Ready
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-[6px] bg-teal-50 flex items-center justify-center text-teal-500"><ShieldCheck size={11}/></div>
                 Secure & Compliant
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-[6px] bg-purple-50 flex items-center justify-center text-purple-500"><Zap size={11}/></div>
                 99.9% Uptime SLA
               </div>
            </div>
          </motion.div>

          {/* Static Hero Image Provided by User */}
          <div className="lg:col-span-7 relative w-full hidden lg:flex items-center justify-center mt-8 xl:mt-0">
             <img 
                src="/hero%20Section%20image.png" 
                alt="WhatZupp Dashboard Mockup" 
                className="w-full h-auto object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700" 
             />
          </div>
        </div>
      </section>

      {/* ── Logo Cloud ── */}
      <section className="py-12 border-y border-slate-200/60 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-8">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trusted by growing businesses</h4>
              <h2 className="font-[Syne] text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
                 One Platform. Multiple Workspaces. <br/>
                 <span className="text-[#00C853]">Infinite Possibilities.</span>
              </h2>
              <p className="text-slate-500 text-sm mt-3 font-medium">Enable your teams to connect, automate, and grow customer relationships across Salesforce, SFMC, and more.</p>
           </div>
           
           <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" alt="Salesforce" className="h-10 hover:scale-110 transition-transform"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png" alt="Meta" className="h-6 hover:scale-110 transition-transform"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e8/HubSpot_Logo.svg" alt="HubSpot" className="h-8 hover:scale-110 transition-transform"/>
              <div className="text-2xl font-black tracking-tighter text-slate-800 hover:scale-110 transition-transform flex items-center"><Cloud size={28} className="text-blue-500 mr-2"/> SFMC</div>
           </div>
        </div>
      </section>

      {/* ── Security & Licensing ── */}
      <section id="solutions" className="py-24 max-w-7xl mx-auto px-6">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 space-y-6">
               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                 <ShieldCheck size={12}/> Platform Overview
               </div>
               <h2 className="font-[Syne] text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                 Enterprise Tenant <br/>Security & Licensing <br/>Boundary
               </h2>
               <p className="text-slate-500 font-medium">
                 Every client organization is completely isolated. User permissions are bounded strictly by tenant-purchased workspace licenses.
               </p>
               <Link href="/security" className="inline-flex px-6 py-3 rounded-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-sm shadow-md transition-all items-center gap-2">
                 Learn More <ArrowRight size={16}/>
               </Link>
            </div>
            
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
               {[
                 { title: 'Tenant Isolation', icon: <Lock size={24}/>, desc: 'Separate data, users, workflows, and customizations for each organization.', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
                 { title: 'Approval-Gated Access', icon: <Users2 size={24}/>, desc: 'Super admin control for onboarding, user invites, and workspace permissions.', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
                 { title: 'Workspace Licensing', icon: <Layers size={24}/>, desc: 'Flexibly enable Salesforce, SFMC, Zoho, HubSpot or more per tenant.', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' }
               ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col items-center text-center gap-4 relative overflow-hidden group"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white to-transparent opacity-50 pointer-events-none"/>
                     <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon}
                     </div>
                     <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section id="products" className="py-24 bg-white/40 backdrop-blur-xl border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
               <Zap size={12} className="mr-1"/> Powerful Capabilities
            </div>
            <h2 className="font-[Syne] text-4xl sm:text-5xl font-extrabold text-slate-900">
              Built for Modern <span className="text-[#00C853]">Omnichannel</span> Operations
            </h2>
            <p className="text-slate-500 text-lg font-medium">
              Complete WhatsApp messaging suite integrated seamlessly with enterprise CRM and marketing platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <MessageSquare size={22} />, title: 'Real-Time Chats', desc: 'Live WhatsApp conversations with contact context and rich media support.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: <Cloud size={22} />, title: 'SFMC Integration', desc: 'Sync subscribers, send journeys, and personalize conversations.', color: 'text-sky-500', bg: 'bg-sky-50' },
              { icon: <Cloud size={22} />, title: 'Sales Cloud Connector', desc: 'Auto-sync leads, contacts, opportunities, and activities.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { icon: <Workflow size={22} />, title: 'Automation Engine', desc: 'Trigger automated flows, auto replies, and keyword-based journeys.', color: 'text-purple-500', bg: 'bg-purple-50' },
              { icon: <BarChart3 size={22} />, title: 'Analytics & Insights', desc: 'Track team performance, response time, campaign results, and more.', color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { icon: <Zap size={22} />, title: 'Fast Reply Hub', desc: 'Create quick replies, reusable templates, and smart responses.', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: <Users2 size={22} />, title: 'Contact Management', desc: 'Unified contact profiles across Salesforce, SFMC and more.', color: 'text-rose-500', bg: 'bg-rose-50' },
              { icon: <ShieldCheck size={22} />, title: 'Platform Audit Logs', desc: 'Full audit logs for user actions, access control, and compliance.', color: 'text-teal-500', bg: 'bg-teal-50' },
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ scale: 1.02, y: -4 }}
                className="p-6 rounded-[24px] bg-white border border-slate-100 shadow-lg shadow-slate-200/40 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                   <ArrowRight size={16} className="text-slate-300"/>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-sm mb-5`}>
                  {item.icon}
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-[#00C853]/5 -z-20"/>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10"/>
         
         <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-emerald-600 text-xs font-bold uppercase tracking-widest border border-emerald-100 shadow-sm mb-6">
               Get Started Today
            </div>
            <h2 className="font-[Syne] text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
               Transform Your <br/>
               <span className="text-[#00C853]">Customer Conversations</span>
            </h2>
            <p className="text-slate-600 text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-10">
               Join modern enterprises using WhatZupp to deliver smarter, faster, and more personalized customer experiences.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
               <Link
                 href="/signup"
                 className="px-8 py-4 rounded-full bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-lg shadow-xl shadow-[#00C853]/30 transition-all flex items-center gap-2 hover:-translate-y-1"
               >
                 Request a Demo <ArrowRight size={20} />
               </Link>
               <Link
                 href="/contact"
                 className="px-8 py-4 rounded-full bg-white text-slate-800 font-bold text-lg shadow-md border border-slate-100 hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-1"
               >
                 Talk to Sales
               </Link>
            </div>
         </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
           <div className="col-span-2 lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-xl bg-[#00C853] flex items-center justify-center text-white font-extrabold text-lg">W</div>
                 <span className="font-[Syne] font-extrabold text-slate-900 text-xl tracking-tight">WhatZupp</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                 The enterprise-grade WhatsApp CRM platform. Secure, multi-tenant, and seamlessly integrated with Salesforce and SFMC.
              </p>
           </div>
           
           <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                 <li><Link href="#" className="hover:text-[#00C853]">Real-Time Chat</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Automation</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Salesforce Sync</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">SFMC Journeys</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Security</Link></li>
              </ul>
           </div>
           
           <div>
              <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                 <li><Link href="#" className="hover:text-[#00C853]">Documentation</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">API Reference</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Help Center</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Blog</Link></li>
              </ul>
           </div>

           <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                 <li><Link href="#" className="hover:text-[#00C853]">About</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Customers</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Contact</Link></li>
                 <li><Link href="#" className="hover:text-[#00C853]">Privacy Policy</Link></li>
              </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="text-xs font-semibold text-slate-400">
              © {new Date().getFullYear()} WhatZupp Platform. All rights reserved.
           </div>
           <div className="flex items-center gap-6">
              <Link href="#" className="text-slate-400 hover:text-slate-600 transition-colors"><MessageSquare size={18}/></Link>
           </div>
        </div>
      </footer>
    </div>
  );
}