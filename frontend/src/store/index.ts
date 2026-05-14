import { create } from 'zustand';
import type { Project, Module, Plan, Entity, Relation, ContextMenu, StickyNote } from '../types';
import { genId, today } from '../utils/helpers';

interface AppState {
  project: Project | null;
  activeModule: Module | null;
  plan: Plan | null;
  isDirty: boolean;
  pendingAction: (() => void) | null; // action waiting for unsaved-changes confirmation

  // Relation creation flow
  pendingRelation: { sourceId: string; type: '1:1' | '1:n' } | null;

  // UI
  contextMenu: ContextMenu | null;
  selectedEntityId: string | null;
  selectedEntityIds: string[]; // Multiple selection

  // Actions
  setProject: (p: Project | null) => void;
  setActiveModule: (m: Module | null) => void;
  setPlan: (plan: Plan | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setPendingAction: (fn: (() => void) | null) => void;

  upsertEntity: (entity: Entity) => void;
  deleteEntity: (id: string) => void;
  updateEntityPosition: (id: string, x: number, y: number) => void;

  addRelation: (rel: Relation) => void;
  deleteRelation: (id: string) => void;

  upsertNote: (note: StickyNote) => void;
  deleteNote: (id: string) => void;
  updateNotePosition: (id: string, x: number, y: number) => void;

  setPendingRelation: (pr: { sourceId: string; type: '1:1' | '1:n' } | null) => void;
  setContextMenu: (cm: ContextMenu | null) => void;
  setSelectedEntityId: (id: string | null) => void;
  toggleSelectedEntity: (id: string) => void;
  clearSelectedEntities: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  project: null,
  activeModule: null,
  plan: null,
  isDirty: false,
  pendingAction: null,
  pendingRelation: null,
  contextMenu: null,
  selectedEntityId: null,
  selectedEntityIds: [],

  setProject: (p) => set({ project: p }),
  setActiveModule: (m) => set({ activeModule: m }),
  setPlan: (plan) => set({ plan, isDirty: false }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  setPendingAction: (fn) => set({ pendingAction: fn }),

  upsertEntity: (entity) =>
    set((s) => {
      if (!s.plan) return {};
      const exists = s.plan.entities.find((e) => e.id === entity.id);
      const entities = exists
        ? s.plan.entities.map((e) => (e.id === entity.id ? { ...entity, revised: today() } : e))
        : [...s.plan.entities, entity];
      return { plan: { ...s.plan, entities }, isDirty: true };
    }),

  deleteEntity: (id) =>
    set((s) => {
      if (!s.plan) return {};
      return {
        plan: {
          ...s.plan,
          entities: s.plan.entities.filter((e) => e.id !== id),
          relations: s.plan.relations.filter((r) => r.sourceId !== id && r.targetId !== id),
        },
        isDirty: true,
      };
    }),

  updateEntityPosition: (id, x, y) =>
    set((s) => {
      if (!s.plan) return {};
      return {
        plan: {
          ...s.plan,
          entities: s.plan.entities.map((e) =>
            e.id === id ? { ...e, position: { x, y } } : e
          ),
        },
        isDirty: true,
      };
    }),

  addRelation: (rel) =>
    set((s) => {
      if (!s.plan) return {};
      // Also update Links on both entities
      const entities = s.plan.entities.map((e) => {
        if (e.id === rel.sourceId) {
          const link = {
            id: genId('link'),
            targetEntityId: rel.targetId,
            targetEntityName: s.plan!.entities.find((x) => x.id === rel.targetId)?.name ?? '',
            fields: [{ localField: rel.sourceField, foreignField: rel.targetField }],
            relationType: rel.type,
          };
          return { ...e, links: [...e.links, link] };
        }
        return e;
      });
      return {
        plan: { ...s.plan, entities, relations: [...s.plan.relations, rel] },
        isDirty: true,
      };
    }),

  deleteRelation: (id) =>
    set((s) => {
      if (!s.plan) return {};
      const rel = s.plan.relations.find((r) => r.id === id);
      const entities = rel
        ? s.plan.entities.map((e) =>
            e.id === rel.sourceId
              ? { ...e, links: e.links.filter((l) => l.targetEntityId !== rel.targetId) }
              : e
          )
        : s.plan.entities;
      return {
        plan: { ...s.plan, entities, relations: s.plan.relations.filter((r) => r.id !== id) },
        isDirty: true,
      };
    }),

  upsertNote: (note) =>
    set((s) => {
      if (!s.plan) return {};
      const exists = s.plan.notes?.find((n) => n.id === note.id);
      const notes = exists
        ? (s.plan.notes ?? []).map((n) => (n.id === note.id ? note : n))
        : [...(s.plan.notes ?? []), note];
      return { plan: { ...s.plan, notes }, isDirty: true };
    }),

  deleteNote: (id) =>
    set((s) => {
      if (!s.plan) return {};
      return { plan: { ...s.plan, notes: (s.plan.notes ?? []).filter((n) => n.id !== id) }, isDirty: true };
    }),

  updateNotePosition: (id, x, y) =>
    set((s) => {
      if (!s.plan) return {};
      return {
        plan: { ...s.plan, notes: (s.plan.notes ?? []).map((n) => n.id === id ? { ...n, position: { x, y } } : n) },
        isDirty: true,
      };
    }),

  setPendingRelation: (pr) => set({ pendingRelation: pr }),
  setContextMenu: (cm) => set({ contextMenu: cm }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id, selectedEntityIds: id ? [id] : [] }),
  
  toggleSelectedEntity: (id) =>
    set((s) => {
      const newSelected = s.selectedEntityIds.includes(id)
        ? s.selectedEntityIds.filter((x) => x !== id)
        : [...s.selectedEntityIds, id];
      return {
        selectedEntityIds: newSelected,
        selectedEntityId: newSelected.length === 1 ? newSelected[0] : s.selectedEntityId,
      };
    }),

  clearSelectedEntities: () => set({ selectedEntityIds: [], selectedEntityId: null }),
}));
