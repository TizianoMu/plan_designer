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
  onSaveAndGenerate: () => void;
}

const ENTITY_TYPES: { type: Entity['type']; border: string; text: string; label: string }[] = [
  { type: 'master', border: '#16a34a', text: '#15803d', label: 'Master' },
  { type: 'detail', border: '#2563eb', text: '#1d4ed8', label: 'Detail' },
];

export function CanvasToolbar({
  moduleName, isDirty, saving, pendingRelation, canUndo, canRedo, onUndo, onRedo,
  onAddEntity, onAddNote, onCancelRelation, snapToGrid, onToggleSnap,
  gridColor, gridGap, onGridColorChange, onGridGapChange, onSave, onSaveAndGenerate,
}: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '0 14px',
      height: 44, background: '#fff', borderBottom: '1px solid #e3e6df', flexShrink: 0,
    }}>
      {/* Module name */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginRight: 8 }}>
        {moduleName}
      </span>

      <Sep />

      {/* Undo / Redo */}
      <button onClick={onUndo} disabled={!canUndo} style={{ ...iconBtn, opacity: canUndo ? 1 : 0.3 }} title="Undo (Ctrl+Z)">
        Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} style={{ ...iconBtn, opacity: canRedo ? 1 : 0.3 }} title="Redo (Ctrl+Y)">
        Redo
      </button>

      <Sep />

      {/* Grid */}
      <button
        onClick={onToggleSnap}
        style={{ ...iconBtn, background: snapToGrid ? '#f0fdf4' : 'none', color: snapToGrid ? '#15803d' : '#6b7280', border: snapToGrid ? '1px solid #bbf7d0' : '1px solid #e3e6df' }}
        title={snapToGrid ? 'Disabilita snap' : 'Abilita snap'}
      >
        Snap
      </button>
      <input type="color" value={gridColor} onChange={(e) => onGridColorChange(e.target.value)}
        style={{ width: 24, height: 24, padding: 0, border: '1px solid #e3e6df', borderRadius: 4, cursor: 'pointer' }}
        title="Colore griglia"
      />
      <select value={gridGap} onChange={(e) => onGridGapChange(Number(e.target.value))} style={selectSt}>
        <option value={10}>10px</option>
        <option value={20}>20px</option>
        <option value={40}>40px</option>
        <option value={50}>50px</option>
      </select>

      <Sep />

      {/* Add entities */}
      {ENTITY_TYPES.map(({ type, border, text, label }) => (
        <button
          key={type}
          onClick={() => onAddEntity(type)}
          style={{
            padding: '4px 12px', border: `1px solid ${border}`, background: '#fff',
            color: text, borderRadius: 6, cursor: 'pointer', fontSize: 12,
            fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          + {label}
        </button>
      ))}

      <Sep />

      {/* Add note */}
      <button onClick={onAddNote} style={{ ...iconBtn, border: '1px solid #fde68a', color: '#92400e' }}>
        + Note
      </button>

      <div style={{ flex: 1 }} />

      {/* Pending relation */}
      {pendingRelation && (
        <div style={{
          background: '#fefce8', border: '1px solid #fde047', borderRadius: 6,
          padding: '4px 12px', fontSize: 12, color: '#713f12',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Clicca un'entità target per la relazione <strong>{pendingRelation.type}</strong>
          <button onClick={onCancelRelation}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a16207', fontSize: 14, padding: 0, lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      {/* Unsaved dot */}
      {isDirty && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Modifiche non salvate" />
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving || !isDirty}
        style={{
          padding: '5px 16px', background: '#fff',
          border: `1px solid ${isDirty ? '#d1d5db' : '#e3e6df'}`,
          color: isDirty ? '#374151' : '#d1d5db',
          cursor: isDirty ? 'pointer' : 'default',
          fontSize: 12, fontWeight: 500, borderRadius: 6, fontFamily: 'inherit',
        }}
      >
        {saving ? 'Salvataggio…' : 'Salva'}
      </button>

      {/* Save & SQL */}
      <button
        onClick={onSaveAndGenerate}
        disabled={saving}
        style={{
          padding: '5px 16px', background: saving ? '#e5e7eb' : '#16a34a', border: 'none',
          color: saving ? '#9ca3af' : '#fff',
          cursor: saving ? 'default' : 'pointer',
          fontSize: 12, fontWeight: 600, borderRadius: 6, fontFamily: 'inherit',
        }}
        title="Salva e genera schema SQL"
      >
        {saving ? '…' : 'Salva & SQL'}
      </button>
    </div>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: '#e3e6df', margin: '0 4px' }} />;
}

const iconBtn: React.CSSProperties = {
  padding: '4px 10px', background: 'none', border: '1px solid #e3e6df',
  color: '#6b7280', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
};

const selectSt: React.CSSProperties = {
  fontSize: 12, height: 26, padding: '0 4px', borderRadius: 6,
  border: '1px solid #e3e6df', background: '#fff', fontFamily: 'inherit', color: '#374151',
};
