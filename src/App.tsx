import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { useSignalHistory } from './hooks/useSignalHistory';
import { calculateSMA } from './utils/ma';
import { detectSignal } from './utils/signal';
import ControlBar from './components/ControlBar';
import KlineChart from './components/KlineChart';
import SignalPanel from './components/SignalPanel';
import SignalHistory from './components/SignalHistory';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Interval } from './types/binance';
import './App.css';

export default function App() {
  const [symbol, setSymbol] = useState('XAUUSDT');
  const [interval, setInterval] = useState<Interval>('1h');
  const [ma1Period, setMa1Period] = useState(20);
  const [ma2Period, setMa2Period] = useState(60);

  const { candles, loading, error, lastPrice } = useBinanceKlines(interval, 100, symbol);
  const ma20 = calculateSMA(candles, ma1Period);
  const ma60 = calculateSMA(candles, ma2Period);
  const signal = detectSignal(candles, ma1Period, ma2Period);
  const { history, clearHistory } = useSignalHistory(signal);

  // Toast + browser notification
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
      new Notification(`KMA ${signal.type} - ${symbol}`, { body: signal.message });
    }
  }, [signal?.time]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const symbolLabel = symbol === 'XAUUSDT' ? '💥 黃金' : symbol === 'BTCUSDT' ? '₿ BTC' : 'Ξ ETH';

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.header}>📈 K均交易法</h1>
          <div style={styles.subHeader}>{symbolLabel} · {interval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}</div>
        </div>
        <span style={styles.liveBadge}>📡 即時</span>
      </div>

      {/* Control Bar */}
      <ControlBar
        symbol={symbol}
        interval={interval}
        ma1Period={ma1Period}
        ma2Period={ma2Period}
        onSymbolChange={setSymbol}
        onIntervalChange={setInterval}
        onMa1Change={setMa1Period}
        onMa2Change={setMa2Period}
      />

      {/* Loading / Error */}
      {loading && (
        <div style={styles.status}>⏳ 載入 {symbol} K線數據中...</div>
      )}
      {error && !loading && (
        <div style={{ ...styles.status, color: '#ff1744' }}>❌ {error}</div>
      )}

      {/* K-line Chart */}
      {!loading && !error && (
        <ErrorBoundary fallback="K線圖載入失敗">
          <KlineChart candles={candles} ma20={ma20} ma60={ma60} signal={signal} />
        </ErrorBoundary>
      )}

      {/* Signal Panel */}
      {!loading && !error && (
        <ErrorBoundary fallback="訊號面板載入失敗">
          <SignalPanel signal={signal} ma20={ma20} ma60={ma60} lastPrice={lastPrice} />
        </ErrorBoundary>
      )}

      {/* Signal History */}
      {history.length > 0 && (
        <div style={{ maxWidth: 700, width: '100%' }}>
          <SignalHistory history={history} />
          <button onClick={clearHistory} style={styles.clearBtn}>
            🗑 清除記錄
          </button>
        </div>
      )}

      <p style={styles.footer}>
        📡 {candles.length} 根K線 · 每10秒更新 · 訊號記錄儲存於本機
      </p>
      <p style={{ ...styles.footer, color: '#1a1a2e' }}>
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
    padding: '16px 12px',
    gap: 12,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 700,
  },
  header: {
    color: '#f0b90b',
    fontFamily: 'monospace',
    fontSize: '1.15rem',
    margin: 0,
  },
  subHeader: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    marginTop: 3,
  },
  liveBadge: {
    background: '#0d3d1f',
    color: '#00c853',
    border: '1px solid #00c853',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  status: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    maxWidth: 700,
    width: '100%',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#333',
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    cursor: 'pointer',
    marginTop: 6,
    padding: '2px 6px',
  },
  footer: {
    color: '#2a2a3e',
    fontSize: '0.72rem',
    fontFamily: 'monospace',
    textAlign: 'center',
    margin: 0,
  },
};
