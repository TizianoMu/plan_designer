interface Props {
  x: number; y: number;
  onEdit: () => void; onCopy: () => void; onCut: () => void;
  onDelete: () => void; onClose: () => void;
}

export function NoteContextMenu({ x, y, onEdit, onCopy, onCut, onDelete, onClose }: Props) {
  return (
    <div onMouseLeave={onClose} style={{
      position: 'fixed', left: x, top: y,
      background: '#fff', border: '1px solid #e3e6df', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 2000, minWidth: 160, overflow: 'hidden', fontSize: 13,
    }}>
      {[
        { label: 'Modifica nota', action: onEdit },
        { label: 'Copia nota', action: onCopy },
        { label: 'Taglia nota', action: onCut },
      ].map(({ label, action }) => (
        <button key={label} onClick={action} style={itemStyle('#111827')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
          {label}
        </button>
      ))}
      <div style={{ height: 1, background: '#f3f4f6', margin: '3px 0' }} />
      <button onClick={onDelete} style={itemStyle('#dc2626')}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
        Elimina nota
      </button>
    </div>
  );
}

function itemStyle(color: string): React.CSSProperties {
  return {
    display: 'block', width: '100%', padding: '7px 14px',
    background: 'none', border: 'none', textAlign: 'left',
    cursor: 'pointer', color, fontFamily: 'inherit', fontSize: 13,
  };
}
