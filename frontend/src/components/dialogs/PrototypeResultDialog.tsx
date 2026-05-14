import { useState } from 'react';
import type { GeneratedPrototype, GeneratedFile } from '../../utils/generatePrototype';

interface Props {
  prototypes: GeneratedPrototype[];
  onConfirm: () => void;
  onClose: () => void;
  writing: boolean;
}

const TYPE_COLOR: Record<string, string> = {
  html: '#16a34a',
  css:  '#7c3aed',
  js:   '#d97706',
  py:   '#2563eb',
};

export function PrototypeResultDialog({ prototypes, onConfirm, onClose, writing }: Props) {
  // Flatten all files for display, keyed by "entityIdx:fileIdx"
  const allFiles: Array<GeneratedFile & { entityName: string }> = prototypes.flatMap((p) =>
    p.files.map((f) => ({ ...f, entityName: p.entityName }))
  );

  const [selectedKey, setSelectedKey] = useState(0);
  const selected = allFiles[selectedKey];

  const entityCount = prototypes.length;
  const fileCount   = allFiles.length;

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
              Generazione prototipi
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {entityCount} {entityCount === 1 ? 'entità' : 'entità'} →{' '}
              {fileCount} file generati
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* File list sidebar */}
          <div style={sidebarStyle}>
            {prototypes.map((proto) => (
              <div key={proto.entityId}>
                <div style={entityHeaderStyle}>
                  {proto.entityName}
                  <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginLeft: 6 }}>
                    {proto.program}
                  </span>
                </div>
                {proto.files.map((f, fi) => {
                  const globalIdx = allFiles.findIndex(
                    (af) => af.entityName === proto.entityName && af.filename === f.filename
                  );
                  const isActive = selectedKey === globalIdx;
                  return (
                    <button
                      key={fi}
                      onClick={() => setSelectedKey(globalIdx)}
                      style={fileEntryStyle(isActive, f.type)}
                    >
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: TYPE_COLOR[f.type] ?? '#6b7280',
                        background: `${TYPE_COLOR[f.type]}18`,
                        padding: '1px 5px', borderRadius: 3, marginRight: 6, flexShrink: 0,
                      }}>
                        {f.type.toUpperCase()}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.filename}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Code preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selected && (
              <>
                <div style={previewHeaderStyle}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>
                    {selected.path}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: TYPE_COLOR[selected.type] ?? '#6b7280',
                    background: `${TYPE_COLOR[selected.type]}18`,
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    {selected.type.toUpperCase()}
                  </span>
                </div>
                <pre style={codeStyle}>{selected.content}</pre>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <span style={{ fontSize: 12, color: '#9ca3af', flex: 1 }}>
            I file saranno scritti in <code style={{ fontSize: 11 }}>…/{allFiles[0]?.path.split('/').slice(0, 2).join('/')}/</code>
          </span>
          <button onClick={onClose} style={btnOutlineStyle} disabled={writing}>
            Annulla
          </button>
          <button onClick={onConfirm} disabled={writing} style={btnPrimaryStyle}>
            {writing ? 'Scrittura…' : `Scrivi ${fileCount} file`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
};
const dialogStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 10, width: 860, height: 560,
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  overflow: 'hidden',
};
const headerStyle: React.CSSProperties = {
  padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  flexShrink: 0,
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 22, color: '#9ca3af', lineHeight: 1, padding: 0,
};
const sidebarStyle: React.CSSProperties = {
  width: 240, borderRight: '1px solid #f3f4f6',
  overflowY: 'auto', flexShrink: 0, background: '#fafafa',
};
const entityHeaderStyle: React.CSSProperties = {
  padding: '8px 12px 4px', fontSize: 11, fontWeight: 700,
  color: '#374151', letterSpacing: 0.3, borderBottom: '1px solid #f3f4f6',
  background: '#f3f4f6', display: 'flex', alignItems: 'center',
};
const fileEntryStyle = (active: boolean, type: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', width: '100%', padding: '7px 12px',
  background: active ? `${TYPE_COLOR[type] ?? '#2563eb'}12` : 'none',
  border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
  textAlign: 'left', color: active ? (TYPE_COLOR[type] ?? '#2563eb') : '#4b5563',
  fontWeight: active ? 600 : 400,
  borderLeft: active ? `3px solid ${TYPE_COLOR[type] ?? '#2563eb'}` : '3px solid transparent',
});
const previewHeaderStyle: React.CSSProperties = {
  padding: '8px 14px', borderBottom: '1px solid #f3f4f6',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#fafafa', flexShrink: 0,
};
const codeStyle: React.CSSProperties = {
  margin: 0, padding: '12px 16px', flex: 1, overflowY: 'auto',
  fontSize: 11.5, lineHeight: 1.55, fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
  color: '#1e293b', background: '#fff', whiteSpace: 'pre',
};
const footerStyle: React.CSSProperties = {
  padding: '12px 20px', borderTop: '1px solid #f3f4f6',
  display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
};
const btnPrimaryStyle: React.CSSProperties = {
  padding: '7px 20px', background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
};
const btnOutlineStyle: React.CSSProperties = {
  padding: '7px 16px', background: '#fff', color: '#374151',
  border: '1px solid #e3e6df', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontFamily: 'inherit',
};
