import React from 'react';
import { Eye, ExternalLink } from 'lucide-react';

interface TemplatePreviewProps {
  name: string;
  category: string;
  language: string;
  headerType: string;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
}

export default function TemplatePreview({
  name,
  category,
  language,
  headerType,
  headerText,
  bodyText,
  footerText,
  buttons
}: TemplatePreviewProps) {
  
  const getCategoryStyle = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'UTILITY': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'MARKETING': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'AUTHENTICATION': return 'bg-amber-50 text-amber-600 border border-amber-200';
      default: return 'bg-gray-50 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-[360px] mx-auto">
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900">Live Preview</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${getCategoryStyle(category)}`}>
            {category || 'CATEGORY'}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {language || 'EN'}
          </span>
        </div>
      </div>

      {/* Phone Frame */}
      <div className="bg-gray-900 rounded-[2rem] p-2 shadow-xl shadow-black/10">
        {/* Phone Header */}
        <div className="bg-[#128C7E] rounded-t-[1.5rem] px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
            W
          </div>
          <div>
            <p className="text-white font-semibold text-[13px]">WhatZupp Business</p>
            <p className="text-white/60 text-[10px]">Official Business Account</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="bg-[#ECE5DD] min-h-[280px] px-3 py-4 flex flex-col justify-end gap-2" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c5bfb5\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
          
          {/* Message Bubble */}
          <div className="max-w-[90%] self-start w-full">
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
              
              {/* Media Header Placeholder */}
              {['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(headerType) && (
                <div className="bg-gray-200 h-32 w-full flex items-center justify-center border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">{headerType} ATTACHMENT</span>
                </div>
              )}

              {/* Text Header */}
              {headerType === 'TEXT' && headerText && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[13px] font-bold text-gray-900 break-words">
                    {headerText}
                  </p>
                </div>
              )}

              {/* Body */}
              <div className="px-3 py-2">
                <p className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                  {bodyText || 'Your message text will appear here...'}
                </p>
              </div>

              {/* Footer */}
              {footerText && (
                <div className="px-3 pb-1">
                  <p className="text-[11px] text-gray-400 italic break-words">
                    {footerText}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex justify-end px-3 pb-2">
                <span className="text-[9px] text-gray-400 font-medium">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>

              {/* Buttons */}
              {buttons.length > 0 && (
                <div className="border-t border-gray-100">
                  {buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center gap-1.5 py-2 text-[13px] text-[#00a884] font-medium"
                      style={{ borderBottom: idx < buttons.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      {btn.type === 'URL' && <ExternalLink size={12} />}
                      {btn.text || 'Button'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phone Bottom Bar */}
        <div className="bg-[#F0F0F0] rounded-b-[1.5rem] px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[12px] text-gray-400">
            Type a message
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="m21.4 11.6-17-8c-.7-.3-1.4.3-1.2 1l1.8 6.4h9v2h-9l-1.8 6.4c-.2.7.5 1.3 1.2 1l17-8c.6-.3.6-1.1 0-1.4z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
