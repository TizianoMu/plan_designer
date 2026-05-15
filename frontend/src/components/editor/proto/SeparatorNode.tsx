import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ProtoComponent } from '../../../types';

export const SeparatorNode = memo(({ data, selected }: NodeProps) => {
  const comp = data as unknown as ProtoComponent;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      border: selected ? '1px dashed #2563eb' : '1px dashed transparent',
      borderRadius: 2,
      boxShadow: selected ? '0 0 0 1px #bfdbfe' : 'none',
    }}>
      <NodeResizer
        minWidth={60}
        minHeight={16}
        isVisible={selected}
        lineStyle={{ border: '1px solid #2563eb' }}
        handleStyle={{ width: 8, height: 8, background: '#2563eb', border: 'none', borderRadius: 2 }}
      />
      {comp.text && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#6b7280',
          textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 4, paddingLeft: 2,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
          {comp.text}
        </div>
      )}
      <div style={{
        height: 1,
        background: comp.style?.borderColor ?? '#e5e7eb',
      }} />
    </div>
  );
});

SeparatorNode.displayName = 'SeparatorNode';
