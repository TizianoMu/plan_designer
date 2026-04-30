interface Props {
  x: number;
  y: number;
  onEdit: () => void;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const btnStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 14px',
  background: 'none', border: 'none', textAlign: 'left',
  cursor: 'pointer', color: '#1e293b', fontFamily: 'inherit', fontSize: 13,
};

export function NoteContextMenu({ x, y, onEdit, onCopy, onCut, onDelete, onClose }: Props) {
  return (
    <div
      onMouseLeave={onClose}
      style={{
        position: 'fixed', left: x, top: y,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 2000,
        minWidth: 160, overflow: 'hidden', fontSize: 13,
      }}
    >
      <button onClick={onEdit} style={btnStyle}>✏️ Edit note</button>
      <button onClick={onCopy} style={btnStyle}>📋 Copy note</button>
      <button onClick={onCut} style={btnStyle}>✂️ Cut note</button>
      <div style={{ height: 1, background: '#f1f5f9' }} />
      <button onClick={onDelete} style={{ ...btnStyle, color: '#ef4444' }}>🗑️ Delete note</button>
    </div>
  );
}
