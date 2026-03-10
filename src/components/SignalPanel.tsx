import React from 'react';
import { SignalEvent, MAPoint } from '../types/binance';

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
      <h2 style={styles.title}>📊 XAUUSDT 黃金 K均訊號面板</h2>

      <div style={styles.row}>
        <div style={styles.stat}>
          <span style={styles.label}>現價 (USDT)</span>
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
        <div style={styles.stat}>
          <span style={styles.label}>趨勢</span>
          <span style={{
            ...styles.value,
            color: lastPrice && latestMA20
              ? lastPrice > latestMA20 ? '#00c853' : '#ff1744'
              : '#888'
          }}>
            {lastPrice && latestMA20
              ? lastPrice > latestMA20 ? '⬆ 多頭' : '⬇ 空頭'
              : '---'}
          </span>
        </div>
      </div>

      <div style={styles.signalBox}>
        {signal ? (
          <div style={{
            ...styles.signal,
            background: signal.type === 'LONG' ? '#0d3d1f' : '#3d0d0d',
            borderColor: signal.type === 'LONG' ? '#00c853' : '#ff1744',
          }}>
            <span style={{ fontSize: '1.8rem' }}>
              {signal.type === 'LONG' ? '🟢' : '🔴'}
            </span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                {signal.type} 入場訊號!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ddd', marginTop: 4 }}>
                {signal.message}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 6, display: 'flex', gap: 16 }}>
                <span>🛑 止蝕: ${(signal.type === 'LONG'
                  ? signal.price * 0.99
                  : signal.price * 1.01).toFixed(2)}</span>
                <span>🎯 止盈: ${(signal.type === 'LONG'
                  ? signal.price * 1.03
                  : signal.price * 0.97).toFixed(2)}</span>
                <span>📊 盈虧比: 3:1</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.noSignal}>
            ⏳ 等待K均訊號中... 監察價格近MA新高低結構
          </div>
        )}
      </div>

      <div style={styles.rule}>
        📖 K均規則: 線上多 ・ 線下空 ｜ 到位就動 ｜ 盈虧比 3:1
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: '#1a1a2e', borderRadius: 12, padding: '20px 24px', color: '#fff', fontFamily: 'monospace', maxWidth: 700, width: '100%' },
  title: { margin: '0 0 16px', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: 10 },
  row: { display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' },
  stat: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 },
  label: { fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: '1.05rem', fontWeight: 'bold', color: '#fff' },
  signalBox: { minHeight: 80, marginBottom: 16 },
  signal: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 8, border: '1px solid' },
  noSignal: { padding: '14px 16px', background: '#222', borderRadius: 8, color: '#666', fontSize: '0.9rem' },
  rule: { fontSize: '0.72rem', color: '#444', borderTop: '1px solid #222', paddingTop: 10 },
};
