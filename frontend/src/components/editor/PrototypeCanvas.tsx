import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, Controls,
  useNodesState,
  Node, NodeChange, applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store';
import type { Entity, ProtoComponent, PrototypeLayout } from '../../types';
import { genId } from '../../utils/helpers';
import { api } from '../../utils/api';

import { FieldComponentNode } from './proto/FieldComponentNode';
import { LabelNode } from './proto/LabelNode';
import { SeparatorNode } from './proto/SeparatorNode';
import { ImageNode } from './proto/ImageNode';
import { ButtonNode } from './proto/ButtonNode';
import { PrototypeToolbox } from './PrototypeToolbox';
import { PropertiesPanel } from './PropertiesPanel';

const nodeTypes = {
  protoField: FieldComponentNode,
  protoLabel: LabelNode,
  protoSeparator: SeparatorNode,
  protoImage: ImageNode,
  protoButton: ButtonNode,
};

const ENTITY_TYPE_COLOR: Record<Entity['type'], string> = {
  master: '#16a34a', detail: '#2563eb', external: '#d97706', virtual: '#7c3aed',
};

const PROTO_TYPE_TO_NODE: Record<string, string> = {
  field: 'protoField', label: 'protoLabel',
  separator: 'protoSeparator', image: 'protoImage', button: 'protoButton',
};

function buildDefaultLayout(entity: Entity): PrototypeLayout {
  const components: ProtoComponent[] = entity.fields.map((field, i) => ({
    id: genId('comp'),
    type: 'field' as const,
    fieldName: field.name,
    label: field.description || field.name,
    placeholder: field.name,
    x: 40,
    y: 40 + i * 56,
    width: 360,
    height: 40,
    required: !field.allowNulls,
    visible: true,
    readonly: false,
  }));
  return {
    entityId: entity.id,
    canvasWidth: 1200,
    canvasHeight: 800,
    snapToGrid: true,
    gridSize: 8,
    components,
  };
}

function layoutToNodes(layout: PrototypeLayout, entity: Entity): Node[] {
  const fieldTypeMap = Object.fromEntries(entity.fields.map((f) => [f.name, f.type]));
  return layout.components.map((comp) => ({
    id: comp.id,
    type: PROTO_TYPE_TO_NODE[comp.type] ?? 'protoField',
    position: { x: comp.x, y: comp.y },
    width: comp.width,
    height: comp.height,
    data: { ...comp, fieldType: comp.fieldName ? fieldTypeMap[comp.fieldName] : undefined },
    style: { width: comp.width, height: comp.height },
  }));
}

interface Props {
  entityId: string;
}

export function PrototypeCanvas({ entityId }: Props) {
  const { plan, project, activeModule, getProtoLayout, updateProtoLayout, upsertProtoComponent, deleteProtoComponent, isDirty, markClean } = useStore();
  const entity = plan?.entities.find((e) => e.id === entityId);

  const [nodes, setNodes] = useNodesState<Node>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Get or auto-create layout
  const layout = useMemo(() => {
    if (!entity) return undefined;
    return getProtoLayout(entityId) ?? buildDefaultLayout(entity);
  }, [entity, entityId, getProtoLayout]);

  // Initialize layout in store if needed
  useEffect(() => {
    if (!entity || !layout) return;
    if (!getProtoLayout(entityId)) {
      updateProtoLayout(layout);
    }
  }, [entity, entityId, layout, getProtoLayout, updateProtoLayout]);

  // Sync nodes from layout
  useEffect(() => {
    if (!layout || !entity) return;
    setNodes(layoutToNodes(layout, entity));
  }, [layout, entity, setNodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const onNodeDragStop = useCallback((_e: React.MouseEvent, _node: Node, allNodes: Node[]) => {
    if (!layout) return;
    const updatedComponents = layout.components.map((comp) => {
      const node = allNodes.find((n) => n.id === comp.id);
      if (!node) return comp;
      return {
        ...comp,
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? node.width ?? comp.width,
        height: node.measured?.height ?? node.height ?? comp.height,
      };
    });
    updateProtoLayout({ ...layout, components: updatedComponents });
  }, [layout, updateProtoLayout]);

  const onSelectionChange = useCallback(({ nodes: selected }: { nodes: Node[] }) => {
    setSelectedId(selected.length === 1 ? selected[0].id : null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('proto/type') as ProtoComponent['type'];
    const fieldName = e.dataTransfer.getData('proto/fieldName') || undefined;
    const text = e.dataTransfer.getData('proto/text') || undefined;
    if (!type || !entity) return;

    // Get canvas bounding rect for coordinate conversion
    const canvasEl = (e.currentTarget as HTMLElement).querySelector('.react-flow__viewport')?.parentElement;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();

    // Account for viewport transform (pan/zoom) using data attribute
    const viewportEl = (e.currentTarget as HTMLElement).querySelector('.react-flow__viewport') as HTMLElement | null;
    let tx = 0, ty = 0, scale = 1;
    if (viewportEl) {
      const transform = viewportEl.style.transform;
      const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
      if (match) { tx = parseFloat(match[1]); ty = parseFloat(match[2]); scale = parseFloat(match[3]); }
    }

    const x = (e.clientX - rect.left - tx) / scale;
    const y = (e.clientY - rect.top - ty) / scale;

    const defaultSizes: Record<string, [number, number]> = {
      field: [360, 40], label: [200, 32], separator: [400, 24], image: [120, 80], button: [120, 36],
    };
    const [w, h] = defaultSizes[type] ?? [200, 40];

    const fieldType = fieldName ? entity.fields.find((f) => f.name === fieldName)?.type : undefined;
    const newComp: ProtoComponent = {
      id: genId('comp'),
      type,
      fieldName,
      label: fieldName ? (entity.fields.find((f) => f.name === fieldName)?.description || fieldName) : undefined,
      text,
      x: x - w / 2,
      y: y - h / 2,
      width: w,
      height: type === 'field' && fieldType === 'M' ? 80 : h,
      required: false,
      visible: true,
      readonly: false,
    };
    upsertProtoComponent(entityId, newComp);
  }, [entity, entityId, upsertProtoComponent]);

  const selectedComponent = useMemo(() => {
    if (!selectedId || !layout) return null;
    return layout.components.find((c) => c.id === selectedId) ?? null;
  }, [selectedId, layout]);

  const handleUpdateComponent = useCallback((patch: Partial<ProtoComponent>) => {
    if (!selectedId) return;
    const comp = layout?.components.find((c) => c.id === selectedId);
    if (!comp) return;
    const updated = { ...comp, ...patch };
    upsertProtoComponent(entityId, updated);
    // Sync node size/position if changed
    if (patch.width !== undefined || patch.height !== undefined || patch.x !== undefined || patch.y !== undefined) {
      setNodes((nds) => nds.map((n) => n.id === selectedId
        ? { ...n, position: { x: updated.x, y: updated.y }, style: { width: updated.width, height: updated.height } }
        : n
      ));
    }
  }, [selectedId, layout, entityId, upsertProtoComponent, setNodes]);

  const handleDeleteComponent = useCallback(() => {
    if (!selectedId) return;
    deleteProtoComponent(entityId, selectedId);
    setSelectedId(null);
  }, [selectedId, entityId, deleteProtoComponent]);

  const handleSave = async () => {
    if (!plan || !project || !activeModule) return;
    try {
      await api.savePlan(project.project_path, activeModule.name, plan);
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      // save failed silently; isDirty stays true
    }
  };

  if (!entity) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>Entità non trovata</div>;
  }

  const typeColor = ENTITY_TYPE_COLOR[entity.type];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8f9fa' }}>
      {/* Header toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', height: 44, background: '#fff',
        borderBottom: '1px solid #e3e6df', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: typeColor,
          background: `${typeColor}18`, padding: '2px 8px', borderRadius: 10,
          border: `1px solid ${typeColor}30`, textTransform: 'capitalize',
        }}>
          {entity.type}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          {entity.name || entity.program}
        </span>
        {entity.program && entity.name && entity.program !== entity.name && (
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{entity.program}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {(layout?.components.length ?? 0)} componenti
        </span>
        {isDirty && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Modifiche non salvate" />}
        <button
          onClick={handleSave}
          style={{
            padding: '5px 16px',
            background: saved ? '#f0fdf4' : '#111827',
            border: saved ? '1px solid #bbf7d0' : 'none',
            color: saved ? '#16a34a' : '#fff',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Salvato' : 'Salva layout'}
        </button>
      </div>

      {/* Main area: toolbox + canvas + properties */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PrototypeToolbox entity={entity} layout={layout} />

        {/* React Flow Canvas */}
        <div
          style={{ flex: 1, position: 'relative', background: '#fff' }}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={[]}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            onSelectionChange={onSelectionChange}
            snapToGrid
            snapGrid={[8, 8]}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            deleteKeyCode={['Delete', 'Backspace']}
            onNodesDelete={(deleted) => deleted.forEach((n) => deleteProtoComponent(entityId, n.id))}
            style={{ background: '#fff' }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <PropertiesPanel
          component={selectedComponent}
          onUpdate={handleUpdateComponent}
          onDelete={handleDeleteComponent}
        />
      </div>
    </div>
  );
}
