'use client';

import React, { useState } from 'react';
import { X, Save, Send, Sparkles, Loader2, Info, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TemplatePreview from './TemplatePreview';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { useAuth } from '@/components/auth/AuthProvider';

interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE' | 'OTP';
  text: string;
  url?: string;
  phone_number?: string;
}

interface TemplateBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TemplateBuilder({ onClose, onSuccess }: TemplateBuilderProps) {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'>('NONE');
  const [headerText, setHeaderText] = useState('');
  
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');

  // Handle format of name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only lowercase and underscores
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setName(val);
  };

  const addVariable = (target: 'HEADER' | 'BODY') => {
    if (target === 'BODY') {
      const vars = bodyText.match(/\{\{\d+\}\}/g) || [];
      const nextNum = vars.length + 1;
      if (nextNum <= 10) {
        setBodyText(prev => prev + ` {{${nextNum}}}`);
      } else {
        setError('Maximum 10 variables allowed in body.');
      }
    } else {
      if (!headerText.includes('{{1}}')) {
        setHeaderText(prev => prev + ' {{1}}');
      }
    }
  };

  const addButton = (type: TemplateButton['type']) => {
    if (buttons.length >= 10) {
      setError('Maximum 10 buttons allowed.');
      return;
    }
    if (type === 'QUICK_REPLY' && buttons.filter(b => b.type === 'QUICK_REPLY').length >= 3) {
      setError('Maximum 3 Quick Reply buttons allowed.');
      return;
    }
    setButtons([...buttons, { type, text: '' }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: keyof TemplateButton, value: string) => {
    const newBtns = [...buttons];
    newBtns[index] = { ...newBtns[index], [field]: value };
    setButtons(newBtns);
  };

  const buildPayload = (isDraft: boolean) => {
    const components: any[] = [];
    
    if (headerType !== 'NONE') {
      const hc: any = { type: 'HEADER', format: headerType };
      if (headerType === 'TEXT') hc.text = headerText;
      // Note: for media, we'd normally attach a file/asset reference here.
      // For this MVP builder, we just pass the format.
      components.push(hc);
    }
    
    if (bodyText) {
      components.push({ type: 'BODY', text: bodyText });
    }
    
    if (footerText) {
      components.push({ type: 'FOOTER', text: footerText });
    }
    
    if (buttons.length > 0) {
      components.push({ type: 'BUTTONS', buttons });
    }

    return {
      name,
      category,
      language,
      components,
      workspaceId: activeWorkspace?.id || 'default_ws',
      workspaceType: activeWorkspace?.type || 'SALES_CLOUD',
      createdBy: user?.userId || user?.id || 'unknown_user',
      isDraft
    };
  };

  const handleSubmit = async (isDraft: boolean) => {
    setError('');
    if (!name) return setError('Template name is required.');
    if (!bodyText) return setError('Body text is required.');

    isDraft ? setSavingDraft(true) : setLoading(true);

    try {
      const payload = buildPayload(isDraft);
      const res = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save template.');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      isDraft ? setSavingDraft(false) : setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Template</h2>
            <p className="text-sm text-gray-500">Design your WhatsApp message template.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 text-[#00a884] rounded-lg text-sm font-semibold hover:bg-[#25D366]/20 transition-colors">
              <Sparkles size={16} />
              AI Generate
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Form Builder */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-2">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-6 max-w-2xl">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g. welcome_message_v1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a884] focus:border-transparent outline-none text-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Lowercase letters, numbers, and underscores only.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a884] outline-none text-sm bg-white"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
              </div>

              {/* Header */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-3">Header <span className="text-gray-400 font-normal">(Optional)</span></label>
                <select
                  value={headerType}
                  onChange={(e) => setHeaderType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm bg-white mb-3"
                >
                  <option value="NONE">None</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </select>
                
                {headerType === 'TEXT' && (
                  <div>
                    <input
                      type="text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      maxLength={60}
                      placeholder="Header text..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                    />
                    <div className="flex justify-between mt-1">
                      <button onClick={() => addVariable('HEADER')} type="button" className="text-[11px] font-semibold text-[#00a884] hover:underline">
                        + Add Variable {'{{1}}'}
                      </button>
                      <span className="text-[11px] text-gray-400">{headerText.length}/60</span>
                    </div>
                  </div>
                )}
                
                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white">
                    <p className="text-sm font-medium text-gray-600 mb-1">Select Media from CRM</p>
                    <p className="text-xs text-gray-400 mb-3">Stored natively in Salesforce Files or SFMC Assets.</p>
                    <button className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                      Browse Files
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Body Text <span className="text-red-500">*</span></label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={5}
                  maxLength={1024}
                  placeholder="Enter your message body..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a884] outline-none text-sm resize-none"
                />
                <div className="flex justify-between mt-1">
                  <button onClick={() => addVariable('BODY')} type="button" className="text-[11px] font-semibold text-[#00a884] hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Variable
                  </button>
                  <span className="text-[11px] text-gray-400">{bodyText.length}/1024</span>
                </div>
              </div>

              {/* Footer */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Footer <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  maxLength={60}
                  placeholder="Small grey text at the bottom..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
              </div>

              {/* Buttons */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Buttons <span className="text-gray-400 font-normal">(Optional)</span></label>
                {buttons.map((btn, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <select
                      value={btn.type}
                      onChange={(e) => updateButton(idx, 'type', e.target.value)}
                      className="w-[140px] px-2 py-1.5 border border-gray-300 rounded outline-none text-xs bg-white"
                    >
                      <option value="QUICK_REPLY">Quick Reply</option>
                      <option value="URL">Visit Website</option>
                      <option value="PHONE_NUMBER">Call Phone</option>
                    </select>
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => updateButton(idx, 'text', e.target.value)}
                        placeholder="Button Text (max 25)"
                        maxLength={25}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none text-xs"
                      />
                      {btn.type === 'URL' && (
                        <input
                          type="url"
                          value={btn.url || ''}
                          onChange={(e) => updateButton(idx, 'url', e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none text-xs"
                        />
                      )}
                      {btn.type === 'PHONE_NUMBER' && (
                        <input
                          type="tel"
                          value={btn.phone_number || ''}
                          onChange={(e) => updateButton(idx, 'phone_number', e.target.value)}
                          placeholder="+1234567890"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none text-xs"
                        />
                      )}
                    </div>
                    
                    <button onClick={() => removeButton(idx)} className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-white border border-gray-200 shadow-sm mt-[1px]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                {buttons.length < 10 && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => addButton('QUICK_REPLY')} type="button" className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors">
                      + Quick Reply
                    </button>
                    <button onClick={() => addButton('URL')} type="button" className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors">
                      + URL
                    </button>
                    <button onClick={() => addButton('PHONE_NUMBER')} type="button" className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm transition-colors">
                      + Phone
                    </button>
                  </div>
                )}
              </div>
              
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="w-[420px] bg-gray-100 border-l border-gray-200 p-6 flex flex-col items-center justify-start shrink-0 overflow-y-auto">
            <TemplatePreview 
              name={name || 'template_name'}
              category={category}
              language={language}
              headerType={headerType}
              headerText={headerText}
              bodyText={bodyText}
              footerText={footerText}
              buttons={buttons}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 size={16} className="text-[#00a884]" />
            Tenant Isolated: <span className="font-semibold text-gray-700">{activeWorkspace?.name || 'CRM Workspace'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading || savingDraft}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading || savingDraft}
              className="flex items-center gap-2 px-5 py-2 bg-[#25D366] text-white font-bold rounded-xl text-sm hover:bg-[#128C7E] transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit To Meta
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
