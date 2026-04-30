import { useState, useEffect } from 'react';
import type { Entity, Field } from '../../../types';
import { makeEntity, today, cprownum, cproword } from '../../../utils/helpers';
import { useStore } from '../../../store';
import { validateEntity } from '../../../utils/validation';
import { FieldDialog } from '../FieldDialog';
import { LinksTab } from '../../shared/LinksTab';
import { MainTab } from './MainTab';
import { FieldsTab } from './FieldsTab';
import { DatabaseTab } from './DatabaseTab';
import { WarningConfirmDialog } from './WarningConfirmDialog';
import {
  overlay, dialog, titleBar, closeBtn,
  tabBar, tabBtn, tabActive, tabContent,
  footer, btnPrimary, btnSecondary, errorBanner,
} from '../../shared/dialogStyles';

interface Props {
  entityId: string | null;
  defaultType?: Entity['type'];
  onClose: () => void;
}

const TABS = ['Main', 'Fields', 'Database', 'Data properties', 'Links'] as const;
type Tab = typeof TABS[number];

export function EntityDialog({ entityId, defaultType = 'master', onClose }: Props) {
  const { plan, upsertEntity } = useStore();
  const existing = entityId ? plan?.entities.find((e) => e.id === entityId) : null;
  const lockedType: Entity['type'] = existing?.type ?? defaultType;

  const [entity, setEntity] = useState<Entity>(() =>
    existing
      ? { 
          ...existing, 
          dataName: existing.dataName || '', // Fallback per vecchi record
          fields: existing.fields.map((f) => ({ ...f })) 
        }
      : makeEntity(lockedType)
  );
  const [activeTab, setActiveTab] = useState<Tab>('Main');
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);

  // Sync auto-fields when CPROWNUM/CPROWORD flags change
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
      setValidationWarnings([]);
      // Se l'errore riguarda il dataName, andiamo al tab Database
      if (blocking.some(e => e.toLowerCase().includes('data name'))) setActiveTab('Database');
      else if (blocking.some(e => e.toLowerCase().includes('name') || e.toLowerCase().includes('program'))) setActiveTab('Main');
      else setActiveTab('Fields');
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
          {/* Title bar */}
          <div style={titleBar}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {existing ? 'Edit' : 'New'} {typeLabel} File definition
            </span>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={tabBar}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ ...tabBtn, ...(activeTab === t ? tabActive : {}) }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Validation error banner */}
          {validationErrors.length > 0 && (
            <div style={errorBanner}>
              <strong>⛔ Cannot save:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Tab content */}
          <div style={tabContent}>
            {activeTab === 'Main' && (
              <MainTab entity={entity} set={set} lockedType={lockedType} />
            )}
            {activeTab === 'Fields' && (
              <FieldsTab
                entity={entity}
                onAdd={openFieldCreate}
                onEdit={openFieldEdit}
                onDelete={deleteField}
                isAuto={isAuto}
              />
            )}
            {activeTab === 'Database' && (
              <DatabaseTab entity={entity} set={set} />
            )}
            {activeTab === 'Data properties' && (
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Data properties configuration coming soon.
              </div>
            )}
            {activeTab === 'Links' && (
              <LinksTab entity={entity} />
            )}
          </div>

          {/* Footer */}
          <div style={footer}>
            <button onClick={handleSave} style={btnPrimary}>OK</button>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Warning confirmation */}
      {showWarningConfirm && (
        <WarningConfirmDialog
          warnings={validationWarnings}
          onConfirm={() => { setShowWarningConfirm(false); doSave(); }}
          onCancel={() => { setShowWarningConfirm(false); setActiveTab('Fields'); }}
        />
      )}

      {/* Field editor */}
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
