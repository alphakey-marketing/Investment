import React from 'react';
import { SignalEvent } from '../types/binance';

interface Props {
  history: SignalEvent[];
}

function formatTime(unixSecs: number): string {
  return new Date(unixSecs * 1000).toLocaleString('zh-HK', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}

export default function SignalHistory({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>📜 近期訊號記錄</div>
      <div style={styles.list}>
        {history.map((s, i) => (
          <div key={i} style={{
            ...styles.item,
            borderLeft: `3px solid ${s.type === 'LONG' ? '#00c853' : '#ff1744'}`,
          }}>
            <span style={{
              ...styles.tag,
              color: s.type === 'LONG' ? '#00c853' : '#ff1744',
            }}>
              {s.type === 'LONG' ? '🟢 LONG' : '🔴 SHORT'}
            </span>
            <span style={styles.price}>${s.price.toFixed(2)}</span>
            <span style={styles.time}>{formatTime(s.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 10,
    padding: '12px 16px',
    maxWidth: 700,
    width: '100%',
  },
  title: {
    fontSize: '0.75rem',
    color: '#555',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  item: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '6px 10px',
    background: '#0f0f1a',
    borderRadius: 6,
    flexWrap: 'wrap',
  },
  tag: {
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    minWidth: 70,
  },
  price: {
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: '#ccc',
    flex: 1,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    color: '#444',
  },
};
