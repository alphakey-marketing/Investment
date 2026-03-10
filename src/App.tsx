import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { calculateSMA } from './utils/ma';
import { detectSignal } from './utils/signal';
import SignalPanel from './components/SignalPanel';
import './App.css';

export default function App() {
  const { candles, loading, error, lastPrice } = useBinanceKlines('1h', 100);

  const ma20 = calculateSMA(candles, 20);
  const ma60 = calculateSMA(candles, 60);
  const signal = detectSignal(candles);

  // Toast notification when signal fires
  useEffect(() => {
    if (signal) {
      const isLong = signal.type === 'LONG';
      toast(signal.message, {
        icon: isLong ? '🟢' : '🔴',
        style: {
          background: isLong ? '#0d3d1f' : '#3d0d0d',
          color: '#fff',
          border: `1px solid ${isLong ? '#00c853' : '#ff1744'}`,
        },
        duration: 8000,
      });
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(`KMA ${signal.type} Signal - XAUUSDT`, {
          body: signal.message,
        });
      }
    }
  }, [signal?.time]);

  // Request notification permission on load
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.loading}>⏳ 正在載入 XAUUSDT K線數據...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.main}>
        <div style={styles.error}>❌ 錯誤: {error}</div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />
      <h1 style={styles.header}>📈 K均交易法 · XAUUSDT 黃金訊號</h1>
      <SignalPanel
        signal={signal}
        ma20={ma20}
        ma60={ma60}
        lastPrice={lastPrice}
      />
      <div style={styles.info}>
        <p>📡 即時監察中 · {candles.length} 根K線已載入 · 1小時圖</p>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>⚠️ 僅供參考，非投資建議。投資有風險，請自行評估。</p>
      </div>
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
    justifyContent: 'center',
    padding: '24px 16px',
    gap: 20,
  },
  header: {
    color: '#f0b90b',
    fontFamily: 'monospace',
    fontSize: '1.4rem',
    margin: 0,
  },
  loading: {
    color: '#fff',
    fontSize: '1.2rem',
    fontFamily: 'monospace',
  },
  error: {
    color: '#ff1744',
    fontFamily: 'monospace',
    fontSize: '1rem',
  },
  info: {
    color: '#666',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
};
