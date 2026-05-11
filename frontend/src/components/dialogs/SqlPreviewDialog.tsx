import { useRef, useState } from 'react';

interface Props {
  sql: string;
  moduleName: string;
  onClose: () => void;
}

const MIN_W = 400;
const MIN_H = 280;
type Edge = 'e' | 's' | 'se' | 'sw' | 'w' | 'n' | 'ne' | 'nw';

export function SqlPreviewDialog({ sql, moduleName, onClose }: Props) {
  const [size, setSize] = useState({ width: 800, height: 540 });
  const dragRef = useRef<{ edge: Edge; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const justResized = useRef(false);

  const startResize = (edge: Edge) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { edge, startX: e.clientX, startY: e.clientY, startW: size.width, startH: size.height };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const { edge, startX, startY, startW, startH } = dragRef.current;
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      justResized.current = true;
      setSize((p) => {
        let w = p.width, h = p.height;
        if (edge.includes('e')) w = Math.max(MIN_W, startW + dx);
        if (edge.includes('w')) w = Math.max(MIN_W, startW - dx);
        if (edge.includes('s')) h = Math.max(MIN_H, startH + dy);
        if (edge.includes('n')) h = Math.max(MIN_H, startH - dy);
        return { width: w, height: h };
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setTimeout(() => { justResized.current = false; }, 0);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).catch(() => {
      const el = document.getElementById('sql-area') as HTMLTextAreaElement | null;
      el?.select(); document.execCommand('copy');
    });
  };

  const handleDownload = () => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([sql], { type: 'text/plain' })),
      download: `${moduleName}.sql`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const h = (cursor: string, style: React.CSSProperties, edge: Edge) => (
    <div onMouseDown={startResize(edge)} style={{ position: 'absolute', cursor, userSelect: 'none', ...style }} />
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={(e) => { if (e.target === e.currentTarget && !justResized.current) onClose(); }}
    >
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 10,
        width: size.width, height: size.height, maxWidth: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
      }}>
        {/* Resize handles */}
        {h('ew-resize',   { left: 0,   top: 10,   bottom: 10,  width: 5  }, 'w')}
        {h('ew-resize',   { right: 0,  top: 10,   bottom: 10,  width: 5  }, 'e')}
        {h('ns-resize',   { top: 0,    left: 10,  right: 10,   height: 5 }, 'n')}
        {h('ns-resize',   { bottom: 0, left: 10,  right: 10,   height: 5 }, 's')}
        {h('nwse-resize', { left: 0,   top: 0,    width: 12,   height: 12}, 'nw')}
        {h('nesw-resize', { right: 0,  top: 0,    width: 12,   height: 12}, 'ne')}
        {h('nesw-resize', { left: 0,   bottom: 0, width: 12,   height: 12}, 'sw')}
        {h('nwse-resize', { right: 0,  bottom: 0, width: 12,   height: 12}, 'se')}

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Schema SQL</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{moduleName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: '0 2px' }}>
            ×
          </button>
        </div>

        {/* SQL */}
        <textarea
          id="sql-area" readOnly value={sql}
          style={{
            flex: 1, margin: '14px 16px 0', padding: '12px 14px',
            background: '#111827', color: '#6ee7b7', border: 'none', borderRadius: 8,
            fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7,
            resize: 'none', outline: 'none', overflowY: 'auto', minHeight: 0,
          }}
        />

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={handleCopy} style={btnOutline}>Copia</button>
          <button onClick={handleDownload} style={btnGreen}>Download .sql</button>
          <button onClick={onClose} style={btnDark}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}

const btnOutline: React.CSSProperties = {
  padding: '6px 16px', background: '#fff', border: '1px solid #e3e6df',
  color: '#374151', cursor: 'pointer', fontSize: 13, borderRadius: 6, fontFamily: 'inherit',
};
const btnGreen: React.CSSProperties = {
  padding: '6px 16px', background: '#16a34a', border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, borderRadius: 6, fontFamily: 'inherit',
};
const btnDark: React.CSSProperties = {
  padding: '6px 16px', background: '#111827', border: 'none',
  color: '#fff', cursor: 'pointer', fontSize: 13, borderRadius: 6, fontFamily: 'inherit',
};
