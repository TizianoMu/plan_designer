import { useState } from 'react';
import type { Entity, EntityIndex } from '../../../types';
import { input } from '../../shared/dialogStyles';
import { IndexCompositionDialog } from './IndexCompositionDialog';
import { AutonumberDialog } from './AutonumberDialog';

interface Props {
  entity: Entity;
  set: <K extends keyof Entity>(k: K, v: Entity[K]) => void;
}

export function DatabaseTab({ entity, set }: Props) {
  const [indexDialog, setIndexDialog] = useState<{ index: EntityIndex | null } | null>(null);
  const [autonumberOpen, setAutonumberOpen] = useState(false);
  const [selectedIndexId, setSelectedIndexId] = useState<string | null>(null);

  // Auto indexes from key fields (read-only)
  const keyIndexes: EntityIndex[] = entity.fields
    .filter((f) => f.key > 0)
    .map((f) => ({
      id: `key_${f.id}`,
      fields: [{ fieldName: f.name, direction: 'Asc' as const }],
      fromKey: true,
    }));

  const userIndexes = (entity.indexes ?? []).filter((idx) => !idx.fromKey);
  const allIndexes = [...keyIndexes, ...userIndexes];

  const handleSaveIndex = (idx: EntityIndex) => {
    const existing = (entity.indexes ?? []).find((i) => i.id === idx.id);
    const updated = existing
      ? (entity.indexes ?? []).map((i) => i.id === idx.id ? idx : i)
      : [...(entity.indexes ?? []), idx];
    set('indexes', updated);
    setIndexDialog(null);
  };

  const handleDeleteIndex = () => {
    if (!selectedIndexId) return;
    set('indexes', (entity.indexes ?? []).filter((i) => i.id !== selectedIndexId));
    setSelectedIndexId(null);
  };

  const indexLabel = (idx: EntityIndex) =>
    idx.fields.map((f) => `${f.fieldName} ${f.direction}`).join(', ');

  const selectedIsKey = allIndexes.find((i) => i.id === selectedIndexId)?.fromKey ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Data name + Physical name */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Data name</label>
          <input style={input} value={entity.program}
            onChange={(e) => set('program', e.target.value.replace(/\s/g, ''))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Physical name</label>
          <input value={entity.program} readOnly
            style={{ ...input, background: '#f8fafc', color: '#64748b' }} />
        </div>
      </div>

      {/* Checkboxes + Autonumber button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <label style={checkLabel}><input type="checkbox" disabled /> Company name</label>
        <label style={checkLabel}>
          <input type="checkbox"
            checked={(entity as any).keepHistoricalData ?? false}
            onChange={(e) => set('keepHistoricalData' as any, e.target.checked)} />
          Keep historical data
        </label>
        <label style={checkLabel}>
          <input type="checkbox"
            checked={(entity as any).updateTimestamp ?? false}
            onChange={(e) => set('updateTimestamp' as any, e.target.checked)} />
          Update timestamp
        </label>
        <button onClick={() => setAutonumberOpen(true)} style={{ ...outlineBtn, marginLeft: 'auto' }}>
          Autonumber…
        </button>
      </div>

      {/* Indexes */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Indexes</div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', fontSize: 11, fontWeight: 700, color: '#475569' }}>
            <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>Index expression</div>
            <div style={{ width: 80, padding: '5px 8px' }}>Type</div>
          </div>
          <div style={{ minHeight: 80, maxHeight: 160, overflowY: 'auto' }}>
            {allIndexes.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                No indexes — set key fields or add custom indexes below
              </div>
            ) : (
              allIndexes.map((idx) => (
                <div key={idx.id}
                  onClick={() => setSelectedIndexId(idx.id)}
                  onDoubleClick={() => !idx.fromKey && setIndexDialog({ index: idx })}
                  title={idx.fromKey ? 'Auto-generated from key field' : 'Double-click to edit'}
                  style={{
                    display: 'flex', alignItems: 'center', fontSize: 12,
                    cursor: idx.fromKey ? 'default' : 'pointer',
                    background: selectedIndexId === idx.id ? '#dbeafe' : idx.fromKey ? '#f8fafc' : undefined,
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                  <div style={{
                    flex: 1, padding: '5px 8px', borderRight: '1px solid #f1f5f9',
                    color: idx.fromKey ? '#64748b' : '#1e293b',
                    fontStyle: idx.fromKey ? 'italic' : undefined,
                  }}>
                    {indexLabel(idx)}
                    {idx.fromKey && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>KEY</span>
                    )}
                  </div>
                  <div style={{ width: 80, padding: '5px 8px', color: '#64748b' }}>Normal</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button onClick={() => setIndexDialog({ index: null })} style={iconBtn} title="Add index">
            <span style={{ color: '#16a34a', fontSize: 16, fontWeight: 700 }}>+</span>
          </button>
          <button onClick={handleDeleteIndex}
            disabled={!selectedIndexId || selectedIsKey}
            title={selectedIsKey ? 'Key indexes cannot be deleted' : 'Delete selected index'}
            style={{ ...iconBtn, opacity: (!selectedIndexId || selectedIsKey) ? 0.3 : 1 }}>
            <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>−</span>
          </button>
        </div>
      </div>

      {/* Autonumbers preview */}
      {(entity.autonumbers ?? []).length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Autonumbers</div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }}>
            {(entity.autonumbers ?? []).map((a) => (
              <div key={a.id} style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                <span style={{ fontWeight: 600 }}>{a.field}</span>
                <span style={{ color: '#64748b' }}>{a.tableName}</span>
                {a.condition && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{a.condition}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {indexDialog && (
        <IndexCompositionDialog
          fields={entity.fields}
          index={indexDialog.index}
          onSave={handleSaveIndex}
          onClose={() => setIndexDialog(null)}
        />
      )}
      {autonumberOpen && (
        <AutonumberDialog
          autonumbers={entity.autonumbers ?? []}
          fields={entity.fields}
          tableName={entity.program || entity.name}
          onSave={(autonumbers) => { set('autonumbers', autonumbers); setAutonumberOpen(false); }}
          onClose={() => setAutonumberOpen(false)}
        />
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#374151', marginBottom: 3, fontWeight: 500,
};
const checkLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};
const outlineBtn: React.CSSProperties = {
  padding: '4px 12px', background: '#fff', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#374151',
};
