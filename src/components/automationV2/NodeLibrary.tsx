import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import { getNodesByCategory } from '@/lib/automationV2/nodeRegistry';

export default function NodeLibrary() {
  const [search, setSearch] = useState('');
  const categories = getNodesByCategory();

  const onDragStart = (event: React.DragEvent, nodeType: string, defaultData: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10">
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes (e.g. AI, Logic)..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00C853]/30 focus:border-[#00C853]"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-6">
        {Object.entries(categories).map(([category, nodes]) => {
          const filtered = nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase()));
          if (filtered.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{category}</h3>
              <div className="space-y-2">
                {filtered.map(node => (
                  <div 
                    key={node.type}
                    onDragStart={(e) => onDragStart(e, node.type, node.defaultData)}
                    draggable
                    className="flex flex-col p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-[#00C853] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{node.label}</span>
                      <Info size={12} className="text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{node.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
