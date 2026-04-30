import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Node, Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../store';
import { EntityNode } from './EntityNode';
import { CanvasContextMenu } from './CanvasContextMenu';
import { EntityDialog } from './EntityDialog';
import { RelationDialog } from './RelationDialog';
import { entitiesToNodes, relationsToEdges, notesToNodes, genId } from '../utils/helpers';
import type { Entity, RelationType, StickyNote } from '../types';
import { api } from '../utils/api';
import { StickyNode } from './StickyNode';
import { StickyNoteDialog } from './StickyNoteDialog';

const nodeTypes = { entityNode: EntityNode, stickyNode: StickyNode };

export function Canvas() {
  const {
    plan, project, activeModule, upsertEntity, deleteEntity,
    updateEntityPosition, deleteRelation, addRelation,
    contextMenu, setContextMenu, selectedEntityId, setSelectedEntityId,
    pendingRelation, setPendingRelation, isDirty, markClean,
    upsertNote, deleteNote, updateNotePosition,
  } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [newEntityType, setNewEntityType] = useState<Entity['type']>('master');

  const [relationDialog, setRelationDialog] = useState<{
    sourceId: string; targetId: string; type: RelationType;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [noteDialog, setNoteDialog] = useState<{ note: StickyNote | null; position?: { x: number; y: number } } | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<{ noteId: string; x: number; y: number } | null>(null);

  // Sync plan → React Flow nodes/edges
  useEffect(() => {
    if (!plan) return;
    setNodes([...entitiesToNodes(plan.entities), ...notesToNodes(plan.notes ?? [])]);
    setEdges(relationsToEdges(plan.relations));
  }, [plan]);

  // Listen for completeRelation event from EntityNode
  useEffect(() => {
    const handler = (e: Event) => {
      const { targetId } = (e as CustomEvent).detail;
      if (!pendingRelation) return;
      setRelationDialog({ sourceId: pendingRelation.sourceId, targetId, type: pendingRelation.type });
      setPendingRelation(null);
    };
    window.addEventListener('completeRelation', handler);
    return () => window.removeEventListener('completeRelation', handler);
  }, [pendingRelation, setPendingRelation]);

  // Listen for double-click edit from EntityNode
  useEffect(() => {
    const handler = (e: Event) => {
      const { entityId } = (e as CustomEvent).detail;
      setEditingEntityId(entityId);
      setEntityDialogOpen(true);
    };
    window.addEventListener('editEntity', handler);
    return () => window.removeEventListener('editEntity', handler);
  }, []);

  // Listen for note edit / context menu events
  useEffect(() => {
    const editHandler = (e: Event) => {
      const { noteId } = (e as CustomEvent).detail;
      const note = plan?.notes?.find((n) => n.id === noteId) ?? null;
      setNoteDialog({ note });
    };
    const ctxHandler = (e: Event) => {
      const { noteId, x, y } = (e as CustomEvent).detail;
      setNoteContextMenu({ noteId, x, y });
    };
    window.addEventListener('editNote', editHandler);
    window.addEventListener('noteContextMenu', ctxHandler);
    return () => {
      window.removeEventListener('editNote', editHandler);
      window.removeEventListener('noteContextMenu', ctxHandler);
    };
  }, [plan]);

  const onNodeDragStop = useCallback((_e: React.MouseEvent, node: Node) => {
    if (node.type === 'stickyNode') {
      updateNotePosition(node.id, node.position.x, node.position.y);
    } else {
      updateEntityPosition(node.id, node.position.x, node.position.y);
    }
  }, [updateEntityPosition, updateNotePosition]);

  const handleSave = async () => {
    if (!plan || !project || !activeModule) return;
    setSaving(true);
    try {
      await api.savePlan(project.project_path, activeModule.name, plan);
      markClean();
    } catch (e: any) {
      alert('Save error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntity = (type: Entity['type']) => {
    setNewEntityType(type);
    setEditingEntityId(null);
    setEntityDialogOpen(true);
  };

  const handleEditEntity = () => {
    if (!contextMenu) return;
    setEditingEntityId(contextMenu.entityId);
    setEntityDialogOpen(true);
  };

  const handleDeleteEntity = () => {
    if (!contextMenu) return;
    if (window.confirm(`Delete entity "${contextMenu.entityName}"?`)) {
      deleteEntity(contextMenu.entityId);
    }
  };

  const handleStartRelation = (type: RelationType) => {
    if (!contextMenu) return;
    setPendingRelation({ sourceId: contextMenu.entityId, type });
  };

  const handleCanvasClick = () => {
    setContextMenu(null);
    if (pendingRelation) setPendingRelation(null);
  };

  const relationSource = relationDialog ? plan?.entities.find((e) => e.id === relationDialog.sourceId) : null;
  const relationTarget = relationDialog ? plan?.entities.find((e) => e.id === relationDialog.targetId) : null;

  if (!plan) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94a3b8', fontSize: 14, flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 32 }}>📋</div>
        <div>Select a module from the sidebar to start</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginRight: 4 }}>
          📁 {activeModule?.name}
        </span>
        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

        {/* Add entity buttons */}
        {(['master', 'detail', 'external', 'virtual'] as Entity['type'][]).map((type) => {
          const colors: Record<string, string> = {
            master: '#16a34a', detail: '#2563eb', external: '#ca8a04', virtual: '#9333ea',
          };
          return (
            <button
              key={type}
              onClick={() => handleAddEntity(type)}
              style={{
                padding: '4px 12px', border: `1px solid ${colors[type]}`,
                color: colors[type], background: '#fff', borderRadius: 4,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
              title={`Add ${type} entity`}
            >
              + {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          );
        })}

        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
        <button
          onClick={() => setNoteDialog({ note: null, position: { x: 80, y: 80 } })}
          style={{
            padding: '4px 12px', border: '1px solid #ca8a04',
            color: '#ca8a04', background: '#fff', borderRadius: 4,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
          title="Add sticky note"
        >
          📝 Note
        </button>

        <div style={{ flex: 1 }} />

        {/* Pending relation indicator */}
        {pendingRelation && (
          <div style={{
            background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 4,
            padding: '4px 10px', fontSize: 12, color: '#92400e',
          }}>
            🔗 Click a target entity for <strong>{pendingRelation.type}</strong> relation
            <button
              onClick={() => setPendingRelation(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, color: '#92400e' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dirty indicator + save */}
        {isDirty && (
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>● Unsaved</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            padding: '5px 16px', background: isDirty ? '#2563eb' : '#94a3b8',
            color: '#fff', border: 'none', borderRadius: 4,
            cursor: isDirty ? 'pointer' : 'default', fontSize: 13, fontWeight: 600,
          }}
        >
          {saving ? 'Saving…' : '💾 Save'}
        </button>
      </div>

      {/* React Flow canvas */}
      <div style={{ flex: 1 }} onClick={handleCanvasClick}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
          onEdgesDelete={(deleted: Edge[]) => deleted.forEach((e) => deleteRelation(e.id))}
          style={{ cursor: pendingRelation ? 'crosshair' : undefined }}
        >
          <Background gap={20} color="#e2e8f0" />
          <Controls />
          <MiniMap
            nodeColor={(n: any) => {
              const type = n.data?.entity?.type;
              return type === 'master' ? '#16a34a' : type === 'detail' ? '#2563eb' : '#94a3b8';
            }}
          />
        </ReactFlow>
      </div>

      {/* Context menu */}
      <CanvasContextMenu
        onEdit={handleEditEntity}
        onDelete={handleDeleteEntity}
        onStartRelation={handleStartRelation}
      />

      {/* Entity dialog */}
      {entityDialogOpen && (
        <EntityDialog
          entityId={editingEntityId}
          defaultType={newEntityType}
          onClose={() => setEntityDialogOpen(false)}
        />
      )}

      {/* Relation dialog */}
      {relationDialog && relationSource && relationTarget && (
        <RelationDialog
          sourceEntity={relationSource}
          targetEntity={relationTarget}
          relationType={relationDialog.type}
          onClose={() => setRelationDialog(null)}
        />
      )}

      {/* Sticky note dialog */}
      {noteDialog && (
        <StickyNoteDialog
          note={noteDialog.note}
          position={noteDialog.position}
          onSave={(note) => { upsertNote(note); setNoteDialog(null); }}
          onClose={() => setNoteDialog(null)}
        />
      )}

      {/* Note context menu */}
      {noteContextMenu && (
        <NoteContextMenu
          x={noteContextMenu.x}
          y={noteContextMenu.y}
          onEdit={() => {
            const note = plan?.notes?.find((n) => n.id === noteContextMenu.noteId) ?? null;
            setNoteDialog({ note });
            setNoteContextMenu(null);
          }}
          onDelete={() => {
            if (window.confirm('Delete this note?')) deleteNote(noteContextMenu.noteId);
            setNoteContextMenu(null);
          }}
          onClose={() => setNoteContextMenu(null)}
        />
      )}
    </div>
  );
}

// ── Note context menu ─────────────────────────────────────────────────────────

function NoteContextMenu({ x, y, onEdit, onDelete, onClose }: {
  x: number; y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', left: x, top: y,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 2000,
        minWidth: 160, overflow: 'hidden', fontSize: 13,
      }}
      onMouseLeave={onClose}
    >
      <button onClick={onEdit} style={ctxBtn}>✏️ Edit note</button>
      <div style={{ height: 1, background: '#f1f5f9' }} />
      <button onClick={onDelete} style={{ ...ctxBtn, color: '#ef4444' }}>🗑️ Delete note</button>
    </div>
  );
}

const ctxBtn: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 14px',
  background: 'none', border: 'none', textAlign: 'left',
  cursor: 'pointer', color: '#1e293b', fontFamily: 'inherit', fontSize: 13,
};
