import React from 'react';
interface Props { label: string; value: string; color?: string; tooltip?: string; }
export default function StatBox({ label, value, color, tooltip }: Props) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '9px 11px', border: '1px solid #1a1a2e' }} title={tooltip}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}
