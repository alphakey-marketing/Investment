import React, { useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useBinanceKlines } from './hooks/useBinanceKlines';
import { useSignalHistory } from './hooks/useSignalHistory';
import { useTelegram } from './hooks/useTelegram';
import { useTradeJournal } from './hooks/useTradeJournal';
import { usePaperTrading } from './hooks/usePaperTrading';
import { calculateSMA } from './utils/ma';
import { detectSignal } from './utils/signal';
import ModeBar from './components/ModeBar';
import ControlBar from './components/ControlBar';
import KlineChart from './components/KlineChart';
import SignalPanel from './components/SignalPanel';
import SignalHistory from './components/SignalHistory';
import TelegramSettings from './components/TelegramSettings';
import PositionCalculator from './components/PositionCalculator';
import TradeJournal from './components/TradeJournal';
import PaperTradingPanel from './components/PaperTradingPanel';
import BacktestPanel from './components/BacktestPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Interval } from './types/binance';
import { AppMode } from './types/mode';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<AppMode>('LIVE');
  const [symbol, setSymbol] = useState('XAUUSDT');
  const [interval, setInterval] = useState<Interval>('1h');
  const [ma1Period, setMa1Period] = useState(20);
  const [ma2Period, setMa2Period] = useState(60);

  const { candles, loading, error, lastPrice } = useBinanceKlines(interval, 100, symbol);
  const ma20 = calculateSMA(candles, ma1Period);
  const ma60 = calculateSMA(candles, ma2Period);
  const signal = detectSignal(candles, ma1Period, ma2Period);
  const { history, clearHistory } = useSignalHistory(signal);
  const { config, saveConfig, sendMessage, testSend, sending, lastStatus } = useTelegram();
  const { trades, addTrade, closeTrade, deleteTrade, clearAll } = useTradeJournal();
  const { account, openPosition, closePosition, resetAccount, pnl: paperPnl, pnlPct: paperPnlPct } = usePaperTrading(addTrade);
  const lastNotifiedRef = useRef<number | null>(null);

  const symbolLabel = symbol === 'XAUUSDT' ? '💥 黃金' : symbol === 'BTCUSDT' ? '₿ BTC' : 'Ξ ETH';
  const modeColor = mode === 'LIVE' ? '#f0b90b' : mode === 'PAPER' ? '#29b6f6' : '#ab47bc';
  const modeBorder = `1px solid ${modeColor}40`;

  // Live signal alerts (only in LIVE mode)
  useEffect(() => {
    if (mode !== 'LIVE') return;
    if (!signal) return;
    if (lastNotifiedRef.current === signal.time) return;
    lastNotifiedRef.current = signal.time;
    const isLong = signal.type === 'LONG';
    toast(signal.message, {
      icon: isLong ? '🟢' : '🔴',
      style: { background: isLong ? '#0d3d1f' : '#3d0d0d', color: '#fff', border: `1px solid ${isLong ? '#00c853' : '#ff1744'}`, fontFamily: 'monospace' },
      duration: 12000,
    });
    if (Notification.permission === 'granted') new Notification(`KMA ${signal.type} — ${symbol}`, { body: signal.message });
    const tgMsg = [
      `${isLong ? '🟢' : '🔴'} <b>KMA ${signal.type} 入場訊號</b>`,
      `💰 <b>資產:</b> ${symbol}  📊 <b>價格:</b> $${signal.price.toFixed(2)}`,
      `🛑 <b>止蝕:</b> $${(isLong ? signal.price*0.99 : signal.price*1.01).toFixed(2)}  🎯 <b>止盈:</b> $${(isLong ? signal.price*1.03 : signal.price*0.97).toFixed(2)}`,
      `⏰ ${new Date(signal.time*1000).toLocaleString('zh-HK')}`,
      `<i>⚠️ 僅供參考</i>`,
    ].join('\n');
    sendMessage(tgMsg);
  }, [signal?.time, mode]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.header, color: modeColor }}>📈 K均交易法</h1>
          <div style={styles.subHeader}>{symbolLabel} · {interval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ ...styles.liveBadge, borderColor: modeColor, color: modeColor, background: modeColor + '18' }}>
            {mode === 'LIVE' ? '📡 即時' : mode === 'PAPER' ? '🧸 模擬' : '🔍 回湋'}
          </span>
          {mode === 'LIVE' && config.enabled && (
            <span style={styles.tgBadge}>{sending ? '⏳ TG...' : '📨 TG開啟'}</span>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      <ModeBar mode={mode} onChange={setMode} />

      {/* Control Bar */}
      <ControlBar symbol={symbol} interval={interval} ma1Period={ma1Period} ma2Period={ma2Period}
        onSymbolChange={setSymbol} onIntervalChange={setInterval}
        onMa1Change={setMa1Period} onMa2Change={setMa2Period} />

      {/* Loading / Error */}
      {loading && <div style={styles.status}>⏳ 載入 {symbol} K線數據中...</div>}
      {error && !loading && <div style={{ ...styles.status, color: '#ff1744' }}>❌ {error}</div>}

      {/* Chart (all modes) */}
      {!loading && !error && (
        <ErrorBoundary fallback="K線圖載入失敗">
          <KlineChart candles={candles} ma20={ma20} ma60={ma60} signal={signal} />
        </ErrorBoundary>
      )}

      {/* ─── LIVE MODE ─── */}
      {mode === 'LIVE' && !loading && !error && (
        <>
          <ErrorBoundary fallback="訊號面板載入失敗">
            <SignalPanel signal={signal} ma20={ma20} ma60={ma60} lastPrice={lastPrice} />
          </ErrorBoundary>
          <ErrorBoundary fallback="倉位計算器載入失敗">
            <PositionCalculator signal={signal} lastPrice={lastPrice} onAddTrade={addTrade} symbol={symbol} />
          </ErrorBoundary>
          <ErrorBoundary fallback="交易記錄載入失敗">
            <TradeJournal trades={trades} onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} />
          </ErrorBoundary>
          <TelegramSettings config={config} onSave={saveConfig} onTest={testSend} sending={sending} lastStatus={lastStatus} />
          {history.length > 0 && (
            <div style={{ maxWidth: 700, width: '100%' }}>
              <SignalHistory history={history} />
              <button onClick={clearHistory} style={styles.clearBtn}>🗑 清除訊號記錄</button>
            </div>
          )}
        </>
      )}

      {/* ─── PAPER MODE ─── */}
      {mode === 'PAPER' && !loading && !error && (
        <>
          <ErrorBoundary fallback="模擬盤載入失敗">
            <PaperTradingPanel
              account={account} signal={signal} lastPrice={lastPrice}
              symbol={symbol} pnl={paperPnl} pnlPct={paperPnlPct}
              onOpen={openPosition} onClose={closePosition} onReset={resetAccount}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback="交易記錄載入失敗">
            <TradeJournal trades={trades.filter(t => t.notes.includes('🧸'))} onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} />
          </ErrorBoundary>
        </>
      )}

      {/* ─── BACKTEST MODE ─── */}
      {mode === 'BACKTEST' && (
        <ErrorBoundary fallback="回湋載入失敗">
          <BacktestPanel candles={candles} ma1Period={ma1Period} ma2Period={ma2Period} />
        </ErrorBoundary>
      )}

      <p style={styles.footer}>📡 {candles.length} 根K線 · 每10秒更新</p>
      <p style={{ ...styles.footer, color: '#111' }}>⚠️ 僅供參考，非投資建議。</p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px', gap: 12 },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', maxWidth: 700 },
  header: { fontFamily: 'monospace', fontSize: '1.15rem', margin: 0 },
  subHeader: { color: '#555', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: 3 },
  liveBadge: { border: '1px solid', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontFamily: 'monospace' },
  tgBadge: { background: '#0d2a3e', color: '#29b6f6', border: '1px solid #29b6f6', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontFamily: 'monospace' },
  status: { color: '#888', fontFamily: 'monospace', fontSize: '0.9rem', maxWidth: 700, width: '100%' },
  clearBtn: { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginTop: 6, padding: '2px 6px' },
  footer: { color: '#2a2a3e', fontSize: '0.72rem', fontFamily: 'monospace', textAlign: 'center', margin: 0 },
};
