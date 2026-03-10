import React from 'react';
import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { calculateSMA } from './utils/ma';
import { detectSignal } from './utils/signal';
import SignalPanel from './components/SignalPanel';
import KlineChart from './components/KlineChart';
import './App.css';

export default function App() {
  const { candles, loading, error, lastPrice } = useBinanceKlines('1h', 100);
  const ma20 = calculateSMA(candles, 20);
  const ma60 = calculateSMA(candles, 60);
  const signal = detectSignal(candles);

  // Toast + browser notification on signal
  useEffect(() => {
    if (!signal) return;
    const isLong = signal.type === 'LONG';
    toast(signal.message, {
      icon: isLong ? '🟢' : '🔴',
      style: {
        background: isLong ? '#0d3d1f' : '#3d0d0d',
        color: '#fff',
        border: `1px solid ${isLong ? '#00c853' : '#ff1744'}`,
        fontFamily: 'monospace',
      },
      duration: 10000,
    });
    if (Notification.permission === 'granted') {
      new Notification(`KMA ${signal.type} - XAUUSDT 黃金`, { body: signal.message });
    }
  }, [signal?.time]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  if (loading) return (
    <main style={styles.main}>
      <div style={styles.status}>⏳ 載入 XAUUSDT K線數據中...</div>
    </main>
  );

  if (error) return (
    <main style={styles.main}>
      <div style={{ ...styles.status, color: '#ff1744' }}>❌ {error}</div>
    </main>
  );

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={styles.headerRow}>
        <h1 style={styles.header}>📈 K均交易法 · XAUUSDT 黃金</h1>
        <span style={styles.badge}>📡 即時更新</span>
      </div>

      {/* K-line Chart */}
      <KlineChart
        candles={candles}
        ma20={ma20}
        ma60={ma60}
        signal={signal}
      />

      {/* Signal Panel */}
      <SignalPanel
        signal={signal}
        ma20={ma20}
        ma60={ma60}
        lastPrice={lastPrice}
      />

      <p style={styles.footer}>
        📡 {candles.length} 根K線 · 1小時圖 · 每10秒更新
      </p>
      <p style={{ ...styles.footer, color: '#2a2a3e' }}>
        ⚠️ 僅供參考，非投資建議。投資有風險。
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#0f0f1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    gap: 16,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 700,
    justifyContent: 'space-between',
  },
  header: {
    color: '#f0b90b',
    fontFamily: 'monospace',
    fontSize: '1.2rem',
    margin: 0,
  },
  badge: {
    background: '#0d3d1f',
    color: '#00c853',
    border: '1px solid #00c853',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: '0.72rem',
    fontFamily: 'monospace',
  },
  status: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '1rem',
  },
  footer: {
    color: '#333',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textAlign: 'center',
    margin: 0,
  },
};
