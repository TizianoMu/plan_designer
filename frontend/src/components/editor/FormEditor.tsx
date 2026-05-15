import { useState, useCallback } from 'react';
import { useStore } from '../../store';
import type { Entity, Field, FieldType } from '../../types';
import { FIELD_TYPE_LABELS } from '../../types';
import { genId } from '../../utils/helpers';

interface Props {
  entityId: string;
}

const ENTITY_TYPE_COLOR: Record<Entity['type'], string> = {
  master: '#16a34a',
  detail: '#2563eb',
  external: '#d97706',
  virtual: '#7c3aed',
};

const ENTITY_TYPE_BG: Record<Entity['type'], string> = {
  master: '#f0fdf4',
  detail: '#eff6ff',
  external: '#fffbeb',
  virtual: '#faf5ff',
};

const FIELD_TYPES: FieldType[] = ['C', 'N', 'D', 'M', 'B', 'DT'];

function makeBlankField(): Field {
  return {
    id: genId('fld'),
    name: '',
    type: 'C',
    length: 50,
    decimals: 0,
    repeated: false,
    key: 0,
    multilang: false,
    description: '',
    note: '',
    check: '',
    defaultValue: '',
    allowNulls: true,
    dataSensibility: 'Not defined',
    dataRiskLevel: '0 - No risks',
    identifiesPerson: false,
  };
}

export function FormEditor({ entityId }: Props) {
  const { plan, upsertEntity } = useStore();
  const entity = plan?.entities.find((e) => e.id === entityId);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const updateField = useCallback(
    (fieldId: string, patch: Partial<Field>) => {
      if (!entity) return;
      const fields = entity.fields.map((f) => f.id === fieldId ? { ...f, ...patch } : f);
      upsertEntity({ ...entity, fields });
    },
    [entity, upsertEntity]
  );

  const addField = useCallback(() => {
    if (!entity) return;
    upsertEntity({ ...entity, fields: [...entity.fields, makeBlankField()] });
  }, [entity, upsertEntity]);

  const removeField = useCallback(
    (fieldId: string) => {
      if (!entity) return;
      upsertEntity({ ...entity, fields: entity.fields.filter((f) => f.id !== fieldId) });
    },
    [entity, upsertEntity]
  );

  const moveField = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!entity) return;
      const fields = [...entity.fields];
      const [moved] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, moved);
      upsertEntity({ ...entity, fields });
    },
    [entity, upsertEntity]
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (!entity) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        Entità non trovata
      </div>
    );
  }

  const typeColor = ENTITY_TYPE_COLOR[entity.type];
  const typeBg = ENTITY_TYPE_BG[entity.type];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px', height: 44, background: '#fff',
        borderBottom: '1px solid #e3e6df', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: typeColor,
            background: typeBg, padding: '2px 8px', borderRadius: 10,
            border: `1px solid ${typeColor}30`, textTransform: 'capitalize',
          }}>
            {entity.type}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {entity.name || entity.program}
          </span>
          {entity.program && entity.name && entity.program !== entity.name && (
            <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
              {entity.program}
            </span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {entity.fields.length} campo{entity.fields.length !== 1 ? 'i' : ''}
        </span>
        <button
          onClick={handleSave}
          style={{
            padding: '5px 16px',
            background: saved ? '#f0fdf4' : '#111827',
            border: saved ? '1px solid #bbf7d0' : 'none',
            color: saved ? '#16a34a' : '#fff',
            borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Salvato' : 'Salva modifiche'}
        </button>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 1fr 100px 80px 60px 32px',
        gap: 0, padding: '0 16px',
        background: '#f1f3f0', borderBottom: '1px solid #e3e6df',
        flexShrink: 0,
      }}>
        {['', 'Nome campo', 'Label / Descrizione', 'Tipo', 'Lunghezza', 'Required', ''].map((h, i) => (
          <div key={i} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {h}
          </div>
        ))}
      </div>

      {/* Fields list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {entity.fields.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>
            Nessun campo. Clicca "+ Aggiungi campo" per iniziare.
          </div>
        )}

        {entity.fields.map((field, index) => {
          const isDragging = dragIndex === index;
          const isOver = dragOverIndex === index;
          return (
            <div
              key={field.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) moveField(dragIndex, index);
                setDragIndex(null); setDragOverIndex(null);
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 1fr 100px 80px 60px 32px',
                gap: 0, margin: '2px 8px',
                background: isDragging ? '#eff6ff' : (isOver ? '#f0fdf4' : '#fff'),
                borderRadius: 6,
                border: isOver ? '1px solid #86efac' : '1px solid #f3f4f6',
                opacity: isDragging ? 0.5 : 1,
                transition: 'background 0.1s, border 0.1s',
              }}
            >
              {/* Drag handle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'grab', color: '#d1d5db', fontSize: 14, padding: '0 4px',
              }}
                title="Trascina per riordinare"
              >
                ⠿
              </div>

              {/* Field name */}
              <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <input
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                  placeholder="nome_campo"
                  style={inputStyle}
                />
              </div>

              {/* Description / label */}
              <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <input
                  value={field.description}
                  onChange={(e) => updateField(field.id, { description: e.target.value })}
                  placeholder="Descrizione / label"
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                  style={selectStyle}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Length */}
              <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  value={field.length}
                  onChange={(e) => updateField(field.id, { length: Number(e.target.value) })}
                  min={0}
                  style={{ ...inputStyle, width: '100%' }}
                  disabled={field.type === 'B' || field.type === 'D' || field.type === 'DT'}
                />
              </div>

              {/* Required (allowNulls inverted) */}
              <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => updateField(field.id, { allowNulls: !field.allowNulls })}
                  title={field.allowNulls ? 'Opzionale — clicca per rendere obbligatorio' : 'Obbligatorio — clicca per rendere opzionale'}
                  style={{
                    padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                    background: field.allowNulls ? '#f3f4f6' : '#dcfce7',
                    color: field.allowNulls ? '#6b7280' : '#16a34a',
                    transition: 'all 0.15s',
                  }}
                >
                  {field.allowNulls ? 'No' : 'Sì'}
                </button>
              </div>

              {/* Delete */}
              <div style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => removeField(field.id)}
                  title="Rimuovi campo"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#d1d5db', fontSize: 16, padding: 0, lineHeight: 1,
                    borderRadius: 3,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#d1d5db'; }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — add field */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid #e3e6df',
        background: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={addField}
          style={{
            padding: '6px 16px', background: '#fff', border: '1px dashed #d1d5db',
            color: '#6b7280', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
            (e.currentTarget as HTMLElement).style.color = '#2563eb';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db';
            (e.currentTarget as HTMLElement).style.color = '#6b7280';
          }}
        >
          + Aggiungi campo
        </button>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>
          Trascina le righe per riordinare i campi
        </span>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '4px 7px',
  border: '1px solid #e3e6df', borderRadius: 4,
  fontSize: 12, fontFamily: 'inherit', color: '#111827',
  outline: 'none', background: '#fafafa',
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '4px 6px',
  border: '1px solid #e3e6df', borderRadius: 4,
  fontSize: 12, fontFamily: 'inherit', color: '#111827',
  outline: 'none', background: '#fafafa',
};
