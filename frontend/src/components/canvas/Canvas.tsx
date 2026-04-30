import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Node, Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store';
import { api } from '../../utils/api';
import { entitiesToNodes, relationsToEdges, notesToNodes } from '../../utils/helpers';
import type { Entity, RelationType, StickyNote } from '../../types';

import { EntityNode } from './nodes/EntityNode';
import { StickyNode } from './nodes/StickyNode';
import { CanvasToolbar } from './CanvasToolbar';
import { NoteContextMenu } from './NoteContextMenu';
import { CanvasContextMenu } from '../shared/CanvasContextMenu';
import { EntityDialog } from '../dialogs/entity/EntityDialog';
import { RelationDialog } from '../dialogs/RelationDialog';
import { StickyNoteDialog } from '../dialogs/StickyNoteDialog';

const nodeTypes = { entityNode: EntityNode, stickyNode: StickyNode };

interface CopiedEntity {
  entities: Entity[];
  isCut: boolean;
}

interface CanvasContextMenuState {
  x: number;
  y: number;
}

export function Canvas() {
  const {
    plan, project, activeModule,
    deleteEntity, updateEntityPosition, deleteRelation,
    contextMenu, setContextMenu,
    pendingRelation, setPendingRelation,
    isDirty, markClean,
    upsertNote, deleteNote, updateNotePosition,
    selectedEntityIds, toggleSelectedEntity, clearSelectedEntities,
    upsertEntity,
  } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [saving, setSaving] = useState(false);
  const [clipboard, setClipboard] = useState<CopiedEntity | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenuState | null>(null);

  // Entity dialog
  const [entityDialogOpen, setEntityDialogOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [newEntityType, setNewEntityType] = useState<Entity['type']>('master');

  // Relation dialog
  const [relationDialog, setRelationDialog] = useState<{
    sourceId: string; targetId: string; type: RelationType;
  } | null>(null);

  // Note dialog & context menu
  const [noteDialog, setNoteDialog] = useState<{
    note: StickyNote | null;
    position?: { x: number; y: number };
  } | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<{
    noteId: string; x: number; y: number;
  } | null>(null);

  // ── Sync plan → React Flow ──────────────────────────────────────────────────
  useEffect(() => {
    if (!plan) return;
    setNodes([...entitiesToNodes(plan.entities), ...notesToNodes(plan.notes ?? [])]);
    setEdges(relationsToEdges(plan.relations));
  }, [plan]);

  // ── Custom events from nodes ────────────────────────────────────────────────
  useEffect(() => {
    const onCompleteRelation = (e: Event) => {
      const { targetId } = (e as CustomEvent).detail;
      if (!pendingRelation) return;
      setRelationDialog({ sourceId: pendingRelation.sourceId, targetId, type: pendingRelation.type });
      setPendingRelation(null);
    };
    window.addEventListener('completeRelation', onCompleteRelation);
    return () => window.removeEventListener('completeRelation', onCompleteRelation);
  }, [pendingRelation, setPendingRelation]);

  useEffect(() => {
    const onEditEntity = (e: Event) => {
      const { entityId } = (e as CustomEvent).detail;
      setEditingEntityId(entityId);
      setEntityDialogOpen(true);
    };
    const onEditNote = (e: Event) => {
      const { noteId } = (e as CustomEvent).detail;
      const note = plan?.notes?.find((n) => n.id === noteId) ?? null;
      setNoteDialog({ note });
    };
    const onNoteCtx = (e: Event) => {
      const { noteId, x, y } = (e as CustomEvent).detail;
      setNoteContextMenu({ noteId, x, y });
    };
    window.addEventListener('editEntity', onEditEntity);
    window.addEventListener('editNote', onEditNote);
    window.addEventListener('noteContextMenu', onNoteCtx);
    return () => {
      window.removeEventListener('editEntity', onEditEntity);
      window.removeEventListener('editNote', onEditNote);
      window.removeEventListener('noteContextMenu', onNoteCtx);
    };
  }, [plan]);

  // ── Node drag ───────────────────────────────────────────────────────────────
  const onNodeDragStop = useCallback((_e: React.MouseEvent, node: Node) => {
    if (node.type === 'stickyNode') {
      updateNotePosition(node.id, node.position.x, node.position.y);
    } else {
      updateEntityPosition(node.id, node.position.x, node.position.y);
    }
  }, [updateEntityPosition, updateNotePosition]);

  // ── Save ────────────────────────────────────────────────────────────────────
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

  // ── Context menu handlers ───────────────────────────────────────────────────
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

  const handleCopyEntity = useCallback(() => {
    if (!plan) return;
    const entitiesToCopy: Entity[] = [];
    if (selectedEntityIds.length > 0) {
      // Copy selected entities
      selectedEntityIds.forEach((id) => {
        const entity = plan.entities.find((e) => e.id === id);
        if (entity) entitiesToCopy.push({ ...entity });
      });
    } else if (contextMenu) {
      // Copy single entity from context menu
      const entity = plan.entities.find((e) => e.id === contextMenu.entityId);
      if (entity) entitiesToCopy.push({ ...entity });
    }
    if (entitiesToCopy.length > 0) {
      setClipboard({ entities: entitiesToCopy, isCut: false });
    }
  }, [plan, selectedEntityIds, contextMenu]);

  const handleCutEntity = useCallback(() => {
    if (!plan) return;
    const entitiesToCut: Entity[] = [];
    if (selectedEntityIds.length > 0) {
      // Cut selected entities
      selectedEntityIds.forEach((id) => {
        const entity = plan.entities.find((e) => e.id === id);
        if (entity) entitiesToCut.push({ ...entity });
      });
    } else if (contextMenu) {
      // Cut single entity from context menu
      const entity = plan.entities.find((e) => e.id === contextMenu.entityId);
      if (entity) entitiesToCut.push({ ...entity });
    }
    if (entitiesToCut.length > 0) {
      setClipboard({ entities: entitiesToCut, isCut: true });
    }
  }, [plan, selectedEntityIds, contextMenu]);

  const handlePasteEntity = useCallback((pastePosition?: { x: number; y: number }) => {
    if (!clipboard || !plan) return;
    let offsetX = 20;
    let offsetY = 20;

    clipboard.entities.forEach((copiedEntity) => {
      const newEntity: Entity = {
        ...copiedEntity,
        id: Math.random().toString(36).substr(2, 9),
        position: {
          x: (pastePosition?.x ?? copiedEntity.position?.x ?? 0) + offsetX,
          y: (pastePosition?.y ?? copiedEntity.position?.y ?? 0) + offsetY,
        },
      };
      upsertEntity(newEntity);
      offsetX += 20;
      offsetY += 20;
    });

    if (clipboard.isCut) {
      clipboard.entities.forEach((entity) => {
        deleteEntity(entity.id);
      });
      setClipboard(null);
    }
  }, [clipboard, plan, deleteEntity, upsertEntity]);

  const handleCanvasClick = (e: React.MouseEvent | MouseEvent) => {
    // If click reached here, it's on empty canvas (nodes use stopPropagation)
    clearSelectedEntities();
    setContextMenu(null);
    setCanvasContextMenu(null);
    if (pendingRelation) setPendingRelation(null);
  };

  const handleCanvasContextMenu = (e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    // If right-click reached here, it's on empty canvas (nodes use stopPropagation)
    const clientX = 'clientX' in e ? e.clientX : 0;
    const clientY = 'clientY' in e ? e.clientY : 0;
    setCanvasContextMenu({ x: clientX, y: clientY });
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!plan) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopyEntity();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCutEntity();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteEntity();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyEntity, handleCutEntity, handlePasteEntity, plan]);

  // ── Relation dialog sources ─────────────────────────────────────────────────
  const relationSource = relationDialog
    ? plan?.entities.find((e) => e.id === relationDialog.sourceId) : null;
  const relationTarget = relationDialog
    ? plan?.entities.find((e) => e.id === relationDialog.targetId) : null;

  // ── Empty state ─────────────────────────────────────────────────────────────
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

      <CanvasToolbar
        moduleName={activeModule?.name}
        isDirty={isDirty}
        saving={saving}
        pendingRelation={pendingRelation}
        onAddEntity={(type) => { setNewEntityType(type); setEditingEntityId(null); setEntityDialogOpen(true); }}
        onAddNote={() => setNoteDialog({ note: null, position: { x: 80, y: 80 } })}
        onCancelRelation={() => setPendingRelation(null)}
        onSave={handleSave}
      />

      {/* React Flow canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={handleCanvasClick}
          onPaneContextMenu={handleCanvasContextMenu}
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

      {/* Entity right-click menu */}
      <CanvasContextMenu
        onEdit={handleEditEntity}
        onDelete={handleDeleteEntity}
        onStartRelation={handleStartRelation}
        onCopy={handleCopyEntity}
        onCut={handleCutEntity}
        onPaste={handlePasteEntity}
        canPaste={clipboard !== null}
        selectedCount={selectedEntityIds.length}
        onToggleSelection={toggleSelectedEntity}
      />

      {/* Canvas right-click menu (empty area) */}
      {canvasContextMenu && (
        <div
          style={{
            position: 'fixed',
            left: canvasContextMenu.x,
            top: canvasContextMenu.y,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 2000,
            minWidth: 150,
            overflow: 'hidden',
            fontSize: 13,
          }}
        >
          <button
            onClick={() => {
              handlePasteEntity({
                x: canvasContextMenu.x,
                y: canvasContextMenu.y,
              });
              setCanvasContextMenu(null);
            }}
            disabled={!clipboard}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: clipboard ? 'pointer' : 'not-allowed',
              color: clipboard ? '#1e293b' : '#cbd5e1',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              if (clipboard) {
                (e.target as HTMLButtonElement).style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'none';
            }}
          >
            📌 Paste
          </button>
        </div>
      )}

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

      {/* Note right-click menu */}
      {noteContextMenu && (
        <NoteContextMenu
          x={noteContextMenu.x}
          y={noteContextMenu.y}
          onEdit={() => {
            const note = plan.notes?.find((n) => n.id === noteContextMenu.noteId) ?? null;
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
