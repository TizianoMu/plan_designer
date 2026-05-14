// Shared style constants reused across dialog components

export const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
export const dialog: React.CSSProperties = {
  background: '#fff', borderRadius: 8, width: 760, height: 560, maxHeight: '90vh',
  display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
export const titleBar: React.CSSProperties = {
  padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc', borderRadius: '8px 8px 0 0',
};
export const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b',
};
export const tabBar: React.CSSProperties = {
  display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 12px',
};
export const tabBtn: React.CSSProperties = {
  padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
  fontSize: 13, color: '#64748b', borderBottom: '2px solid transparent', marginBottom: -1,
};
export const tabActive: React.CSSProperties = {
  color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600,
};
export const tabContent: React.CSSProperties = {
  padding: 16, overflowY: 'auto', flex: 1,
};
export const footer: React.CSSProperties = {
  padding: '10px 16px', borderTop: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'flex-end', gap: 8,
};
export const input: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 4,
  fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
};
export const th: React.CSSProperties = {
  padding: '5px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11,
  color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
};
export const td: React.CSSProperties = {
  padding: '4px 8px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
};
export const btnPrimary: React.CSSProperties = {
  padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
export const btnSecondary: React.CSSProperties = {
  padding: '6px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #cbd5e1',
  borderRadius: 4, cursor: 'pointer', fontSize: 13,
};
export const errorBanner: React.CSSProperties = {
  background: '#fef2f2', borderBottom: '1px solid #fecaca',
  padding: '8px 16px', fontSize: 13, color: '#dc2626',
};

// Reusable row layout for label + input
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <label style={{ minWidth: 110, fontSize: 13, color: '#374151', paddingTop: 6 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
