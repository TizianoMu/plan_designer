// ── Field Types ───────────────────────────────────────────────────────────────

export type FieldType = 'C' | 'N' | 'D' | 'M' | 'B' | 'DT';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  C: 'Character',
  N: 'Numeric',
  D: 'Date',
  M: 'Memo',
  B: 'Boolean',
  DT: 'DateTime',
};

export type DataSensibility = 'Not defined' | 'Public' | 'Internal' | 'Confidential' | 'Secret';
export type DataRiskLevel = '0 - No risks' | '1 - Low' | '2 - Medium' | '3 - High';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  length: number;
  decimals: number;
  repeated: boolean;
  key: number; // 0 = not a key, 1 = primary key, etc.
  multilang: boolean;
  description: string;
  note: string;
  check: string;
  defaultValue: string;
  allowNulls: boolean;
  dataSensibility: DataSensibility;
  dataRiskLevel: DataRiskLevel;
  identifiesPerson: boolean;
}

// ── Index & Autonumber ────────────────────────────────────────────────────────

export interface EntityIndex {
  id: string;
  fields: { fieldName: string; direction: 'Asc' | 'Desc' }[];
  fromKey: boolean; // true = auto-generated from key field, not user-deletable
}

export interface Autonumber {
  id: string;
  field: string;       // field name in this entity
  tableName: string;   // pre-filled with entity.program
  condition: string;
}

// ── Link (auto-populated when relation is created) ────────────────────────────

export interface LinkField {
  localField: string;
  foreignField: string;
}

export interface Link {
  id: string;
  targetEntityId: string;
  targetEntityName: string;
  fields: LinkField[];
  relationType: RelationType;
}

// ── Entity Types ──────────────────────────────────────────────────────────────

export type EntityType = 'master' | 'detail' | 'external' | 'virtual';

export interface EntityPosition {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  name: string;
  program: string;
  dataName: string;
  type: EntityType;
  template: string;
  created: string;
  revised: string;
  notes: string;
  isPrototype: boolean;
  isExternallyLinkable: boolean;
  hasMenu: boolean;
  isExternalTable: boolean;
  isPublic: boolean;
  isOffline: boolean;
  // Database tab fields
  keepHistoricalData: boolean;
  updateTimestamp: boolean;
  // Detail-specific flags
  hasCprownum: boolean;  // auto-add CPROWNUM field
  hasCproword: boolean;  // auto-add CPROWORD field
  fields: Field[];
  links: Link[];
  indexes: EntityIndex[];
  autonumbers: Autonumber[];
  position: EntityPosition;
}

// ── Relations ─────────────────────────────────────────────────────────────────

export type RelationType = '1:1' | '1:n';

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  sourceField: string;
  targetField: string;
}

// ── Sticky Note ──────────────────────────────────────────────────────────────

export interface StickyNote {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
  position: { x: number; y: number };
}

// ── Plan / Module ─────────────────────────────────────────────────────────────

export interface Plan {
  module: string;
  entities: Entity[];
  relations: Relation[];
  notes: StickyNote[];
  prototypeLayouts?: PrototypeLayout[]; // visual layer only, separate from entity schema
}

export interface Module {
  name: string;
  path: string;
}

export interface Project {
  project_path: string;
  project_name: string;
  modules: Module[];
}

// ── UI State ──────────────────────────────────────────────────────────────────

export interface ContextMenu {
  x: number;
  y: number;
  entityId: string;
  entityName: string;
}

export type DialogMode = 'create' | 'edit';

// ── Editor Tabs ───────────────────────────────────────────────────────────────

export type EditorTabType = 'plan' | 'form';

export interface EditorTab {
  id: string;
  type: EditorTabType;
  entityId?: string; // only for form tabs
  label: string;
}

// ── Prototype Layout (visual layer — never touches DB schema) ─────────────────

export type ProtoComponentType = 'field' | 'label' | 'separator' | 'image' | 'button';

export interface ProtoComponentStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ProtoComponent {
  id: string;
  type: ProtoComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  // 'field' binding — read-only reference, never alters Entity.fields
  fieldName?: string;
  label?: string;
  text?: string;
  placeholder?: string;
  required?: boolean;
  visible?: boolean;
  readonly?: boolean;
  style?: ProtoComponentStyle;
}

export interface PrototypeLayout {
  entityId: string;
  canvasWidth: number;
  canvasHeight: number;
  snapToGrid: boolean;
  gridSize: number;
  components: ProtoComponent[];
}
