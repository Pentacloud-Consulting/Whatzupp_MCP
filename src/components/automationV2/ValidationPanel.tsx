import React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { ValidationIssue } from '@/lib/automationV2/validator';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  onClose: () => void;
  onNodeSelect: (nodeId: string) => void;
}

export default function ValidationPanel({ issues, onClose, onNodeSelect }: ValidationPanelProps) {
  if (issues.length === 0) return null;

  return (
    <div className="absolute top-20 right-6 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-40 overflow-hidden animate-in fade-in slide-in-from-top-4">
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white text-xs font-bold flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          Pre-Publish Validation
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      
      <div className="max-h-60 overflow-y-auto scrollbar-none p-2 space-y-1 bg-slate-50">
        {issues.map((issue, idx) => (
          <div 
            key={idx}
            onClick={() => issue.nodeId && onNodeSelect(issue.nodeId)}
            className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${issue.nodeId ? 'cursor-pointer hover:bg-white' : ''} ${
              issue.type === 'error' ? 'bg-red-50/50 border-red-100 text-red-700' : 'bg-amber-50/50 border-amber-100 text-amber-700'
            }`}
          >
            {issue.type === 'error' ? <AlertCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            <div>
              <p className="text-[11px] font-bold leading-tight mb-1">{issue.message}</p>
              {issue.nodeId && <span className="text-[9px] font-medium opacity-70 underline">Click to inspect node</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
