import { useState } from 'react';
import type { Entity, RelationType } from '../types';
import { genId } from '../utils/helpers';
import { useStore } from '../store';

interface Props {
  sourceEntity: Entity;
  targetEntity: Entity;
  relationType: RelationType;
  onClose: () => void;
}

export function RelationDialog({ sourceEntity, targetEntity, relationType, onClose }: Props) {
  const { addRelation } = useStore();
  const [sourceField, setSourceField] = useState(sourceEntity.fields[0]?.name ?? '');
  const [targetField, setTargetField] = useState(targetEntity.fields[0]?.name ?? '');

  const handleSave = () => {
    if (!sourceField || !targetField) return alert('Please select both fields');
    addRelation({
      id: genId('rel'),
      sourceId: sourceEntity.id,
      targetId: targetEntity.id,
      type: relationType,
      sourceField,
      targetField,
    });
    onClose();
  };

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Create Relation ({relationType})
          </span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            <strong style={{ color: '#1e293b' }}>{sourceEntity.name}</strong>
            {' → '}
            <strong style={{ color: '#1e293b' }}>{targetEntity.name}</strong>
          </div>

          <div>
            <label style={labelStyle}>
              Field in <strong>{sourceEntity.name}</strong>
            </label>
            <select style={input} value={sourceField} onChange={(e) => setSourceField(e.target.value)}>
              {sourceEntity.fields.length === 0 ? (
                <option value="">— no fields defined —</option>
              ) : (
                sourceEntity.fields.map((f) => (
                  <option key={f.id} value={f.name}>{f.name} ({f.type})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Field in <strong>{targetEntity.name}</strong>
            </label>
            <select style={input} value={targetField} onChange={(e) => setTargetField(e.target.value)}>
              {targetEntity.fields.length === 0 ? (
                <option value="">— no fields defined —</option>
              ) : (
                targetEntity.fields.map((f) => (
                  <option key={f.id} value={f.name}>{f.name} ({f.type})</option>
                ))
              )}
            </select>
          </div>

          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            The link will be automatically added to the Links tab of{' '}
            <strong>{sourceEntity.name}</strong>.
          </div>
        </div>

        <div style={footer}>
          <button onClick={handleSave} style={btnPrimary}>Create</button>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 8, width: 440,
  display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const titleBar: React.CSSProperties = {
  padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc', borderRadius: '8px 8px 0 0',
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b',
};
const footer: React.CSSProperties = {
  padding: '10px 16px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 500,
};
const input: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 4,
  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '6px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
