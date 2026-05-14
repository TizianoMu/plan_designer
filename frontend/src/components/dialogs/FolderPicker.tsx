import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

interface Props {
  mode: 'open' | 'create';
  onSelect: (path: string, name?: string) => void;
  onClose: () => void;
}

export function FolderPicker({ mode, onSelect, onClose }: Props) {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<{ name: string; path: string; is_project: boolean }[]>([]);
  const [parent, setParent] = useState('');
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (path: string) => {
    setLoading(true); setError('');
    try {
      const res = await api.browse(path);
      setCurrentPath(res.path); setParent(res.parent); setEntries(res.entries); setSearch('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(''); }, []);

  const handleConfirm = () => {
    if (mode === 'create') {
      if (!newName.trim()) return setError('Inserisci un nome progetto');
      onSelect(currentPath, newName.trim());
    } else {
      if (!currentPath) return setError('Seleziona una cartella');
      onSelect(currentPath);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
            {mode === 'open' ? 'Apri cartella progetto' : 'Crea nuovo progetto'}
          </span>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={{ padding: 16 }}>
          {/* Current path */}
          <div style={{
            background: '#f9fafb', border: '1px solid #e3e6df', borderRadius: 6,
            padding: '6px 10px', fontSize: 11, color: '#6b7280', marginBottom: 10,
            fontFamily: 'monospace', wordBreak: 'break-all',
          }}>
            {currentPath || 'Caricamento…'}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <span style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: '#9ca3af', pointerEvents: 'none',
            }}>🔍</span>
            <input
              style={{
                width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #e3e6df',
                borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none', color: '#111827', background: '#fff',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtra cartelle…"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                  color: '#9ca3af', lineHeight: 1, padding: 0,
                }}
              >×</button>
            )}
          </div>

          {/* File list */}
          <div style={{
            border: '1px solid #e3e6df', borderRadius: 6, height: 250,
            overflowY: 'auto', background: '#fff',
          }}>
            {loading ? (
              <div style={{ padding: 16, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Caricamento…</div>
            ) : (() => {
              const filtered = search
                ? entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
                : entries;
              return (
                <>
                  {!search && parent && parent !== currentPath && (
                    <button onClick={() => load(parent)} style={entryStyle(false)}>
                      <span style={{ fontSize: 16, marginRight: 8, lineHeight: 1, color: '#9ca3af', flexShrink: 0 }}>⬆️</span>
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Cartella superiore</span>
                    </button>
                  )}
                  {filtered.map((e) => (
                    <button
                      key={e.path}
                      onDoubleClick={() => load(e.path)}
                      onClick={() => setCurrentPath(e.path)}
                      style={entryStyle(currentPath === e.path, e.is_project)}
                    >
                      <span style={{
                        fontSize: 16, marginRight: 8, lineHeight: 1,
                        color: e.is_project ? '#16a34a' : '#6b7280',
                        flexShrink: 0,
                      }}>
                        {e.is_project ? '📂' : '📁'}
                      </span>
                      <span style={{ flex: 1 }}>{e.name}</span>
                      {e.is_project && (
                        <span style={{
                          fontSize: 10, color: '#16a34a', fontWeight: 700,
                          background: '#dcfce7', padding: '2px 7px', borderRadius: 10,
                          border: '1px solid #bbf7d0', flexShrink: 0,
                        }}>
                          PROGETTO
                        </span>
                      )}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding: 16, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
                      {search ? `Nessuna cartella trovata per "${search}"` : 'Cartella vuota'}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {mode === 'create' && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Nome progetto
              </label>
              <input
                style={{
                  width: '100%', padding: '7px 10px', border: '1px solid #e3e6df',
                  borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
                  outline: 'none', color: '#111827', background: '#fff',
                }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="MioProgetto"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
              {newName && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' }}>
                  {currentPath || '…'}/{newName}
                </div>
              )}
            </div>
          )}

          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={btnOutline}>Annulla</button>
          <button onClick={handleConfirm} disabled={loading} style={btnPrimary}>
            {mode === 'open' ? 'Apri' : 'Crea'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900,
};
const dialogStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 10, width: 520,
  display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
};
const headerStyle: React.CSSProperties = {
  padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
  color: '#9ca3af', lineHeight: 1, padding: '0 2px', fontFamily: 'inherit',
};
const footerStyle: React.CSSProperties = {
  padding: '12px 16px', borderTop: '1px solid #f3f4f6',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
const entryStyle = (active: boolean, isProject = false): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '8px 12px', border: 'none', cursor: 'pointer',
  fontSize: 13, fontFamily: 'monospace', textAlign: 'left',
  background: active ? '#f0fdf4' : isProject ? '#f9fefb' : 'none',
  color: active ? '#15803d' : '#374151',
  fontWeight: active ? 600 : isProject ? 500 : 400,
  borderLeft: active ? '3px solid #16a34a' : isProject ? '3px solid #86efac' : '3px solid transparent',
});
const btnPrimary: React.CSSProperties = {
  padding: '7px 20px', background: '#16a34a', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
};
const btnOutline: React.CSSProperties = {
  padding: '7px 16px', background: '#fff', color: '#374151', border: '1px solid #e3e6df',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
};
