import type { Entity } from '../../types';

interface Props {
  moduleName: string | undefined;
  isDirty: boolean;
  saving: boolean;
  pendingRelation: { sourceId: string; type: '1:1' | '1:n' } | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddEntity: (type: Entity['type']) => void;
  onAddNote: () => void;
  onCancelRelation: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  gridColor: string;
  gridGap: number;
  onGridColorChange: (color: string) => void;
  onGridGapChange: (gap: number) => void;
  onSave: () => void;
}

const ENTITY_TYPES: { type: Entity['type']; color: string }[] = [
  { type: 'master',   color: '#16a34a' },
  { type: 'detail',   color: '#2563eb' }
];

export function CanvasToolbar({
  moduleName, isDirty, saving, pendingRelation, canUndo, canRedo, onUndo, onRedo,
  onAddEntity, onAddNote, onCancelRelation, snapToGrid, onToggleSnap,
  gridColor, gridGap, onGridColorChange, onGridGapChange, onSave,
}: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
      background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
    }}>
      {/* Module label */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginRight: 4 }}>
        📁 {moduleName}
      </span>

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

      {/* Undo / Redo */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{ ...historyBtn, opacity: canUndo ? 1 : 0.4 }}
          title="Undo (Ctrl+Z)"
        >↩️</button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          style={{ ...historyBtn, opacity: canRedo ? 1 : 0.4 }}
          title="Redo (Ctrl+Y)"
        >↪️</button>
      </div>

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

      {/* Impostazioni Griglia */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onToggleSnap}
          style={{ 
            ...historyBtn, 
            background: snapToGrid ? '#e2e8f0' : '#fff',
            borderColor: snapToGrid ? '#cbd5e1' : '#e2e8f0'
          }}
          title={snapToGrid ? "Disabilita Snap" : "Abilita Snap"}
        >
          {snapToGrid ? '▦' : '▢'}
        </button>

        <input
          type="color"
          value={gridColor}
          onChange={(e) => onGridColorChange(e.target.value)}
          style={{ width: 24, height: 24, padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
          title="Colore griglia"
        />

        <select
          value={gridGap}
          onChange={(e) => onGridGapChange(Number(e.target.value))}
          style={{ fontSize: 11, height: 24, padding: '0 4px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff' }}
          title="Densità griglia"
        >
          <option value={10}>10px</option>
          <option value={20}>20px</option>
          <option value={40}>40px</option>
          <option value={50}>50px</option>
        </select>
      </div>

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

      {/* Add entity buttons */}
      {ENTITY_TYPES.map(({ type, color }) => (
        <button
          key={type}
          onClick={() => onAddEntity(type)}
          style={{
            padding: '4px 12px', border: `1px solid ${color}`,
            color, background: '#fff', borderRadius: 4,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
          title={`Add ${type} entity`}
        >
          + {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />

      {/* Add note button */}
      <button
        onClick={onAddNote}
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
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔗 Click a target entity for <strong>{pendingRelation.type}</strong> relation
          <button
            onClick={onCancelRelation}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Unsaved indicator */}
      {isDirty && (
        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>● Unsaved</span>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving || !isDirty}
        style={{
          padding: '5px 16px',
          background: isDirty ? '#2563eb' : '#94a3b8',
          color: '#fff', border: 'none', borderRadius: 4,
          cursor: isDirty ? 'pointer' : 'default',
          fontSize: 13, fontWeight: 600,
        }}
      >
        {saving ? 'Saving…' : '💾 Save'}
      </button>
    </div>
  );
}

const historyBtn: React.CSSProperties = {
  padding: '4px 8px', background: '#fff', border: '1px solid #e2e8f0',
  borderRadius: 4, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center',
};
