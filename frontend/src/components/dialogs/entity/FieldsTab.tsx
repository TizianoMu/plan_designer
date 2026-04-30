import type { Entity } from '../../../types';
import { th, td, btnPrimary, btnSecondary } from '../../shared/dialogStyles';

interface Props {
  entity: Entity;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isAuto: (name: string) => boolean;
}

export function FieldsTab({ entity, onAdd, onEdit, onDelete, isAuto }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Name', 'Type', 'Len', 'Dec', 'Repeat', 'Key', 'Multilang', 'Description', 'Note', ''].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entity.fields.length === 0 ? (
              <tr>
                <td colSpan={10} style={{
                  ...td, textAlign: 'center', color: '#ef4444',
                  padding: '16px 8px', fontStyle: 'italic',
                }}>
                  ⛔ No fields defined — at least one field is required before saving
                </td>
              </tr>
            ) : (
              entity.fields.map((f) => (
                <tr
                  key={f.id}
                  style={{
                    cursor: isAuto(f.name) ? 'default' : 'pointer',
                    background: isAuto(f.name) ? '#f8fafc' : undefined,
                  }}
                  onDoubleClick={() => !isAuto(f.name) && onEdit(f.id)}
                  title={isAuto(f.name) ? 'Auto-generated — toggle from Main tab' : 'Double-click to edit'}
                >
                  <td style={{
                    ...td,
                    color: isAuto(f.name) ? '#94a3b8' : undefined,
                    fontStyle: isAuto(f.name) ? 'italic' : undefined,
                  }}>
                    {f.name}
                  </td>
                  <td style={td}>{f.type}</td>
                  <td style={td}>{f.length}</td>
                  <td style={td}>{f.decimals}</td>
                  <td style={td}>
                    {f.repeated ? <span style={{ color: '#2563eb', fontWeight: 700 }}>R</span> : ''}
                  </td>
                  <td style={td}>
                    {f.key ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>{f.key}</span> : ''}
                  </td>
                  <td style={td}>{f.multilang ? '✓' : ''}</td>
                  <td style={td}>{f.description}</td>
                  <td style={td}>{f.note}</td>
                  <td style={td}>
                    {!isAuto(f.name) && (
                      <button
                        onClick={() => onDelete(f.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}
                        title="Delete field"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAdd} style={btnPrimary}>+ Add Field</button>
        <button
          style={{ ...btnSecondary, fontSize: 12 }}
          onClick={() => alert('Import – coming soon')}
        >
          Import…
        </button>
      </div>
    </div>
  );
}
