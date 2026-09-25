import React, { useState } from 'react';
import { X, Settings, Users, GitBranch, Zap } from 'lucide-react';
import { Node } from '@xyflow/react';

interface ConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function ConfigPanel({ selectedNode, onUpdateNode, onClose }: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'audience' | 'conditions' | 'advanced'>('general');

  if (!selectedNode) return null;

  return (
    <aside className="w-[340px] bg-white border-l border-slate-200 flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Configure Node</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{selectedNode.type}</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-3 border-b border-slate-100 gap-4">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-2 text-xs font-bold transition-colors ${activeTab === 'general' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings size={12} className="inline mr-1 mb-0.5" /> General
        </button>
        {selectedNode.type.includes('TRIGGER') && (
          <button 
            onClick={() => setActiveTab('audience')}
            className={`pb-2 text-xs font-bold transition-colors ${activeTab === 'audience' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={12} className="inline mr-1 mb-0.5" /> Audience
          </button>
        )}
        {(selectedNode.type.includes('LOGIC') || selectedNode.type.includes('WAIT')) && (
          <button 
            onClick={() => setActiveTab('conditions')}
            className={`pb-2 text-xs font-bold transition-colors ${activeTab === 'conditions' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <GitBranch size={12} className="inline mr-1 mb-0.5" /> Conditions
          </button>
        )}
        <button 
          onClick={() => setActiveTab('advanced')}
          className={`pb-2 text-xs font-bold transition-colors ${activeTab === 'advanced' ? 'text-[#00C853] border-b-2 border-[#00C853]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Zap size={12} className="inline mr-1 mb-0.5" /> Advanced
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">Custom Name (Optional)</label>
              <input 
                value={selectedNode.data?.label || ''}
                onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, label: e.target.value })}
                placeholder="E.g. Send Welcome Msg" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00C853]/30 focus:border-[#00C853]"
              />
            </div>
            
            {/* Dynamic fields based on node type would render here */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center mt-6">
              <p className="text-xs text-slate-500 font-medium italic">Advanced configuration fields will mount here during Sprint 3 & 4.</p>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}
