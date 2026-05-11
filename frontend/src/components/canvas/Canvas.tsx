import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState,
  Node, Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store';
import { api } from '../../utils/api';
import { entitiesToNodes, relationsToEdges, notesToNodes, genId } from '../../utils/helpers';
import { validateEntity } from '../../utils/validation';
import type { Entity, RelationType, StickyNote } from '../../types';

import { EntityNode } from './nodes/EntityNode';
import { StickyNode } from './nodes/StickyNode';
import { CanvasToolbar } from './CanvasToolbar';
import { NoteContextMenu } from './NoteContextMenu';
import { CanvasContextMenu } from '../shared/CanvasContextMenu';
import { EntityDialog } from '../dialogs/entity/EntityDialog';
import { RelationDialog } from '../dialogs/RelationDialog';
import { StickyNoteDialog } from '../dialogs/StickyNoteDialog';
import { SqlPreviewDialog } from '../dialogs/SqlPreviewDialog';
import { generateSql } from '../../utils/generateSql';

const nodeTypes = { entityNode: EntityNode, stickyNode: StickyNode };

interface ClipboardData {
  entities: Entity[];
  notes: StickyNote[];
  isCut: boolean;
}

interface CanvasContextMenuState {
  x: number;
  y: number;
}

export function Canvas() {
  const {
    plan, project, activeModule, setPlan,
    deleteEntity, updateEntityPosition, deleteRelation,
    contextMenu, setContextMenu,
    pendingRelation, setPendingRelation,
    isDirty, markClean, markDirty,
    upsertNote, deleteNote, updateNotePosition,
    selectedEntityIds, toggleSelectedEntity, clearSelectedEntities,
    upsertEntity,
  } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [saving, setSaving] = useState(false);
  const [sqlOutput, setSqlOutput] = useState<string | null>(null);

  // ── Undo/Redo State ────────────────────────────────────────────────────────
  const [past, setPast] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);

  const takeSnapshot = useCallback(() => {
    if (!plan) return;
    // Salviamo una copia profonda dello stato attuale prima della modifica
    setPast((prev) => [JSON.parse(JSON.stringify(plan)), ...prev].slice(0, 50));
    setFuture([]); // Ogni nuova azione pulisce il futuro
  }, [plan]);

  const undo = useCallback(() => {
    if (past.length === 0 || !plan) return;
    const previous = past[0];
    const newPast = past.slice(1);
    setFuture((prev) => [JSON.parse(JSON.stringify(plan)), ...prev]);
    setPast(newPast);
    setPlan(previous);
    markDirty(); // Mark as dirty after undo
  }, [past, plan, setPlan, markDirty]);

  const redo = useCallback(() => {
    if (future.length === 0 || !plan) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [JSON.parse(JSON.stringify(plan)), ...prev]);
    setFuture(newFuture);
    setPlan(next);
    markDirty(); // Mark as dirty after redo
  }, [future, plan, setPlan, markDirty]);

  // ───────────────────────────────────────────────────────────────────────────

  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
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

  // ── Snap to Grid State ─────────────────────────────────────────────────────
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridColor, setGridColor] = useState('#d4d7ce');
  const [gridGap, setGridGap] = useState(20);

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
  const onNodeDragStop = useCallback((_e: React.MouseEvent, draggedNode: Node) => {
    takeSnapshot();
    // Quando si trascina una selezione multipla, React Flow aggiorna le posizioni di tutti i nodi selezionati.
    // Dobbiamo iterare su tutti i nodi selezionati per aggiornare il nostro store.
    nodes.forEach((node) => {
      if (node.selected) {
        if (node.type === 'stickyNode') updateNotePosition(node.id, node.position.x, node.position.y);
        else updateEntityPosition(node.id, node.position.x, node.position.y);
      }
    });
  }, [nodes, updateEntityPosition, updateNotePosition, takeSnapshot]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!plan || !project || !activeModule) return;

    // Impedisce il salvataggio globale se ci sono entità con campi obbligatori vuoti
    const allBlockingErrors: string[] = [];
    plan.entities.forEach(e => {
      const { blocking } = validateEntity(e, plan.entities);
      if (blocking.length > 0) {
        allBlockingErrors.push(...blocking.map(err => `Entity "${e.name}": ${err}`));
      }
    });

    if (allBlockingErrors.length > 0) {
      alert('Cannot save due to validation errors:\n' + allBlockingErrors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      await api.savePlan(project.project_path, activeModule.name, plan);
      markClean();
    } catch (e: any) {
      alert('Save error: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [plan, project, activeModule, markClean]);

  const handleSaveAndGenerate = useCallback(async () => {
    if (!plan || !project || !activeModule) return;

    const allBlockingErrors: string[] = [];
    plan.entities.forEach((e) => {
      const { blocking } = validateEntity(e, plan.entities);
      if (blocking.length > 0) {
        allBlockingErrors.push(...blocking.map((err) => `Entity "${e.name}": ${err}`));
      }
    });

    if (allBlockingErrors.length > 0) {
      alert('Cannot save due to validation errors:\n' + allBlockingErrors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      await api.savePlan(project.project_path, activeModule.name, plan);
      markClean();
      setSqlOutput(generateSql(plan));
    } catch (e: any) {
      alert('Save error: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [plan, project, activeModule, markClean]);

  // ── Clipboard & Context menu handlers ───────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (!plan) return;
    const entitiesToCopy: Entity[] = [];
    const notesToCopy: StickyNote[] = [];
    const selectedNodes = nodes.filter(n => n.selected);

    if (selectedNodes.length > 0) {
      selectedNodes.forEach((node) => {
        if (node.type === 'entityNode') {
          const entity = plan.entities.find((e) => e.id === node.id);
          if (entity) entitiesToCopy.push({ ...entity });
        } else if (node.type === 'stickyNode') {
          const note = plan.notes?.find((n) => n.id === node.id);
          if (note) notesToCopy.push({ ...note });
        }
      });
    } else if (contextMenu) {
      const entity = plan.entities.find((e) => e.id === contextMenu.entityId);
      if (entity) entitiesToCopy.push({ ...entity });
    } else if (noteContextMenu) {
      const note = plan.notes?.find(n => n.id === noteContextMenu.noteId);
      if (note) notesToCopy.push({ ...note });
    }

    if (entitiesToCopy.length > 0 || notesToCopy.length > 0) {
      setClipboard({ entities: entitiesToCopy, notes: notesToCopy, isCut: false });
    }
  }, [plan, nodes, contextMenu, noteContextMenu]);

  const handleCut = useCallback(() => {
    if (!plan) return;
    takeSnapshot();
    const entitiesToCut: Entity[] = [];
    const notesToCut: StickyNote[] = [];
    const selectedNodes = nodes.filter(n => n.selected);

    if (selectedNodes.length > 0) {
      selectedNodes.forEach((node) => {
        if (node.type === 'entityNode') {
          const entity = plan.entities.find((e) => e.id === node.id);
          if (entity) entitiesToCut.push({ ...entity });
        } else if (node.type === 'stickyNode') {
          const note = plan.notes?.find((n) => n.id === node.id);
          if (note) notesToCut.push({ ...note });
        }
      });
    } else if (contextMenu) {
      const entity = plan.entities.find((e) => e.id === contextMenu.entityId);
      if (entity) entitiesToCut.push({ ...entity });
    } else if (noteContextMenu) {
      const note = plan.notes?.find(n => n.id === noteContextMenu.noteId);
      if (note) notesToCut.push({ ...note });
    }

    if (entitiesToCut.length > 0 || notesToCut.length > 0) {
      setClipboard({ entities: entitiesToCut, notes: notesToCut, isCut: true });
    }
  }, [plan, nodes, contextMenu, noteContextMenu]);

  const handlePaste = useCallback((pastePosition?: { x: number; y: number }) => {
    if (!clipboard || !plan) return;
    takeSnapshot();
    const offset = 25;

    // Incolla Entità
    clipboard.entities.forEach((copiedEntity, idx) => {
      const newEntity: Entity = {
        ...copiedEntity,
        id: genId('ent'),
        name: `Copy of ${copiedEntity.name}`,
        program: '',
        dataName: '',
        physicalName: '',
        position: {
          x: (pastePosition?.x ?? copiedEntity.position?.x ?? 0) + (idx + 1) * offset,
          y: (pastePosition?.y ?? copiedEntity.position?.y ?? 0) + (idx + 1) * offset,
        },
      };
      upsertEntity(newEntity);
      if (clipboard.isCut) deleteEntity(copiedEntity.id);
    });

    // Incolla Note
    clipboard.notes.forEach((copiedNote, idx) => {
      const newNote: StickyNote = {
        ...copiedNote,
        id: genId('note'),
        position: {
          x: (pastePosition?.x ?? copiedNote.position?.x ?? 0) + (idx + 1) * offset,
          y: (pastePosition?.y ?? copiedNote.position?.y ?? 0) + (idx + 1) * offset,
        },
      };
      upsertNote(newNote);
      if (clipboard.isCut) deleteNote(copiedNote.id);
    });

    if (clipboard.isCut) {
      setClipboard(null);
    }
  }, [clipboard, plan, deleteEntity, upsertEntity, upsertNote, deleteNote]);

  const handleEditEntity = () => {
    if (!contextMenu) return;
    setEditingEntityId(contextMenu.entityId);
    setEntityDialogOpen(true);
  };
  const handleDeleteEntity = () => {
    if (!contextMenu) return;
    if (window.confirm(`Delete entity "${contextMenu.entityName}"?`)) {
      takeSnapshot();
      deleteEntity(contextMenu.entityId);
    }
  };
  const handleStartRelation = (type: RelationType) => {
    if (!contextMenu) return;
    setPendingRelation({ sourceId: contextMenu.entityId, type });
  };

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
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handleCut, handlePaste, undo, redo, handleSave, plan]);

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
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Seleziona un modulo dalla sidebar per iniziare</div>
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
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onAddEntity={(type) => { 
          setNewEntityType(type); setEditingEntityId(null); setEntityDialogOpen(true); 
        }}
        onAddNote={() => setNoteDialog({ note: null, position: { x: 80, y: 80 } })}
        onCancelRelation={() => setPendingRelation(null)}
        onSave={handleSave}
        onSaveAndGenerate={handleSaveAndGenerate}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        gridColor={gridColor}
        gridGap={gridGap}
        onGridColorChange={setGridColor}
        onGridGapChange={setGridGap}
      />

      {/* React Flow canvas */}
      <div style={{ flex: 1, background: '#f2f4ef' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          snapToGrid={snapToGrid}
          snapGrid={[gridGap, gridGap]}
          selectionOnDrag
          selectionMode="partial"
          panOnDrag={[1]}
          panActivationKeyCode="Space"
          onNodesDelete={(deleted) => {
            takeSnapshot();
            deleted.forEach((node) => {
              if (node.type === 'stickyNode') deleteNote(node.id);
              else deleteEntity(node.id);
            });
          }}
          onPaneClick={handleCanvasClick}
          onPaneContextMenu={handleCanvasContextMenu}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Delete', 'Backspace']}
          onEdgesDelete={(deleted: Edge[]) => {
            takeSnapshot();
            deleted.forEach((e) => deleteRelation(e.id));
          }}
          style={{ cursor: pendingRelation ? 'crosshair' : undefined }}
        >
          <Background variant={BackgroundVariant.Dots} gap={gridGap} size={1} color={gridColor} />
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
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        canPaste={clipboard !== null}
        selectedCount={nodes.filter(n => n.selected && n.type === 'entityNode').length}
        onToggleSelection={toggleSelectedEntity}
      />

      {/* Canvas right-click menu (empty area) */}
      {canvasContextMenu && (
        <div style={{
          position: 'fixed', left: canvasContextMenu.x, top: canvasContextMenu.y,
          background: '#1c1c1e', border: '1px solid #3f3f46',
          zIndex: 2000, minWidth: 140, fontSize: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <button
            onClick={() => { handlePaste({ x: canvasContextMenu.x, y: canvasContextMenu.y }); setCanvasContextMenu(null); }}
            disabled={!clipboard}
            style={{
              display: 'block', width: '100%', padding: '7px 12px',
              background: 'none', border: 'none', textAlign: 'left',
              cursor: clipboard ? 'pointer' : 'default',
              color: clipboard ? '#e4e4e7' : '#3f3f46',
              fontFamily: 'inherit', fontSize: 12,
            }}
            onMouseEnter={(e) => { if (clipboard) (e.currentTarget as HTMLButtonElement).style.background = '#27272a'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            Paste
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
          onSave={(note) => { 
            takeSnapshot();
            upsertNote(note); 
            setNoteDialog(null); 
          }}
          onClose={() => setNoteDialog(null)}
        />
      )}

      {/* SQL preview dialog */}
      {sqlOutput !== null && (
        <SqlPreviewDialog
          sql={sqlOutput}
          moduleName={activeModule?.name ?? 'module'}
          onClose={() => setSqlOutput(null)}
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
          onCopy={() => { handleCopy(); setNoteContextMenu(null); }}
          onCut={() => { handleCut(); setNoteContextMenu(null); }}
          onDelete={() => {
            if (window.confirm('Delete this note?')) {
              takeSnapshot();
              deleteNote(noteContextMenu.noteId);
            }
            setNoteContextMenu(null);
          }}
          onClose={() => setNoteContextMenu(null)}
        />
      )}
    </div>
  );
}
