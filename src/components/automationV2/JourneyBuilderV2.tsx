'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection,
  Edge,
  Node,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArrowLeft, Save, Play, Settings } from 'lucide-react';
import NodeLibrary from './NodeLibrary';
import ConfigPanel from './ConfigPanel';
import ValidationPanel from './ValidationPanel';
import { validateJourney, ValidationIssue } from '@/lib/automationV2/validator';
import { queueAutoSave } from '@/lib/automationV2/autoSave';
import { AutomationV2 } from '@/lib/automationV2/schema';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import CustomNode from './CustomNode';

const nodeTypes = {
  customNode: CustomNode,
};

interface JourneyBuilderV2Props {
  journeyId: string | null;
  onClose: () => void;
}

function JourneyBuilderFlow({ journeyId, onClose }: JourneyBuilderV2Props) {
  const { activeWorkspace } = useWorkspace();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [journeyName, setJourneyName] = useState('Untitled Enterprise Journey (V2)');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save logic trigger
  useEffect(() => {
    if (!activeWorkspace) return;
    const payload: AutomationV2 = {
      id: journeyId || 'new-journey',
      name: journeyName,
      tenantId: 't-xyz_company', // Should derive from session
      workspaceId: activeWorkspace.id,
      workspaceType: activeWorkspace.type as any,
      status: 'draft',
      version: 1,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentRules: { mode: 'ALLOW_ONCE' },
      nodes: nodes as any,
      edges: edges as any
    };
    
    // Auto save queue
    setIsSaving(true);
    queueAutoSave(payload, () => setIsSaving(false));
  }, [nodes, edges, journeyName, journeyId, activeWorkspace]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const defaultDataStr = event.dataTransfer.getData('application/reactflow-data');
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const defaultData = defaultDataStr ? JSON.parse(defaultDataStr) : {};

      const newNode = {
        id: `node_${uuidv4()}`,
        type: 'customNode',
        position,
        data: { label: type, type, ...defaultData },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...newData };
          setSelectedNode(node);
        }
        return node;
      })
    );
  };

  const handlePublish = () => {
    if (!activeWorkspace) return;
    const payload: AutomationV2 = {
      id: journeyId || 'new-journey',
      name: journeyName,
      tenantId: 't-xyz_company',
      workspaceId: activeWorkspace.id,
      workspaceType: activeWorkspace.type as any,
      status: 'draft',
      version: 1,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrollmentRules: { mode: 'ALLOW_ONCE' },
      nodes: nodes as any,
      edges: edges as any
    };

    const issues = validateJourney(payload);
    if (issues.length > 0) {
      setValidationIssues(issues);
      setShowValidation(true);
    } else {
      setShowValidation(false);
      alert('Journey Published Successfully! (Sprint 2 Validation Passed)');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col font-sans overflow-hidden">
      
      {/* ─── Header ─── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <input 
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                className="text-[17px] font-extrabold text-slate-900 bg-transparent border-none outline-none hover:bg-slate-50 px-2 py-1 rounded-md"
              />
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                V2 Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium px-2">
              {isSaving ? 'Saving...' : 'All changes saved to cloud'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#00C853] text-white font-bold text-xs rounded-xl hover:bg-[#00E676] transition-colors shadow-sm" onClick={handlePublish}>
            <Play size={15} /> Publish Journey
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Node Sidebar */}
        <NodeLibrary />

        {/* Canvas Area */}
        <main className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={() => console.log('Flow initialized')}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Control', 'Meta']}
            selectionKeyCode={['Shift']}
          >
            <Background color="#E2E8F0" gap={16} />
            <Controls className="bg-white shadow-lg border border-slate-200 rounded-lg p-1" />
            <MiniMap 
              nodeColor="#00C853" 
              maskColor="rgba(248, 250, 252, 0.7)" 
              className="border border-slate-200 rounded-xl shadow-lg bg-white overflow-hidden" 
            />
          </ReactFlow>

          {showValidation && (
            <ValidationPanel 
              issues={validationIssues} 
              onClose={() => setShowValidation(false)} 
              onNodeSelect={(id) => {
                const node = nodes.find(n => n.id === id);
                if (node) setSelectedNode(node);
              }}
            />
          )}
        </main>
        
        {/* Right Panel */}
        {selectedNode && (
          <ConfigPanel 
            selectedNode={selectedNode} 
            onUpdateNode={updateNodeData} 
            onClose={() => setSelectedNode(null)} 
          />
        )}

      </div>
    </div>
  );
}

// Wrap with provider
export default function JourneyBuilderV2(props: JourneyBuilderV2Props) {
  return (
    <ReactFlowProvider>
      <JourneyBuilderFlow {...props} />
    </ReactFlowProvider>
  );
}
