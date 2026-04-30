import { useState } from 'react';
import type { EntityIndex, Field } from '../../../types';
import { genId } from '../../../utils/helpers';

interface IndexField {
  fieldName: string;
  direction: 'Asc' | 'Desc';
}

interface Props {
  fields: Field[];
  index: EntityIndex | null; // null = create new
  onSave: (index: EntityIndex) => void;
  onClose: () => void;
}

export function IndexCompositionDialog({ fields, index, onSave, onClose }: Props) {
  const availableNames = fields.map((f) => f.name);

  const [selected, setSelected] = useState<IndexField[]>(
    index ? index.fields.map((f) => ({ ...f })) : []
  );
  const [highlighted, setHighlighted] = useState<string | null>(null); // left panel
  const [highlightedSel, setHighlightedSel] = useState<number | null>(null); // right panel

  const available = availableNames.filter(
    (name) => !selected.find((s) => s.fieldName === name)
  );

  const moveRight = () => {
    if (!highlighted) return;
    setSelected((prev) => [...prev, { fieldName: highlighted, direction: 'Asc' }]);
    setHighlighted(null);
  };

  const moveLeft = () => {
    if (highlightedSel === null) return;
    setSelected((prev) => prev.filter((_, i) => i !== highlightedSel));
    setHighlightedSel(null);
  };

  const toggleDirection = (idx: number) => {
    setSelected((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, direction: s.direction === 'Asc' ? 'Desc' : 'Asc' } : s
      )
    );
  };

  const handleSave = () => {
    if (selected.length === 0) return alert('Select at least one field for the index.');
    onSave({
      id: index?.id ?? genId('idx'),
      fields: selected,
      fromKey: false,
    });
  };

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Index composition</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden' }}>
          {/* Left: available fields */}
          <div style={panel}>
            <div style={panelHeader}>Fields</div>
            <div style={listBox}>
              {available.map((name) => {
                const f = fields.find((x) => x.name === name)!;
                return (
                  <div
                    key={name}
                    onDoubleClick={moveRight}
                    onClick={() => setHighlighted(name)}
                    style={{
                      ...listRow,
                      background: highlighted === name ? '#2563eb' : undefined,
                      color: highlighted === name ? '#fff' : undefined,
                    }}
                  >
                    <span style={{ minWidth: 100 }}>{name}</span>
                    <span style={{ color: highlighted === name ? '#bfdbfe' : '#94a3b8', fontSize: 11 }}>
                      {f.type}
                    </span>
                    <span style={{ color: highlighted === name ? '#bfdbfe' : '#94a3b8', fontSize: 11, marginLeft: 4 }}>
                      {f.length}
                    </span>
                    {f.key ? (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: highlighted === name ? '#fde68a' : '#f59e0b' }}>
                        KEY
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: arrows */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, padding: '0 10px',
          }}>
            <button onClick={moveRight} style={arrowBtn} title="Add to index">▶▶</button>
            <button onClick={moveLeft} style={arrowBtn} title="Remove from index">◀◀</button>
          </div>

          {/* Right: selected fields */}
          <div style={panel}>
            <div style={panelHeader}>Index fields</div>
            <div style={listBox}>
              {selected.map((s, i) => (
                <div
                  key={s.fieldName}
                  onClick={() => setHighlightedSel(i)}
                  onDoubleClick={moveLeft}
                  style={{
                    ...listRow,
                    background: highlightedSel === i ? '#2563eb' : undefined,
                    color: highlightedSel === i ? '#fff' : undefined,
                  }}
                >
                  <span style={{ flex: 1 }}>{s.fieldName}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDirection(i); }}
                    style={{
                      background: 'none', border: '1px solid',
                      borderColor: highlightedSel === i ? '#bfdbfe' : '#cbd5e1',
                      borderRadius: 3, cursor: 'pointer', fontSize: 11,
                      color: highlightedSel === i ? '#fff' : '#475569',
                      padding: '1px 6px',
                    }}
                  >
                    {s.direction}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={footer}>
          <button onClick={handleSave} style={btnPrimary}>OK</button>
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
  background: '#fff', borderRadius: 6, width: 620, height: 420,
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
const panel: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
};
const panelHeader: React.CSSProperties = {
  padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#475569',
  background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
};
const listBox: React.CSSProperties = {
  flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0',
};
const listRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '5px 8px', cursor: 'pointer', fontSize: 12,
  borderBottom: '1px solid #f8fafc', userSelect: 'none',
};
const arrowBtn: React.CSSProperties = {
  padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#374151',
};
const footer: React.CSSProperties = {
  padding: '10px 14px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
};
const btnPrimary: React.CSSProperties = {
  padding: '5px 18px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '5px 14px', background: '#f1f5f9', color: '#374151',
  border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
