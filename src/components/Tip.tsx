import React, { useState } from 'react';
export default function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 3 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e35', color: '#ddd', padding: '8px 12px', borderRadius: 8,
          fontSize: '0.78rem', whiteSpace: 'normal', zIndex: 200, border: '1px solid #444',
          lineHeight: 1.6, maxWidth: 240, textAlign: 'center', boxShadow: '0 4px 16px #0008',
        }}>{text}</span>
      )}
    </span>
  );
}
