import React from 'react';
import { AppMode } from '../types/mode';

interface Props {
  mode: AppMode;
  onChange: (m: AppMode) => void;
}

export default function ModeBar({ mode, onChange }: Props) {
  const modes: { value: AppMode; label: string; desc: string; color: string }[] = [
    { value: 'LIVE',     label: 'Live',     desc: 'Real-time signals', color: '#f0b90b' },
    { value: 'BACKTEST', label: 'Backtest', desc: 'Historical replay',  color: '#ab47bc' },
  ];

  return (
    <div style={styles.bar}>
      <span style={styles.title}>Mode</span>
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          style={{
            ...styles.btn,
            ...(mode === m.value
              ? { ...styles.active, borderColor: m.color, color: m.color, background: m.color + '18' }
              : {}),
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

const styles: Record<string, React.CSSProperties> = {};