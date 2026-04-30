import { useState, useEffect } from 'react';
import type { Entity, Field } from '../types';
import { makeEntity, today, cprownum, cproword } from '../utils/helpers';
import { useStore } from '../store';
import { FieldDialog } from './FieldDialog';
import { LinksTab } from './LinksTab';
import { validateEntity } from '../utils/validation';

interface Props {
  entityId: string | null;
  defaultType?: Entity['type'];
  onClose: () => void;
}

const TABS = ['Main', 'Fields', 'Database', 'Data properties', 'Links'] as const;
type Tab = typeof TABS[number];

const TEMPLATES: Record<Entity['type'], string[]> = {
  master:   ['Master entity (Master)', 'Child Master entity (MasterChild)', 'Child Foundling Master entity (MasterFoundlingChild)'],
  detail:   ['Detail entity (Detail)', 'Child Detail entity (DetailChild)', 'Child Foundling Detail entity (DetailFoundlingChild)'],
  external: ['External table'],
  virtual:  ['Virtual Fat'],
};

export function EntityDialog({ entityId, defaultType = 'master', onClose }: Props) {
  const { plan, upsertEntity } = useStore();
  const existing = entityId ? plan?.entities.find((e) => e.id === entityId) : null;
  const lockedType: Entity['type'] = existing?.type ?? defaultType;

  const [entity, setEntity] = useState<Entity>(() =>
    existing
      ? { ...existing, fields: existing.fields.map((f) => ({ ...f })) }
      : makeEntity(lockedType)
  );
  const [activeTab, setActiveTab] = useState<Tab>('Main');
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);

  useEffect(() => {
    setEntity((prev) => {
      let fields = prev.fields.filter((f) => f.name !== 'CPROWNUM' && f.name !== 'CPROWORD');
      if (prev.type === 'detail') {
        if (prev.hasCprownum) fields = [cprownum(), ...fields];
        if (prev.hasCproword) {
          const idx = fields.findIndex((f) => f.name === 'CPROWNUM');
          const insert = cproword();
          if (idx >= 0) fields.splice(idx + 1, 0, insert);
          else fields = [insert, ...fields];
        }
      }
      return { ...prev, fields };
    });
  }, [entity.hasCprownum, entity.hasCproword, entity.type]);

  const set = <K extends keyof Entity>(key: K, value: Entity[K]) =>
    setEntity((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const { blocking, warnings } = validateEntity(entity, plan?.entities || []);

    if (blocking.length > 0) {
      setValidationErrors(blocking);
      setValidationWarnings([]); // Clear warnings if there are blocking errors
      setActiveTab('Main');
      return;
    }
    if (warnings.length > 0) {
      setValidationErrors([]);
      setValidationWarnings(warnings);
      setShowWarningConfirm(true);
      return;
    }
    doSave();
  };

  const doSave = () => {
    upsertEntity({ ...entity, revised: today() });
    onClose();
  };

  const openFieldCreate = () => { setEditingFieldId(null); setFieldDialogOpen(true); };
  const openFieldEdit = (id: string) => { setEditingFieldId(id); setFieldDialogOpen(true); };

  const saveField = (field: Field) => {
    setEntity((prev) => {
      const exists = prev.fields.find((f) => f.id === field.id);
      const fields = exists
        ? prev.fields.map((f) => (f.id === field.id ? field : f))
        : [...prev.fields, field];
      return { ...prev, fields };
    });
    setFieldDialogOpen(false);
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const deleteField = (id: string) => {
    setEntity((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== id) }));
    setValidationErrors([]);
  };

  const isAuto = (name: string) => name === 'CPROWNUM' || name === 'CPROWORD';
  const typeLabel = lockedType.charAt(0).toUpperCase() + lockedType.slice(1);

  return (
    <>
      <div style={overlay}>
        <div style={dialog}>
          <div style={titleBar}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {existing ? 'Edit' : 'New'} {typeLabel} File definition
            </span>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>

          <div style={tabBar}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ ...tabBtn, ...(activeTab === t ? tabActive : {}) }}>
                {t}
              </button>
            ))}
          </div>

          {validationErrors.length > 0 && (
            <div style={errorBanner}>
              <strong>⛔ Cannot save:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div style={tabContent}>
            {activeTab === 'Main' && <MainTab entity={entity} set={set} lockedType={lockedType} />}
            {activeTab === 'Fields' && (
              <FieldsTab entity={entity} onAdd={openFieldCreate} onEdit={openFieldEdit}
                onDelete={deleteField} isAuto={isAuto} />
            )}
            {activeTab === 'Database' && <DatabaseTab entity={entity} set={set} />}
            {activeTab === 'Data properties' && (
              <div style={{ color: '#64748b', fontSize: 13 }}>Data properties configuration coming soon.</div>
            )}
            {activeTab === 'Links' && <LinksTab entity={entity} />}
          </div>

          <div style={footer}>
            <button onClick={handleSave} style={btnPrimary}>OK</button>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      </div>

      {showWarningConfirm && (
        <div style={{ ...overlay, zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 8, width: 480, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: '#92400e' }}>⚠️ Warning</div>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: 18, fontSize: 13, color: '#374151', lineHeight: '1.8' }}>
              {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Do you want to save anyway?</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setShowWarningConfirm(false); doSave(); }}
                style={{ ...btnPrimary, background: '#f59e0b' }}>
                Save anyway
              </button>
              <button onClick={() => { setShowWarningConfirm(false); setActiveTab('Fields'); }}
                style={btnSecondary}>
                Go back to Fields
              </button>
            </div>
          </div>
        </div>
      )}

      {fieldDialogOpen && (
        <FieldDialog
          field={editingFieldId ? entity.fields.find((f) => f.id === editingFieldId) ?? null : null}
          entityType={lockedType}
          onSave={saveField}
          onClose={() => setFieldDialogOpen(false)}
        />
      )}
    </>
  );
}

function MainTab({ entity, set, lockedType }: {
  entity: Entity;
  set: <K extends keyof Entity>(k: K, v: Entity[K]) => void;
  lockedType: Entity['type'];
}) {
  const templates = TEMPLATES[lockedType] ?? TEMPLATES['master'];
  const typeColors: Record<string, { bg: string; color: string }> = {
    master:   { bg: '#dcfce7', color: '#16a34a' },
    detail:   { bg: '#dbeafe', color: '#2563eb' },
    external: { bg: '#fef9c3', color: '#ca8a04' },
    virtual:  { bg: '#f3e8ff', color: '#9333ea' },
  };
  const tc = typeColors[lockedType] ?? typeColors['master'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row label="Name">
        <input style={input} value={entity.name} onChange={(e) => set('name', e.target.value)} autoFocus />
      </Row>
      <Row label="Program">
        <input style={input} value={entity.program} onChange={(e) => set('program', e.target.value)} />
      </Row>
      <Row label="Template">
        <select style={input} value={entity.template} onChange={(e) => set('template', e.target.value)}>
          {templates.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Row>
      <Row label="Type">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 4, fontSize: 12, fontWeight: 700,
          background: tc.bg, color: tc.color, border: '1px solid currentColor',
        }}>
          {lockedType.toUpperCase()}
          <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.7 }}>(fixed at creation)</span>
        </div>
      </Row>

      <div style={{ display: 'flex', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
        {([
          ['isPrototype', 'Prototype'],
          ['isExternallyLinkable', 'Externally linkable'],
          ['hasMenu', 'Menu'],
          ['isExternalTable', 'External table'],
          ['isPublic', 'Public'],
          ['isOffline', 'Offline entity'],
        ] as [string, string][]).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <input type="checkbox"
              checked={entity[key as keyof Entity] as boolean}
              onChange={(e) => set(key as keyof Entity, e.target.checked as any)} />
            {label}
          </label>
        ))}
      </div>

      {lockedType === 'detail' && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Auto-fields for Detail</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <input type="checkbox" checked={entity.hasCprownum}
                onChange={(e) => set('hasCprownum', e.target.checked)} />
              Add CPROWNUM (row ID, repeated key)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <input type="checkbox" checked={entity.hasCproword}
                onChange={(e) => set('hasCproword', e.target.checked)} />
              Add CPROWORD (sort order, repeated)
            </label>
          </div>
        </div>
      )}

      <Row label="Created">
        <input style={{ ...input, background: '#f8fafc', color: '#64748b' }} value={entity.created} readOnly />
      </Row>
      <Row label="Revised">
        <input style={{ ...input, background: '#f8fafc', color: '#64748b' }} value={entity.revised} readOnly />
      </Row>
      <Row label="Notes">
        <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }}
          value={entity.notes} onChange={(e) => set('notes', e.target.value)} />
      </Row>
    </div>
  );
}

function FieldsTab({ entity, onAdd, onEdit, onDelete, isAuto }: {
  entity: Entity;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isAuto: (name: string) => boolean;
}) {
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
                <td colSpan={10} style={{ ...td, textAlign: 'center', color: '#ef4444', padding: '16px 8px', fontStyle: 'italic' }}>
                  ⛔ No fields defined — at least one field is required before saving
                </td>
              </tr>
            ) : (
              entity.fields.map((f) => (
                <tr key={f.id}
                  style={{ cursor: isAuto(f.name) ? 'default' : 'pointer', background: isAuto(f.name) ? '#f8fafc' : undefined }}
                  onDoubleClick={() => !isAuto(f.name) && onEdit(f.id)}
                  title={isAuto(f.name) ? 'Auto-generated — toggle from Main tab' : 'Double-click to edit'}>
                  <td style={{ ...td, color: isAuto(f.name) ? '#94a3b8' : undefined, fontStyle: isAuto(f.name) ? 'italic' : undefined }}>{f.name}</td>
                  <td style={td}>{f.type}</td>
                  <td style={td}>{f.length}</td>
                  <td style={td}>{f.decimals}</td>
                  <td style={td}>{f.repeated ? <span style={{ color: '#2563eb', fontWeight: 700 }}>R</span> : ''}</td>
                  <td style={td}>{f.key ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>{f.key}</span> : ''}</td>
                  <td style={td}>{f.multilang ? '✓' : ''}</td>
                  <td style={td}>{f.description}</td>
                  <td style={td}>{f.note}</td>
                  <td style={td}>
                    {!isAuto(f.name) && (
                      <button onClick={() => onDelete(f.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12 }}>✕</button>
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
        <button style={{ ...btnSecondary, fontSize: 12 }} onClick={() => alert('Import – coming soon')}>Import…</button>
      </div>
    </div>
  );
}

function DatabaseTab({ entity, set }: { entity: Entity; set: <K extends keyof Entity>(k: K, v: Entity[K]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row label="Data name">
        <input style={input} value={entity.dataName || ''} onChange={(e) => set('dataName', e.target.value)} />
      </Row>
      <Row label="Physical name">
        <input 
          style={input} 
          value={entity.physicalName || ''} 
          onChange={(e) => set('physicalName', e.target.value)} 
        />
      </Row>
      <div style={{ display: 'flex', gap: 20 }}>
        {['Company name', 'Keep historical data', 'Update timestamp'].map((l) => (
          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <input type="checkbox" disabled /> {l}
          </label>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Indexes are managed automatically based on key fields.</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <label style={{ minWidth: 110, fontSize: 13, color: '#374151', paddingTop: 6 }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const dialog: React.CSSProperties = { background: '#fff', borderRadius: 8, width: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const titleBar: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: '8px 8px 0 0' };
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748b' };
const tabBar: React.CSSProperties = { display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 12px' };
const tabBtn: React.CSSProperties = { padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', borderBottom: '2px solid transparent', marginBottom: -1 };
const tabActive: React.CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb', fontWeight: 600 };
const tabContent: React.CSSProperties = { padding: 16, overflowY: 'auto', flex: 1 };
const footer: React.CSSProperties = { padding: '10px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 };
const input: React.CSSProperties = { width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const th: React.CSSProperties = { padding: '5px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '4px 8px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' };
const btnPrimary: React.CSSProperties = { padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnSecondary: React.CSSProperties = { padding: '6px 16px', background: '#f1f5f9', color: '#374151', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
const errorBanner: React.CSSProperties = { background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '8px 16px', fontSize: 13, color: '#dc2626' };
