import type { Entity, ProtoComponentType, PrototypeLayout } from '../../types';

interface Props {
  entity: Entity;
  layout: PrototypeLayout | undefined;
}

const COMPONENT_PALETTE: { type: ProtoComponentType; icon: string; label: string; defaultText?: string }[] = [
  { type: 'label',     icon: 'T',  label: 'Label',     defaultText: 'Testo' },
  { type: 'separator', icon: '—',  label: 'Separator', defaultText: '' },
  { type: 'button',    icon: '⬜', label: 'Button',    defaultText: 'Pulsante' },
  { type: 'image',     icon: '🖼', label: 'Image',     defaultText: 'Immagine' },
];

const FIELD_TYPE_LABEL: Record<string, string> = {
  C: 'Testo', N: 'Num', D: 'Data', M: 'Memo', B: 'Bool', DT: 'DtTm',
};

export function PrototypeToolbox({ entity, layout }: Props) {
  const usedFieldNames = new Set(
    (layout?.components ?? []).filter((c) => c.fieldName).map((c) => c.fieldName!)
  );

  const onDragStart = (
    e: React.DragEvent,
    type: ProtoComponentType,
    fieldName?: string,
    defaultText?: string
  ) => {
    e.dataTransfer.setData('proto/type', type);
    if (fieldName) e.dataTransfer.setData('proto/fieldName', fieldName);
    if (defaultText !== undefined) e.dataTransfer.setData('proto/text', defaultText);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={{
      width: 200, minWidth: 200, background: '#fff',
      borderRight: '1px solid #e3e6df',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Entity fields */}
      <div style={{ padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
        Campi entità
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 6px 8px' }}>
        {entity.fields.map((field) => {
          const inCanvas = usedFieldNames.has(field.name);
          return (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => onDragStart(e, 'field', field.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', margin: '1px 0',
                borderRadius: 5, cursor: 'grab',
                border: '1px solid #e3e6df',
                background: inCanvas ? '#f0fdf4' : '#fafafa',
                opacity: 1,
                userSelect: 'none',
              }}
              title={`Trascina nel canvas: ${field.name}`}
            >
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: inCanvas ? '#16a34a' : '#6b7280',
                background: inCanvas ? '#dcfce7' : '#f3f4f6',
                padding: '1px 4px', borderRadius: 3, flexShrink: 0,
              }}>
                {FIELD_TYPE_LABEL[field.type] ?? field.type}
              </span>
              <span style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {field.description || field.name}
              </span>
              {inCanvas && <span style={{ fontSize: 9, color: '#16a34a', flexShrink: 0 }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Component palette */}
      <div style={{ borderTop: '1px solid #e3e6df', padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
        Componenti
      </div>
      <div style={{ padding: '0 6px 10px', flexShrink: 0 }}>
        {COMPONENT_PALETTE.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type, undefined, item.defaultText)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 8px', margin: '1px 0',
              borderRadius: 5, cursor: 'grab',
              border: '1px solid #e3e6df',
              background: '#fafafa',
              userSelect: 'none',
            }}
            title={`Aggiungi ${item.label}`}
          >
            <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: 11, color: '#374151' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
