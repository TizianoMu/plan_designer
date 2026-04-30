import type { Entity } from '../../types';

interface Props {
  entity: Entity;
}

export function LinksTab({ entity }: Props) {
  if (entity.links.length === 0) {
    return (
      <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', paddingTop: 8 }}>
        No links defined. Links are created automatically when you add a relation on the canvas.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            {['Target Entity', 'Type', 'Local Field', 'Foreign Field'].map((h) => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entity.links.map((link) =>
            link.fields.map((lf, i) => (
              <tr key={`${link.id}-${i}`}>
                <td style={td}>{i === 0 ? link.targetEntityName : ''}</td>
                <td style={td}>{i === 0 ? link.relationType : ''}</td>
                <td style={td}>{lf.localField}</td>
                <td style={td}>{lf.foreignField}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '5px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11,
  color: '#475569', borderBottom: '1px solid #e2e8f0',
};
const td: React.CSSProperties = {
  padding: '4px 8px', fontSize: 12, borderBottom: '1px solid #f1f5f9',
};
