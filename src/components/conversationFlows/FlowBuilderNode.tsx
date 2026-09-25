'use client';

// src/components/conversationFlows/FlowBuilderNode.tsx
// Custom React Flow node for the Conversation Flows builder.

import React, { useEffect } from 'react';
import { Handle, Position, NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { FLOW_NODE_REGISTRY } from '@/lib/conversationFlows/flowNodeRegistry';

export default function FlowBuilderNode({ id, data, selected }: NodeProps & { data: any }) {
  const nodeDef = FLOW_NODE_REGISTRY.find(n => n.type === data.type);
  const title = data.label || nodeDef?.label || data.type;
  const updateNodeInternals = useUpdateNodeInternals();
  const IconComponent = nodeDef && Icons[nodeDef.icon as keyof typeof Icons]
    ? (Icons[nodeDef.icon as keyof typeof Icons] as React.ElementType)
    : Icons.Box;

  // Tell React Flow to re-measure handles when buttons array changes
  useEffect(() => {
    updateNodeInternals(id);
  }, [data.buttons?.length, id, updateNodeInternals]);

  const colorMap: Record<string, { iconBg: string; iconText: string; border: string }> = {
    purple: { iconBg: 'bg-purple-100', iconText: 'text-purple-600', border: 'border-purple-400' },
    blue: { iconBg: 'bg-blue-100', iconText: 'text-blue-600', border: 'border-blue-400' },
    teal: { iconBg: 'bg-teal-100', iconText: 'text-teal-600', border: 'border-teal-400' },
    amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-600', border: 'border-amber-400' },
    rose: { iconBg: 'bg-rose-100', iconText: 'text-rose-600', border: 'border-rose-400' },
    slate: { iconBg: 'bg-slate-100', iconText: 'text-slate-600', border: 'border-slate-400' },
    red: { iconBg: 'bg-red-100', iconText: 'text-red-600', border: 'border-red-400' },
  };

  const colors = colorMap[nodeDef?.color || 'slate'] || colorMap.slate;
  const selectedBorder = selected ? `${colors.border} shadow-[0_0_0_2px_rgba(139,92,246,0.15)]` : 'border-slate-200';

  // Preview text from node data
  let preview = '';
  if (data.messageText) preview = data.messageText.substring(0, 60) + (data.messageText.length > 60 ? '...' : '');
  if (data.questionText) preview = data.questionText.substring(0, 60) + (data.questionText.length > 60 ? '...' : '');
  if (data.templateName) preview = `Template: ${data.templateName}`;
  if (data.salesforceAction) preview = `${data.salesforceAction.actionType}`;
  if (data.delayMinutes || data.delayHours || data.delayDays) {
    const parts = [];
    if (data.delayDays) parts.push(`${data.delayDays}d`);
    if (data.delayHours) parts.push(`${data.delayHours}h`);
    if (data.delayMinutes) parts.push(`${data.delayMinutes}m`);
    preview = `Wait ${parts.join(' ')}`;
  }

  return (
    <div className={`w-[280px] bg-white rounded-2xl border ${selectedBorder} shadow-sm transition-all hover:shadow-md`}>
      {/* Input Handle */}
      {data.type !== 'TRIGGER_KEYWORD' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-3 pb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors.iconBg}`}>
          <IconComponent size={18} className={colors.iconText} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            {nodeDef?.category || 'Node'}
          </span>
          <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{title}</p>
        </div>
      </div>

      {/* Preview Content */}
      {preview && (
        <div className="px-3 pb-2.5">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
            {preview}
          </p>
        </div>
      )}

      {/* Button Preview for Question Nodes */}
      {data.buttons && data.buttons.length > 0 && (
        <div className="px-3 pb-4 flex flex-wrap gap-1.5 justify-center">
          {data.buttons.map((btn: any, i: number) => (
            <div key={i} className="relative">
              <span className="px-2.5 py-1 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-md border border-violet-200/60 inline-block">
                {btn.label}
              </span>
              <Handle
                id={btn.id}
                type="source"
                position={Position.Bottom}
                className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-white !absolute !-bottom-1 !left-1/2 !-translate-x-1/2"
              />
            </div>
          ))}
        </div>
      )}

      {/* Output Handle */}
      {data.type !== 'END' && !(data.buttons && data.buttons.length > 0) && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white"
        />
      )}
    </div>
  );
}
