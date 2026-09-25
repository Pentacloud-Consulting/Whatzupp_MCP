import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { NODE_REGISTRY } from '@/lib/automationV2/nodeRegistry';

export default function CustomNode({ data, selected }: NodeProps) {
  // Find the node definition from the registry to get its pretty label, icon, and category
  const nodeDef = NODE_REGISTRY.find(n => n.type === data.type);
  
  const title = data.label && data.label !== data.type ? data.label : (nodeDef?.label || data.type);
  const IconComponent = nodeDef && Icons[nodeDef.icon as keyof typeof Icons] 
    ? (Icons[nodeDef.icon as keyof typeof Icons] as React.ElementType) 
    : Icons.Box;

  // Color coding by category
  let bgColor = 'bg-white';
  let iconColor = 'text-slate-500';
  let iconBg = 'bg-slate-100';
  let borderColor = selected ? 'border-[#00C853] shadow-[0_0_0_2px_rgba(0,200,83,0.2)]' : 'border-slate-200';

  if (nodeDef?.category === 'Triggers') {
    iconColor = 'text-purple-600';
    iconBg = 'bg-purple-100';
    if (selected) borderColor = 'border-purple-500 shadow-[0_0_0_2px_rgba(168,85,247,0.2)]';
  } else if (nodeDef?.category === 'Messaging') {
    iconColor = 'text-blue-600';
    iconBg = 'bg-blue-100';
    if (selected) borderColor = 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]';
  } else if (nodeDef?.category === 'Logic') {
    iconColor = 'text-amber-600';
    iconBg = 'bg-amber-100';
    if (selected) borderColor = 'border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]';
  } else if (nodeDef?.category === 'CRM') {
    iconColor = 'text-rose-600';
    iconBg = 'bg-rose-100';
    if (selected) borderColor = 'border-rose-500 shadow-[0_0_0_2px_rgba(225,29,72,0.2)]';
  } else if (nodeDef?.category === 'AI') {
    iconColor = 'text-indigo-600';
    iconBg = 'bg-indigo-100';
    if (selected) borderColor = 'border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]';
  }

  return (
    <div className={`flex items-center w-[260px] bg-white rounded-xl border ${borderColor} shadow-sm transition-all hover:shadow-md`}>
      {/* Input Handle (Don't show for Triggers) */}
      {nodeDef?.category !== 'Triggers' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="w-3 h-3 bg-slate-300 border-2 border-white"
        />
      )}

      {/* Node Content */}
      <div className="flex w-full p-3 items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <IconComponent size={20} className={iconColor} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
            {nodeDef?.category || 'Custom'}
          </span>
          <span className="text-sm font-bold text-slate-800 truncate">
            {title as string}
          </span>
        </div>
        {!!data.configured && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Configured" />
        )}
      </div>

      {/* Output Handle */}
      {nodeDef?.type !== 'FLOW_GOAL' && nodeDef?.type !== 'FLOW_EXIT' && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="w-3 h-3 bg-[#00C853] border-2 border-white"
        />
      )}
    </div>
  );
}
