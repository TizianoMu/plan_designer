import { useState } from 'react';
import type { Field, FieldType, DataSensibility, DataRiskLevel } from '../types';
import { makeField, genId } from '../utils/helpers';

interface Props {
  field: Field | null;
  entityType: 'master' | 'detail' | 'external' | 'virtual';
  onSave: (f: Field) => void;
  onClose: () => void;
}

const FIELD_TYPES: FieldType[] = ['C', 'N', 'D', 'M', 'B', 'DT'];
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  C: 'Character', N: 'Numeric', D: 'Date', M: 'Memo', B: 'Boolean', DT: 'DateTime',
};
const SENSIBILITY_OPTIONS: DataSensibility[] = ['Not defined', 'Public', 'Internal', 'Confidential', 'Secret'];
const RISK_OPTIONS: DataRiskLevel[] = ['0 - No risks', '1 - Low', '2 - Medium', '3 - High'];

const KEY_OPTIONS = [
  { value: 0, label: 'No index/key' },
  { value: 1, label: 'Primary key' },
  { value: 2, label: 'Index 2' },
  { value: 3, label: 'Index 3' },
];

export function FieldDialog({ field, entityType, onSave, onClose }: Props) {
  const [f, setF] = useState<Field>(() =>
    field ? { ...field } : makeField({ id: genId('field') })
  );
  const [tab, setTab] = useState<'Definition' | 'Notes'>('Definition');

  const set = <K extends keyof Field>(key: K, value: Field[K]) =>
    setF((prev) => {
      const next = { ...prev, [key]: value };
      // Key fields must not allow nulls
      if (key === 'key') {
        next.allowNulls = (value as number) === 0;
      }
      return next;
    });

  const handleSave = () => {
    if (!f.name.trim()) return alert('Field name is required');
    onSave(f);
  };

  const showLength = f.type === 'C' || f.type === 'N';
  const showDecimals = f.type === 'N';

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Field properties</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={tabBar}>
          {(['Definition', 'Notes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...tabBtn, ...(tab === t ? tabActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {tab === 'Definition' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name + Key/Index */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Name</label>
                  <input
                    style={input}
                    value={f.name}
                    onChange={(e) => set('name', e.target.value.toUpperCase())}
                    autoFocus
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Key/Index</label>
                  <select style={input} value={f.key} onChange={(e) => set('key', Number(e.target.value))}>
                    {KEY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, opacity: f.key > 0 ? 0.45 : 1 }}>
                    <input
                      type="checkbox"
                      checked={f.allowNulls}
                      disabled={f.key > 0}
                      onChange={(e) => set('allowNulls', e.target.checked)}
                    />
                    Allow nulls{f.key > 0 && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>(key fields cannot be null)</span>}
                  </label>
                </div>
              </div>

              {/* Type + Length + Decimals + Repeated */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Type</label>
                  <select
                    style={input}
                    value={f.type}
                    onChange={(e) => set('type', e.target.value as FieldType)}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                {showLength && (
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Length</label>
                    <input
                      style={input}
                      type="number"
                      min={1}
                      value={f.length}
                      onChange={(e) => set('length', Number(e.target.value))}
                    />
                  </div>
                )}
                {showDecimals && (
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Decimals</label>
                    <input
                      style={input}
                      type="number"
                      min={0}
                      value={f.decimals}
                      onChange={(e) => set('decimals', Number(e.target.value))}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6, gap: 12 }}>
                  {entityType === 'detail' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={f.repeated}
                        onChange={(e) => set('repeated', e.target.checked)}
                      />
                      Repeated
                    </label>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={f.multilang}
                      onChange={(e) => set('multilang', e.target.checked)}
                    />
                    Multilanguage
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <input
                  style={input}
                  value={f.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              {/* Check */}
              <div>
                <label style={labelStyle}>Check</label>
                <input
                  style={input}
                  value={f.check}
                  onChange={(e) => set('check', e.target.value)}
                />
              </div>

              {/* Default */}
              <div>
                <label style={labelStyle}>Default</label>
                <input
                  style={input}
                  value={f.defaultValue}
                  onChange={(e) => set('defaultValue', e.target.value)}
                />
              </div>

              {/* Privacy section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Privacy</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Data sensibility</label>
                    <select
                      style={input}
                      value={f.dataSensibility}
                      onChange={(e) => set('dataSensibility', e.target.value as DataSensibility)}
                    >
                      {SENSIBILITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Data risk level</label>
                    <select
                      style={input}
                      value={f.dataRiskLevel}
                      onChange={(e) => set('dataRiskLevel', e.target.value as DataRiskLevel)}
                    >
                      {RISK_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={f.identifiesPerson}
                    onChange={(e) => set('identifiesPerson', e.target.checked)}
                  />
                  Information that identifies the person
                </label>
              </div>
            </div>
          )}

          {tab === 'Notes' && (
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                style={{ ...input, minHeight: 120, resize: 'vertical' }}
                value={f.note}
                onChange={(e) => set('note', e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={footer}>
          <button onClick={handleSave} style={btnPrimary}>OK</button>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 8, width: 560, maxHeight: '85vh',
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
const tabBar: React.CSSProperties = {
  display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 12px',
};
const tabBtn: React.CSSProperties = {
  padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 13, color: '#64748b', borderBottom: '2px solid transparent', marginBottom: -1,
};
const tabActive: React.CSSProperties = {
  color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600,
};
const footer: React.CSSProperties = {
  padding: '10px 16px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#374151', marginBottom: 3, fontWeight: 500,
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
