import React from 'react';
import { SignalEvent } from '../types/binance';
import { MAPoint } from '../types/binance';

interface Props {
  signal: SignalEvent | null;
  ma20: MAPoint[];
  ma60: MAPoint[];
  lastPrice: number | null;
}

export default function SignalPanel({ signal, ma20, ma60, lastPrice }: Props) {
  const latestMA20 = ma20[ma20.length - 1]?.value ?? null;
  const latestMA60 = ma60[ma60.length - 1]?.value ?? null;

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>📊 XAUUSDT 黃金 K均訊號</h2>

      <div style={styles.row}>
        <div style={styles.stat}>
          <span style={styles.label}>現價</span>
          <span style={{ ...styles.value, color: '#f0b90b' }}>
            ${lastPrice?.toFixed(2) ?? '---'}
          </span>
        </div>
        <div style={styles.stat}>
          <span style={styles.label}>MA20</span>
          <span style={styles.value}>${latestMA20?.toFixed(2) ?? '---'}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.label}>MA60</span>
          <span style={styles.value}>${latestMA60?.toFixed(2) ?? '---'}</span>
        </div>
      </div>

      <div style={styles.signalBox}>
        {signal ? (
          <div style={{
            ...styles.signal,
            background: signal.type === 'LONG' ? '#0d3d1f' : '#3d0d0d',
            borderColor: signal.type === 'LONG' ? '#00c853' : '#ff1744',
          }}>
            <span style={{ fontSize: '1.4rem' }}>
              {signal.type === 'LONG' ? '🟢' : '🔴'}
            </span>
            <div>
              <div style={{ fontWeight: 'bold', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                {signal.type} 入場訊號
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: 4 }}>
                {signal.message}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                止蝕建議: ${(signal.type === 'LONG'
                  ? signal.price * 0.99
                  : signal.price * 1.01
                ).toFixed(2)} | 止盈目標: ${(signal.type === 'LONG'
                  ? signal.price * 1.03
                  : signal.price * 0.97
                ).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.noSignal}>⏳ 等待訊號中... 監察MA結構</div>
        )}
      </div>

      <div style={styles.rule}>
        📖 K均規則：線上多，線下空 ｜ 到位就動，不到位不動 ｜ 盈虧比 3:1
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#1a1a2e',
    borderRadius: 12,
    padding: '20px 24px',
    color: '#fff',
    fontFamily: 'monospace',
    maxWidth: 680,
    margin: '0 auto',
  },
  title: {
    margin: '0 0 16px',
    fontSize: '1.2rem',
    borderBottom: '1px solid #333',
    paddingBottom: 10,
  },
  row: {
    display: 'flex',
    gap: 24,
    marginBottom: 16,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: '0.75rem',
    color: '#888',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  signalBox: {
    minHeight: 80,
    marginBottom: 16,
  },
  signal: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid',
  },
  noSignal: {
    padding: '12px 16px',
    background: '#222',
    borderRadius: 8,
    color: '#888',
    fontSize: '0.9rem',
  },
  rule: {
    fontSize: '0.75rem',
    color: '#555',
    borderTop: '1px solid #333',
    paddingTop: 10,
  },
};
