import { useState } from 'react';
import type { StickyNote } from '../types';
import { genId } from '../utils/helpers';

interface Props {
  note: StickyNote | null; // null = create new
  position?: { x: number; y: number };
  onSave: (note: StickyNote) => void;
  onClose: () => void;
}

// Preset swatches matching Sitepainter style
const TEXT_COLORS = ['#000000', '#ffffff', '#dc2626', '#2563eb', '#16a34a', '#92400e'];
const BG_COLORS   = ['#fef08a', '#ffffff', '#fecaca', '#bfdbfe', '#bbf7d0', '#fed7aa', '#e9d5ff', '#f1f5f9'];

function ColorPicker({ label, value, presets, onChange }: {
  label: string;
  value: string;
  presets: string[];
  onChange: (c: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, minWidth: 90 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 3, cursor: 'pointer',
              background: c,
              border: value === c ? '2px solid #2563eb' : '1px solid #94a3b8',
              outline: value === c ? '1px solid #2563eb' : 'none',
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      {/* Native color input for custom color */}
      <div style={{ position: 'relative' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="Custom color"
          style={{
            width: 22, height: 22, padding: 0, border: '1px solid #94a3b8',
            borderRadius: 3, cursor: 'pointer', background: 'none',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>?</span>
    </div>
  );
}

export function StickyNoteDialog({ note, position, onSave, onClose }: Props) {
  const [text, setText] = useState(note?.text ?? '');
  const [textColor, setTextColor] = useState(note?.textColor ?? '#000000');
  const [bgColor, setBgColor] = useState(note?.bgColor ?? '#fef08a');

  const handleSave = () => {
    onSave({
      id: note?.id ?? genId('note'),
      text,
      textColor,
      bgColor,
      position: note?.position ?? position ?? { x: 200, y: 200 },
    });
    onClose();
  };

  return (
    <div style={overlay}>
      <div style={dialog}>
        <div style={titleBar}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Comment</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Text</label>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%', height: 130, padding: '6px 8px', resize: 'vertical',
                border: '1px solid #94a3b8', borderRadius: 3, fontSize: 13,
                fontFamily: 'inherit', boxSizing: 'border-box',
                background: bgColor, color: textColor,
              }}
            />
          </div>

          <ColorPicker label="Text color" value={textColor} presets={TEXT_COLORS} onChange={setTextColor} />
          <ColorPicker label="Background color" value={bgColor} presets={BG_COLORS} onChange={setBgColor} />
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
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 6, width: 420,
  display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const titleBar: React.CSSProperties = {
  padding: '10px 14px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc', borderRadius: '6px 6px 0 0',
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b',
};
const footer: React.CSSProperties = {
  padding: '10px 14px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
const btnPrimary: React.CSSProperties = {
  padding: '5px 20px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '5px 14px', background: '#f1f5f9', color: '#374151', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
