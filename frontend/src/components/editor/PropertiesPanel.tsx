import type { ProtoComponent } from '../../types';

interface Props {
  component: ProtoComponent | null;
  onUpdate: (patch: Partial<ProtoComponent>) => void;
  onDelete: () => void;
}

export function PropertiesPanel({ component, onUpdate, onDelete }: Props) {
  if (!component) {
    return (
      <div style={{
        width: 220, minWidth: 220, background: '#fff',
        borderLeft: '1px solid #e3e6df',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 11, color: '#d1d5db', textAlign: 'center', fontStyle: 'italic' }}>
          Seleziona un elemento<br />per modificarne le proprietà
        </div>
      </div>
    );
  }

  const isField = component.type === 'field';

  return (
    <div style={{
      width: 220, minWidth: 220, background: '#fff',
      borderLeft: '1px solid #e3e6df',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #e3e6df',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>
          {component.type}
        </span>
        <button
          onClick={onDelete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#d1d5db', fontSize: 14, padding: '0 2px', lineHeight: 1,
          }}
          title="Rimuovi elemento"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
        >
          🗑
        </button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {/* Label */}
        <Section title="Etichetta">
          <Field label="Label">
            <input
              value={component.label ?? ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              style={inputSt}
              placeholder={component.fieldName || component.text || ''}
            />
          </Field>
          {(component.type === 'label' || component.type === 'button') && (
            <Field label="Testo">
              <input
                value={component.text ?? ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                style={inputSt}
                placeholder="Contenuto"
              />
            </Field>
          )}
          {isField && (
            <Field label="Placeholder">
              <input
                value={component.placeholder ?? ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                style={inputSt}
              />
            </Field>
          )}
        </Section>

        {/* Position & Size */}
        <Section title="Posizione e dimensioni">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Field label="X">
              <input type="number" value={Math.round(component.x)} onChange={(e) => onUpdate({ x: Number(e.target.value) })} style={inputSt} />
            </Field>
            <Field label="Y">
              <input type="number" value={Math.round(component.y)} onChange={(e) => onUpdate({ y: Number(e.target.value) })} style={inputSt} />
            </Field>
            <Field label="W">
              <input type="number" value={Math.round(component.width)} onChange={(e) => onUpdate({ width: Number(e.target.value) })} style={inputSt} />
            </Field>
            <Field label="H">
              <input type="number" value={Math.round(component.height)} onChange={(e) => onUpdate({ height: Number(e.target.value) })} style={inputSt} />
            </Field>
          </div>
        </Section>

        {/* Behavior */}
        {isField && (
          <Section title="Comportamento">
            <ToggleRow
              label="Obbligatorio"
              value={!!component.required}
              onChange={(v) => onUpdate({ required: v })}
            />
            <ToggleRow
              label="Visibile"
              value={component.visible !== false}
              onChange={(v) => onUpdate({ visible: v })}
            />
            <ToggleRow
              label="Sola lettura"
              value={!!component.readonly}
              onChange={(v) => onUpdate({ readonly: v })}
            />
          </Section>
        )}

        {/* Style */}
        <Section title="Stile">
          <Field label="Font size">
            <input
              type="number" min={8} max={32}
              value={component.style?.fontSize ?? 12}
              onChange={(e) => onUpdate({ style: { ...component.style, fontSize: Number(e.target.value) } })}
              style={inputSt}
            />
          </Field>
          <Field label="Colore testo">
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="color"
                value={component.style?.color ?? '#111827'}
                onChange={(e) => onUpdate({ style: { ...component.style, color: e.target.value } })}
                style={{ width: 28, height: 28, padding: 0, border: '1px solid #e3e6df', borderRadius: 4, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{component.style?.color ?? '#111827'}</span>
            </div>
          </Field>
          <Field label="Grassetto">
            <ToggleRow
              label=""
              value={component.style?.fontWeight === 'bold'}
              onChange={(v) => onUpdate({ style: { ...component.style, fontWeight: v ? 'bold' : 'normal' } })}
            />
          </Field>
          {component.type === 'label' && (
            <Field label="Allineamento">
              <select
                value={component.style?.textAlign ?? 'left'}
                onChange={(e) => onUpdate({ style: { ...component.style, textAlign: e.target.value as any } })}
                style={{ ...inputSt, padding: '3px 4px' }}
              >
                <option value="left">Sinistra</option>
                <option value="center">Centro</option>
                <option value="right">Destra</option>
              </select>
            </Field>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
      {label && <span style={{ fontSize: 10, color: '#6b7280' }}>{label}</span>}
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      {label && <span style={{ fontSize: 11, color: '#374151' }}>{label}</span>}
      <button
        onClick={() => onChange(!value)}
        style={{
          padding: '2px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
          background: value ? '#dcfce7' : '#f3f4f6',
          color: value ? '#16a34a' : '#6b7280',
          transition: 'all 0.15s',
        }}
      >
        {value ? 'Sì' : 'No'}
      </button>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '4px 7px',
  border: '1px solid #e3e6df', borderRadius: 4,
  fontSize: 11, fontFamily: 'inherit', color: '#111827',
  outline: 'none', background: '#fafafa',
  boxSizing: 'border-box',
};
