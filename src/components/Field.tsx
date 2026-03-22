import React from 'react';
interface Props { label: string; hint?: string; children: React.ReactNode; }
export default function Field({ label, hint, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '0.65rem', color: '#333', fontFamily: 'monospace', lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}
