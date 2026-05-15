import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ProtoComponent } from '../../../types';

const FIELD_TYPE_INPUT: Record<string, string> = {
  N: 'number', D: 'date', DT: 'datetime-local', B: 'checkbox', M: 'textarea', C: 'text',
};

export const FieldComponentNode = memo(({ data, selected }: NodeProps) => {
  const comp = data as unknown as ProtoComponent & { fieldType?: string };
  const inputType = FIELD_TYPE_INPUT[comp.fieldType ?? 'C'] ?? 'text';
  const isCheckbox = inputType === 'checkbox';
  const isMemo = inputType === 'textarea';

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: isCheckbox ? 'center' : 'stretch',
      gap: 0,
      border: `1px solid ${selected ? '#2563eb' : '#d1d5db'}`,
      borderRadius: 4,
      background: '#fff',
      boxShadow: selected ? '0 0 0 2px #bfdbfe' : 'none',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <NodeResizer
        minWidth={120}
        minHeight={30}
        isVisible={selected}
        lineStyle={{ border: '1px solid #2563eb' }}
        handleStyle={{ width: 8, height: 8, background: '#2563eb', border: 'none', borderRadius: 2 }}
      />

      {/* Label */}
      <div style={{
        minWidth: 100, maxWidth: 140, padding: '0 8px',
        display: 'flex', alignItems: 'center',
        background: '#f8f9fa', borderRight: '1px solid #e5e7eb',
        fontSize: 11, fontWeight: 500, color: '#374151',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flexShrink: 0,
      }}
        title={comp.label || comp.fieldName}
      >
        {comp.label || comp.fieldName}
        {comp.required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </div>

      {/* Input mock */}
      <div style={{ flex: 1, padding: isCheckbox ? '0 8px' : '0', display: 'flex', alignItems: 'center' }}>
        {isCheckbox ? (
          <div style={{ width: 16, height: 16, border: '2px solid #d1d5db', borderRadius: 3, background: '#fff' }} />
        ) : isMemo ? (
          <div style={{
            flex: 1, height: '100%', padding: '4px 8px',
            fontSize: 11, color: '#9ca3af', background: '#fafafa',
            display: 'flex', alignItems: 'flex-start', paddingTop: 6,
          }}>
            {comp.placeholder || '...'}
          </div>
        ) : (
          <div style={{
            flex: 1, height: '100%', padding: '0 8px',
            fontSize: 11, color: '#9ca3af', background: '#fafafa',
            display: 'flex', alignItems: 'center',
          }}>
            {comp.placeholder || comp.fieldName || '...'}
          </div>
        )}
      </div>

      {/* Field name tag */}
      {comp.fieldName && (
        <div style={{
          position: 'absolute', bottom: 1, right: 3,
          fontSize: 8, color: '#d1d5db', fontFamily: 'monospace', pointerEvents: 'none',
        }}>
          {comp.fieldName}
        </div>
      )}
    </div>
  );
});

FieldComponentNode.displayName = 'FieldComponentNode';
