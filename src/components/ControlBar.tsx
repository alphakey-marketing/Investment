import React from 'react';
import { Interval } from '../types/binance';

const SYMBOLS = ['XAUUSDT', 'BTCUSDT', 'ETHUSDT'];
const INTERVALS: { label: string; value: Interval }[] = [
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
];

interface Props {
  symbol: string;
  interval: Interval;
  ma1Period: number;
  ma2Period: number;
  onSymbolChange: (s: string) => void;
  onIntervalChange: (i: Interval) => void;
  onMa1Change: (n: number) => void;
  onMa2Change: (n: number) => void;
}

export default function ControlBar({
  symbol, interval, ma1Period, ma2Period,
  onSymbolChange, onIntervalChange, onMa1Change, onMa2Change,
}: Props) {
  return (
    <div style={styles.bar}>
      {/* Symbol */}
      <div style={styles.group}>
        <span style={styles.label}>資產</span>
        <div style={styles.btnRow}>
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => onSymbolChange(s)}
              style={{ ...styles.btn, ...(symbol === s ? styles.active : {}) }}
            >
              {s === 'XAUUSDT' ? '💥 黃金' : s === 'BTCUSDT' ? '₿ BTC' : 'Ξ ETH'}
            </button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div style={styles.group}>
        <span style={styles.label}>時間框</span>
        <div style={styles.btnRow}>
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => onIntervalChange(iv.value)}
              style={{ ...styles.btn, ...(interval === iv.value ? styles.active : {}) }}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* MA Settings */}
      <div style={styles.group}>
        <span style={styles.label}>MA設定</span>
        <div style={styles.btnRow}>
          <div style={styles.maInput}>
            <span style={styles.maLabel}>MA1</span>
            <input
              type="number"
              value={ma1Period}
              min={5} max={200}
              onChange={(e) => onMa1Change(Number(e.target.value))}
              style={styles.input}
            />
          </div>
          <div style={styles.maInput}>
            <span style={styles.maLabel}>MA2</span>
            <input
              type="number"
              value={ma2Period}
              min={5} max={200}
              onChange={(e) => onMa2Change(Number(e.target.value))}
              style={styles.input}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    maxWidth: 700,
    width: '100%',
    alignItems: 'flex-start',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.68rem',
    color: '#555',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btnRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  btn: {
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    color: '#888',
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    transition: 'all 0.15s',
  },
  active: {
    background: '#16213e',
    border: '1px solid #f0b90b',
    color: '#f0b90b',
  },
  maInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  maLabel: {
    fontSize: '0.72rem',
    color: '#666',
    fontFamily: 'monospace',
  },
  input: {
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    color: '#f0b90b',
    padding: '3px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    width: 52,
    outline: 'none',
  },
};
