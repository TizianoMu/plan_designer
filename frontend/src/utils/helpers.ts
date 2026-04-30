import type { Entity, Field, Plan, Relation, StickyNote } from '../types';
import { Node, Edge } from '@xyflow/react';

let _counter = 0;
export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${++_counter}`;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Default fields ─────────────────────────────────────────────────────────────

export function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: genId('field'),
    name: '',
    type: 'C',
    length: 10,
    decimals: 0,
    repeated: false,
    key: 0,
    multilang: false,
    description: '',
    note: '',
    check: '',
    defaultValue: '',
    allowNulls: true,
    dataSensibility: 'Not defined',
    dataRiskLevel: '0 - No risks',
    identifiesPerson: false,
    ...overrides,
  };
}

export function cprownum(): Field {
  return makeField({
    id: genId('field'),
    name: 'CPROWNUM',
    type: 'N',
    length: 6,
    decimals: 0,
    repeated: true,
    key: 1,
    description: 'Riga',
    allowNulls: false,
  });
}

export function cproword(): Field {
  return makeField({
    id: genId('field'),
    name: 'CPROWORD',
    type: 'N',
    length: 6,
    decimals: 0,
    repeated: true,
    key: 0,
    description: 'Posizione',
    allowNulls: true,
  });
}

export function makeEntity(type: Entity['type'] = 'master'): Entity {
  const isDetail = type === 'detail';
  return {
    id: genId('entity'),
    name: '',
    program: '',
    type,
    template: isDetail ? 'Child Detail entity (DetailChild)' : 'Master entity (Master)',
    created: today(),
    revised: today(),
    notes: '',
    isPrototype: false,
    isExternallyLinkable: false,
    hasMenu: true,
    isExternalTable: false,
    isPublic: false,
    isOffline: false,
    keepHistoricalData: false,
    updateTimestamp: false,
    hasCprownum: false,
    hasCproword: false,
    fields: [],
    links: [],
    indexes: [],
    autonumbers: [],
    position: { x: 100, y: 100 },
  };
}

// ── React Flow conversion ──────────────────────────────────────────────────────

export function entitiesToNodes(entities: Entity[]): Node[] {
  return entities.map((e) => ({
    id: e.id,
    type: 'entityNode',
    position: e.position,
    data: { entity: e },
  }));
}

export function relationsToEdges(relations: Relation[]): Edge[] {
  return relations.map((r) => ({
    id: r.id,
    source: r.sourceId,
    target: r.targetId,
    type: 'default',
    data: { relation: r },
    markerEnd: r.type === '1:n' ? { type: 'arrowclosed' } : undefined,
    label: r.type,
    style: {
      strokeDasharray: r.type === '1:1' ? '5,5' : undefined,
    },
  }));
}

// ── Sticky note nodes ─────────────────────────────────────────────────────────

export function notesToNodes(notes: StickyNote[]): import('@xyflow/react').Node[] {
  return notes.map((n) => ({
    id: n.id,
    type: 'stickyNode',
    position: n.position,
    data: { note: n },
  }));
}

// ── Entity computed fields (with auto-flags applied) ──────────────────────────

export function getEntityEffectiveFields(entity: Entity): Field[] {
  const fields = [...entity.fields];
  if (entity.type === 'detail') {
    if (entity.hasCprownum && !fields.find((f) => f.name === 'CPROWNUM')) {
      fields.unshift(cprownum());
    }
    if (entity.hasCproword && !fields.find((f) => f.name === 'CPROWORD')) {
      const idx = fields.findIndex((f) => f.name === 'CPROWNUM');
      fields.splice(idx + 1, 0, cproword());
    }
  }
  return fields;
}
