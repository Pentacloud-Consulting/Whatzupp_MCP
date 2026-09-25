'use client';

// src/components/conversationFlows/FlowBuilder.tsx
// Enterprise drag-and-drop Flow Builder for Conversation Flows.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow, MiniMap, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge, Connection, Node, Edge,
  useReactFlow, ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import dagre from 'dagre';
import { ConversationFlow, FlowNode, FlowNodeData } from '@/lib/conversationFlows/flowSchema';
import { FLOW_NODE_REGISTRY, FlowNodeDefinition } from '@/lib/conversationFlows/flowNodeRegistry';
import FlowBuilderNode from './FlowBuilderNode';
import {
  ArrowLeft, Save, Play, Search, Zap, MessageSquare, ToggleLeft, GitBranch,
  Cloud, Clock, CircleStop, Image, LayoutTemplate, Reply, List,
  Sparkles, ChevronDown, X, Plus, Trash2, Settings2, Wand2
} from 'lucide-react';

const nodeTypes = {
  flowNode: FlowBuilderNode,
};

interface FlowBuilderProps {
  flow: ConversationFlow | null;
  onBack: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Zap, MessageSquare, LayoutTemplate, Image, ToggleLeft, Reply, List,
  GitBranch, Cloud, Clock, CircleStop,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, ranksep: 150, nodesep: 100 });

  nodes.forEach((node) => {
    // FlowBuilderNode is w-[280px]. We give it an approximate height for layout purposes.
    dagreGraph.setNode(node.id, { width: 280, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 140, // offset half width
        y: nodeWithPosition.y - 60,  // offset half height
      },
    };
  });

  return { nodes: newNodes, edges };
};

// FlowCanvas removed. The ReactFlow component will be rendered directly inside FlowBuilderInner.

function FlowBuilderInner({ flow, onBack }: FlowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  // Removed the useEffect that calls fitView on mount because <ReactFlow fitView> already does it,
  // and we'll add onNodesInitialized for more robust centering.
  
  const [flowName, setFlowName] = useState(flow?.name || 'Untitled Flow');
  const [keywords, setKeywords] = useState(flow?.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywordMatchType, setKeywordMatchType] = useState<'exact' | 'contains'>('contains');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKeywordPanel, setShowKeywordPanel] = useState(false);

  // Convert flow nodes/edges to React Flow format
  const initialNodes: Node[] = (flow?.nodes || []).map(n => ({
    id: n.id,
    type: 'flowNode',
    position: n.position,
    data: { ...n.data, label: n.label, type: n.type },
  }));

  const initialEdges: Edge[] = (flow?.edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    label: e.label,
    animated: true,
    style: { stroke: '#8B5CF6', strokeWidth: 2 },
    labelStyle: { fill: '#6D28D9', fontWeight: 700, fontSize: 10 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection,
      id: `e-${uuidv4()}`,
      animated: true,
      style: { stroke: '#8B5CF6', strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const handleAutoArrange = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    
    // Animate view to center after layout completes. 
    // Passing the explicitly calculated nodes forces fitView to bypass stale DOM bounds.
    setTimeout(() => {
      window.requestAnimationFrame(() => {
        fitView({ nodes: layoutedNodes, padding: 0.2, duration: 800, maxZoom: 1 });
      });
    }, 50); // We can reduce delay now that bounds are explicit
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const onNodesInitialized = useCallback(() => {
    fitView({ padding: 0.2, duration: 800, maxZoom: 1 });
  }, [fitView]);

  // Drag & Drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow-type');
    const label = event.dataTransfer.getData('application/reactflow-label');
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!type || !reactFlowBounds) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `node_${uuidv4()}`,
      type: 'flowNode',
      position,
      data: { label, type },
    };

    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const onDragStart = (event: React.DragEvent, nodeDef: FlowNodeDefinition) => {
    event.dataTransfer.setData('application/reactflow-type', nodeDef.type);
    event.dataTransfer.setData('application/reactflow-label', nodeDef.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Node selection for right panel
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Update selected node data
  const updateNodeData = (key: string, value: any) => {
    setNodes(nds => nds.map(n =>
      n.id === selectedNodeId ? { ...n, data: { ...n.data, [key]: value } } : n
    ));
  };

  // Add keyword
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setKeywords(prev => [...prev, { keyword: newKeyword.trim(), matchType: keywordMatchType }]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (idx: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== idx));
  };

  // Save flow
  const handleSave = async () => {
    setSaving(true);
    try {
      const flowData = {
        ...flow,
        name: flowName,
        keywords,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.data.type,
          label: n.data.label,
          data: n.data,
          position: n.position,
          nextNodeId: undefined,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          label: typeof e.label === 'string' ? e.label : undefined,
        })),
        updatedAt: new Date().toISOString(),
      };

      if (flow?.id) {
        await fetch(`/api/conversation-flows/${flow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flowData),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter sidebar nodes
  const groupedNodes = useMemo(() => {
    const filtered = FLOW_NODE_REGISTRY.filter(n =>
      n.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      n.description.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
    const groups: Record<string, FlowNodeDefinition[]> = {};
    for (const n of filtered) {
      if (!groups[n.category]) groups[n.category] = [];
      groups[n.category].push(n);
    }
    return groups;
  }, [sidebarSearch]);

  const categoryColors: Record<string, string> = {
    Triggers: 'text-purple-500',
    Messages: 'text-blue-500',
    Questions: 'text-teal-500',
    Logic: 'text-amber-500',
    Actions: 'text-rose-500',
    'Flow Control': 'text-slate-500',
  };

  return (
    <div className="flex flex-col w-full h-full flex-1 bg-[#F8FAFC]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/80 shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              className="text-lg font-black text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 w-auto"
              style={{ width: `${Math.max(flowName.length * 10, 160)}px` }}
            />
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
              Flow Builder
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoArrange}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
            title="Auto Arrange Workflow"
          >
            <Wand2 size={14} />
            <span className="hidden sm:inline">Auto Arrange</span>
          </button>
          <button
            onClick={() => setShowKeywordPanel(!showKeywordPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showKeywordPanel
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Zap size={14} />
            Keywords ({keywords.length})
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-200 transition-all hover:shadow-lg disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </div>

      {/* Keywords Panel (Collapsible) */}
      {showKeywordPanel && (
        <div className="px-4 py-3 bg-violet-50/50 border-b border-violet-200/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Enter keyword..."
                className="px-3 py-2 bg-white border border-violet-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-400 w-48"
              />
              <select
                value={keywordMatchType}
                onChange={e => setKeywordMatchType(e.target.value as any)}
                className="px-2 py-2 bg-white border border-violet-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains</option>
              </select>
              <button
                onClick={handleAddKeyword}
                className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white text-violet-700 text-xs font-bold rounded-lg border border-violet-200">
                  <Zap size={10} />
                  {kw.keyword}
                  <span className="text-[9px] text-violet-400">({kw.matchType})</span>
                  <button onClick={() => handleRemoveKeyword(i)} className="ml-0.5 text-violet-400 hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Node Library */}
        <div className="w-[220px] bg-white border-r border-slate-200/80 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-none">
            {Object.entries(groupedNodes).map(([category, nodes]) => (
              <div key={category} className="mb-3">
                <h4 className={`text-[10px] font-extrabold uppercase tracking-widest px-2 mb-1.5 ${categoryColors[category] || 'text-slate-400'}`}>
                  {category}
                </h4>
                {nodes.map(nodeDef => {
                  const Icon = iconMap[nodeDef.icon] || Sparkles;
                  return (
                    <div
                      key={nodeDef.type}
                      draggable
                      onDragStart={e => onDragStart(e, nodeDef)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing hover:bg-violet-50/60 transition-all mb-0.5 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-violet-100 flex items-center justify-center shrink-0 transition-colors">
                        <Icon size={14} className="text-slate-500 group-hover:text-violet-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{nodeDef.label}</p>
                        <p className="text-[9px] text-slate-400 leading-tight">{nodeDef.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Center: React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative min-w-0" onDragOver={onDragOver} onDrop={onDrop}>
          <div className="absolute inset-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onNodesInitialized}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
              minZoom={0.3}
              maxZoom={2}
              snapToGrid
              snapGrid={[15, 15]}
              deleteKeyCode={['Backspace', 'Delete']}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
              <Controls showInteractive={false} className="!bg-white !rounded-xl !border !border-slate-200 !shadow-lg" />
              <MiniMap nodeStrokeColor="#8B5CF6" nodeColor="#EDE9FE" maskColor="rgba(248, 250, 252, 0.8)" className="!bg-white !rounded-xl !border !border-slate-200 !shadow-lg" />
            </ReactFlow>
          </div>
        </div>

        {/* Right Sidebar: Node Configuration */}
        {selectedNode && (
          <div className="w-[300px] bg-white border-l border-slate-200/80 flex flex-col shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-violet-600" />
                <span className="text-sm font-bold text-slate-800">Configure Node</span>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            <div className="p-3 space-y-4">
              {(() => {
                const d: any = selectedNode.data;
                return (
                  <>
                    {/* Node Label */}
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Node Label</label>
                      <input
                        type="text"
                        value={d.label || ''}
                        onChange={e => updateNodeData('label', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                      />
                    </div>

                    {/* Message Text (for MESSAGE_TEXT, QUESTION_BUTTONS) */}
                    {(d.type === 'MESSAGE_TEXT' || d.type === 'QUESTION_BUTTONS' || d.type === 'QUESTION_QUICK_REPLY') && (
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">
                          {d.type === 'MESSAGE_TEXT' ? 'Message Text' : 'Question Text'}
                        </label>
                        <textarea
                          value={d.type === 'MESSAGE_TEXT' ? (d.messageText || '') : (d.questionText || '')}
                          onChange={e => updateNodeData(
                            d.type === 'MESSAGE_TEXT' ? 'messageText' : 'questionText',
                            e.target.value
                          )}
                          rows={4}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none"
                        />
                      </div>
                    )}

                    {/* Buttons Config (for QUESTION_BUTTONS, QUESTION_QUICK_REPLY) */}
                    {(d.type === 'QUESTION_BUTTONS' || d.type === 'QUESTION_QUICK_REPLY') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            Buttons
                          </label>
                          <button
                            onClick={() => {
                              const currentButtons = d.buttons || [];
                              if (currentButtons.length >= 3) return; // WhatsApp limit for quick replies
                              const newBtnId = `btn-${Math.random().toString(36).substr(2, 6)}`;
                              updateNodeData('buttons', [...currentButtons, { id: newBtnId, label: 'New Button' }]);
                            }}
                            className="text-[10px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-50"
                            disabled={(d.buttons || []).length >= 3}
                          >
                            + Add Button
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {(d.buttons || []).map((btn: any, idx: number) => (
                            <div key={btn.id || idx} className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Button {idx + 1}</span>
                                <button
                                  onClick={() => {
                                    const newBtns = d.buttons.filter((_: any, i: number) => i !== idx);
                                    updateNodeData('buttons', newBtns);
                                  }}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={btn.label}
                                onChange={e => {
                                  const newBtns = [...d.buttons];
                                  newBtns[idx].label = e.target.value;
                                  updateNodeData('buttons', newBtns);
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                                placeholder="Label (e.g. Yes)"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-500">ID:</span>
                                <input
                                  type="text"
                                  value={btn.id}
                                  onChange={e => {
                                    const newBtns = [...d.buttons];
                                    newBtns[idx].id = e.target.value;
                                    updateNodeData('buttons', newBtns);
                                  }}
                                  className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                                  placeholder="ID (e.g. btn-yes)"
                                />
                              </div>
                            </div>
                          ))}
                          {(!d.buttons || d.buttons.length === 0) && (
                            <p className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              No buttons added
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Template Config */}
                    {d.type === 'MESSAGE_TEMPLATE' && (
                      <>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Template Name</label>
                          <input
                            type="text"
                            value={d.templateName || ''}
                            onChange={e => updateNodeData('templateName', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                            placeholder="e.g. welcome_greeting"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Language</label>
                          <select
                            value={d.templateLanguage || 'en'}
                            onChange={e => updateNodeData('templateLanguage', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                          >
                            <option value="en">English</option>
                            <option value="ar">Arabic</option>
                            <option value="hi">Hindi</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Delay Config */}
                    {d.type === 'DELAY' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">Days</label>
                          <input
                            type="number"
                            min={0}
                            value={d.delayDays || 0}
                            onChange={e => updateNodeData('delayDays', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">Hours</label>
                          <input
                            type="number"
                            min={0}
                            value={d.delayHours || 0}
                            onChange={e => updateNodeData('delayHours', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 mb-1 block">Mins</label>
                          <input
                            type="number"
                            min={0}
                            value={d.delayMinutes || 0}
                            onChange={e => updateNodeData('delayMinutes', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-center"
                          />
                        </div>
                      </div>
                    )}

                    {/* Salesforce Action Config */}
                    {d.type === 'ACTION_SALESFORCE' && (
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Action Type</label>
                        <select
                          value={d.salesforceAction?.actionType || 'CREATE_LEAD'}
                          onChange={e => updateNodeData('salesforceAction', {
                            ...(d.salesforceAction || {}),
                            actionType: e.target.value,
                            fieldMappings: d.salesforceAction?.fieldMappings || {},
                          })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                        >
                          <option value="CREATE_LEAD">Create Lead</option>
                          <option value="UPDATE_LEAD">Update Lead</option>
                          <option value="UPDATE_CONTACT">Update Contact</option>
                          <option value="CREATE_TASK">Create Task</option>
                          <option value="UPDATE_OPPORTUNITY">Update Opportunity</option>
                        </select>
                      </div>
                    )}

                    {/* Delete Node */}
                    <button
                      onClick={() => {
                        setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
                        setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
                        setSelectedNodeId(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100 transition-all mt-4"
                    >
                      <Trash2 size={14} />
                      Delete Node
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
