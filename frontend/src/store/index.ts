import { create } from 'zustand';
import type { Project, Module, Plan, Entity, Relation, ContextMenu, StickyNote, EditorTab, ProtoComponent, PrototypeLayout } from '../types';
import { genId, today } from '../utils/helpers';

const PLAN_TAB: EditorTab = { id: 'plan', type: 'plan', label: 'Plan' };

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

  // Editor tabs
  tabs: EditorTab[];
  activeTabId: string;

  // Actions
  setProject: (p: Project | null) => void;
  setActiveModule: (m: Module | null) => void;
  setPlan: (plan: Plan | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setPendingAction: (fn: (() => void) | null) => void;

  openFormTab: (entity: Entity) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

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

  // Prototype layout actions (visual layer only — never touch entity schema)
  upsertProtoComponent: (entityId: string, component: ProtoComponent) => void;
  deleteProtoComponent: (entityId: string, componentId: string) => void;
  updateProtoLayout: (layout: PrototypeLayout) => void;
  getProtoLayout: (entityId: string) => PrototypeLayout | undefined;
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
  tabs: [PLAN_TAB],
  activeTabId: 'plan',

  setProject: (p) => set({ project: p }),
  setActiveModule: (m) => set({ activeModule: m }),
  setPlan: (plan) => set({ plan, isDirty: false, tabs: [PLAN_TAB], activeTabId: 'plan' }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  setPendingAction: (fn) => set({ pendingAction: fn }),

  openFormTab: (entity) =>
    set((s) => {
      const existingTab = s.tabs.find((t) => t.entityId === entity.id);
      if (existingTab) return { activeTabId: existingTab.id };
      const newTab: EditorTab = {
        id: `form-${entity.id}`,
        type: 'form',
        entityId: entity.id,
        label: entity.name || entity.program,
      };
      return { tabs: [...s.tabs, newTab], activeTabId: newTab.id };
    }),

  closeTab: (tabId) =>
    set((s) => {
      if (tabId === 'plan') return {};
      const newTabs = s.tabs.filter((t) => t.id !== tabId);
      const newActiveId = s.activeTabId === tabId
        ? (newTabs[newTabs.length - 1]?.id ?? 'plan')
        : s.activeTabId;
      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

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

  upsertProtoComponent: (entityId, component) =>
    set((s) => {
      if (!s.plan) return {};
      const layouts = s.plan.prototypeLayouts ?? [];
      const existing = layouts.find((l) => l.entityId === entityId);
      const updatedLayout: PrototypeLayout = existing
        ? {
            ...existing,
            components: existing.components.find((c) => c.id === component.id)
              ? existing.components.map((c) => (c.id === component.id ? component : c))
              : [...existing.components, component],
          }
        : { entityId, canvasWidth: 1200, canvasHeight: 800, snapToGrid: true, gridSize: 8, components: [component] };
      const prototypeLayouts = existing
        ? layouts.map((l) => (l.entityId === entityId ? updatedLayout : l))
        : [...layouts, updatedLayout];
      return { plan: { ...s.plan, prototypeLayouts }, isDirty: true };
    }),

  deleteProtoComponent: (entityId, componentId) =>
    set((s) => {
      if (!s.plan) return {};
      const layouts = (s.plan.prototypeLayouts ?? []).map((l) =>
        l.entityId === entityId
          ? { ...l, components: l.components.filter((c) => c.id !== componentId) }
          : l
      );
      return { plan: { ...s.plan, prototypeLayouts: layouts }, isDirty: true };
    }),

  updateProtoLayout: (layout) =>
    set((s) => {
      if (!s.plan) return {};
      const layouts = s.plan.prototypeLayouts ?? [];
      const exists = layouts.find((l) => l.entityId === layout.entityId);
      const prototypeLayouts = exists
        ? layouts.map((l) => (l.entityId === layout.entityId ? layout : l))
        : [...layouts, layout];
      return { plan: { ...s.plan, prototypeLayouts }, isDirty: true };
    }),

  getProtoLayout: (entityId) => get().plan?.prototypeLayouts?.find((l) => l.entityId === entityId),
}));
