import { useState } from 'react';
import type { Autonumber, Field } from '../../../types';
import { genId } from '../../../utils/helpers';

interface Props {
  autonumbers: Autonumber[];
  fields: Field[];
  tableName: string;
  onSave: (autonumbers: Autonumber[]) => void;
  onClose: () => void;
}

export function AutonumberDialog({ autonumbers, fields, tableName, onSave, onClose }: Props) {
  const [rows, setRows] = useState<Autonumber[]>(
    autonumbers.map((a) => ({ ...a }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    autonumbers[0]?.id ?? null
  );

  const addRow = () => {
    const newRow: Autonumber = {
      id: genId('auto'),
      field: fields[0]?.name ?? '',
      tableName,
      condition: '',
    };
    setRows((prev) => [...prev, newRow]);
    setSelectedId(newRow.id);
  };

  const deleteRow = () => {
    if (!selectedId) return;
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== selectedId);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const updateRow = <K extends keyof Autonumber>(id: string, key: K, value: Autonumber[K]) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [key]: value } : r));
  };

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Autonumber</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Table header */}
          <div style={tableHeader}>
            <div style={{ ...cell, flex: 2 }}>Autonumber</div>
            <div style={{ ...cell, flex: 2 }}>Table Name</div>
            <div style={{ ...cell, flex: 3 }}>Condition</div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderTop: 'none' }}>
            {rows.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                No autonumbers defined
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: selectedId === row.id ? '#dbeafe' : undefined,
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  {/* Field selector */}
                  <div style={{ flex: 2, padding: '3px 6px' }}>
                    <select
                      value={row.field}
                      onChange={(e) => updateRow(row.id, 'field', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={cellInput}
                    >
                      {fields.map((f) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Table name (read-only) */}
                  <div style={{ flex: 2, padding: '3px 6px' }}>
                    <input
                      value={row.tableName}
                      readOnly
                      style={{ ...cellInput, background: '#f8fafc', color: '#64748b' }}
                    />
                  </div>

                  {/* Condition */}
                  <div style={{ flex: 3, padding: '3px 6px' }}>
                    <input
                      value={row.condition}
                      onChange={(e) => updateRow(row.id, 'condition', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Optional condition…"
                      style={cellInput}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* + / - buttons */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: 4 }}>
            <button onClick={addRow} style={iconBtn} title="Add autonumber">
              <span style={{ color: '#16a34a', fontSize: 16, fontWeight: 700 }}>+</span>
            </button>
            <button
              onClick={deleteRow}
              disabled={!selectedId}
              style={{ ...iconBtn, opacity: selectedId ? 1 : 0.4 }}
              title="Remove autonumber"
            >
              <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>−</span>
            </button>
          </div>
        </div>

        <div style={footer}>
          <button onClick={() => onSave(rows)} style={btnPrimary}>OK</button>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 6, width: 560, height: 360,
  display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const titleBar: React.CSSProperties = {
  padding: '10px 14px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc', borderRadius: '6px 6px 0 0', flexShrink: 0,
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b',
};
const tableHeader: React.CSSProperties = {
  display: 'flex', background: '#f1f5f9',
  border: '1px solid #e2e8f0', borderBottom: 'none',
  fontSize: 11, fontWeight: 700, color: '#475569',
};
const cell: React.CSSProperties = {
  padding: '5px 8px', borderRight: '1px solid #e2e8f0',
};
const cellInput: React.CSSProperties = {
  width: '100%', padding: '3px 5px', border: '1px solid #e2e8f0',
  borderRadius: 3, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box',
};
const footer: React.CSSProperties = {
  padding: '10px 14px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
};
const btnPrimary: React.CSSProperties = {
  padding: '5px 18px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '5px 14px', background: '#f1f5f9', color: '#374151',
  border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
