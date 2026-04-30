import { overlay, btnPrimary, btnSecondary } from '../../shared/dialogStyles';

interface Props {
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function WarningConfirmDialog({ warnings, onConfirm, onCancel }: Props) {
  return (
    <div style={{ ...overlay, zIndex: 1100 }}>
      <div style={{
        background: '#fff', borderRadius: 8, width: 480, padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#92400e' }}>
          ⚠️ Warning
        </div>
        <ul style={{ margin: '0 0 16px 0', paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: '1.8' }}>
          {warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          Do you want to save anyway?
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{ ...btnPrimary, background: '#f59e0b' }}
          >
            Save anyway
          </button>
          <button onClick={onCancel} style={btnSecondary}>
            Go back to Fields
          </button>
        </div>
      </div>
    </div>
  );
}
