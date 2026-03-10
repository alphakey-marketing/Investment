import React from 'react';
import { AppMode } from '../types/mode';

interface Props {
  mode: AppMode;
  onChange: (m: AppMode) => void;
}

const MODES: { value: AppMode; label: string; desc: string; color: string }[] = [
  { value: 'LIVE', label: '🟡 實盤', desc: '即時市場訊號', color: '#f0b90b' },
  { value: 'PAPER', label: '🧸 模擬盤', desc: '號碼買賣練習', color: '#29b6f6' },
  { value: 'BACKTEST', label: '🔍 回湋', desc: '歷史訊號湋試', color: '#ab47bc' },
];

export default function ModeBar({ mode, onChange }: Props) {
  return (
    <div style={styles.bar}>
      <span style={styles.title}>模式</span>
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          style={{
            ...styles.btn,
            ...(mode === m.value ? { ...styles.active, borderColor: m.color, color: m.color, background: m.color + '18' } : {}),
          }}
        >
          {m.label}
          <span style={{ fontSize: '0.65rem', color: mode === m.value ? m.color : '#444', display: 'block', marginTop: 1 }}>
            {m.desc}
          </span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10,
    padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center',
    maxWidth: 700, width: '100%', flexWrap: 'wrap',
  },
  title: { fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 },
  btn: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#555',
    padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.4,
    flex: 1, minWidth: 90,
  },
  active: { fontWeight: 'bold' },
};
