import type { Entity } from '../../../types';
import { Row, input } from '../../shared/dialogStyles';

const TEMPLATES: Record<Entity['type'], string[]> = {
  master:   ['Master entity (Master)', 'Child Master entity (MasterChild)', 'Child Foundling Master entity (MasterFoundlingChild)'],
  detail:   ['Detail entity (Detail)', 'Child Detail entity (DetailChild)', 'Child Foundling Detail entity (DetailFoundlingChild)'],
  external: ['External table'],
  virtual:  ['Virtual Fat'],
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  master:   { bg: '#dcfce7', color: '#16a34a' },
  detail:   { bg: '#dbeafe', color: '#2563eb' },
  external: { bg: '#fef9c3', color: '#ca8a04' },
  virtual:  { bg: '#f3e8ff', color: '#9333ea' },
};

interface Props {
  entity: Entity;
  lockedType: Entity['type'];
  set: <K extends keyof Entity>(k: K, v: Entity[K]) => void;
}

export function MainTab({ entity, set, lockedType }: Props) {
  const templates = TEMPLATES[lockedType] ?? TEMPLATES['master'];
  const tc = TYPE_COLORS[lockedType] ?? TYPE_COLORS['master'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Row label="Name">
        <input style={input} value={entity.name} onChange={(e) => set('name', e.target.value)} autoFocus />
      </Row>
      <Row label="Program">
        <input style={input} value={entity.program} onChange={(e) => set('program', e.target.value.replace(/\s/g, ''))} />
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
            <input
              type="checkbox"
              checked={entity[key as keyof Entity] as boolean}
              onChange={(e) => set(key as keyof Entity, e.target.checked as any)}
            />
            {label}
          </label>
        ))}
      </div>

      {lockedType === 'detail' && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>
            Auto-fields for Detail
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={entity.hasCprownum}
                onChange={(e) => set('hasCprownum', e.target.checked)}
              />
              Add CPROWNUM (row ID, repeated key)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={entity.hasCproword}
                onChange={(e) => set('hasCproword', e.target.checked)}
              />
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
        <textarea
          style={{ ...input, minHeight: 60, resize: 'vertical' }}
          value={entity.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Row>
    </div>
  );
}
