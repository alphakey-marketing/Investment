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
import { Lang, tr } from './i18n';
import './App.css';

export default function App() {
  const [mode, setMode] = useState<AppMode>('LIVE');
  const [lang, setLang] = useState<Lang>('ZH');
  const [symbol, setSymbol] = useState('XAUUSDT');
  const [interval, setInterval] = useState<Interval>('1h');
  const [ma1Period, setMa1Period] = useState(20);
  const [ma2Period, setMa2Period] = useState(60);
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('onboard_dismissed'));

  const { candles, loading, error, lastPrice } = useBinanceKlines(interval, 100, symbol);
  const ma20 = calculateSMA(candles, ma1Period);
  const ma60 = calculateSMA(candles, ma2Period);
  const signal = detectSignal(candles, ma1Period, ma2Period);
  const { history, clearHistory } = useSignalHistory(signal);
  const { config, saveConfig, sendMessage, testSend, sending, lastStatus } = useTelegram();
  const { trades, addTrade, closeTrade, deleteTrade, clearAll } = useTradeJournal();
  const { account, openPosition, closePosition, resetAccount, pnl: paperPnl, pnlPct: paperPnlPct } = usePaperTrading(addTrade);
  const lastNotifiedRef = useRef<number | null>(null);
  const isEN = lang === 'EN';

  const modeColor = mode === 'LIVE' ? '#f0b90b' : mode === 'PAPER' ? '#29b6f6' : '#ab47bc';
  const symbolLabel = symbol === 'XAUUSDT' ? '💥 ' + (isEN ? 'Gold' : '黃金')
    : symbol === 'BTCUSDT' ? '₿ BTC' : 'Ξ ETH';

  const dismissOnboard = () => {
    localStorage.setItem('onboard_dismissed', '1');
    setShowOnboard(false);
  };

  useEffect(() => {
    if (mode !== 'LIVE' || !signal) return;
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
      `${isLong ? '🟢' : '🔴'} <b>KMA ${signal.type} Entry Signal</b>`,
      `💰 <b>Asset:</b> ${symbol}  📊 <b>Price:</b> $${signal.price.toFixed(2)}`,
      `🛑 <b>S/L:</b> $${(isLong ? signal.price*0.99 : signal.price*1.01).toFixed(2)}  🎯 <b>T/P:</b> $${(isLong ? signal.price*1.03 : signal.price*0.97).toFixed(2)}`,
      `⏰ ${new Date(signal.time*1000).toLocaleString('en-HK')}`,
      `<i>⚠️ For reference only</i>`,
    ].join('\n');
    sendMessage(tgMsg);
  }, [signal?.time, mode]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* ── Onboarding banner ── */}
      {showOnboard && (
        <div style={styles.onboard}>
          <div style={styles.onboardInner}>
            <div style={styles.onboardIcon}>👋</div>
            <div style={{ flex: 1 }}>
              <div style={styles.onboardTitle}>
                {isEN ? 'Welcome to MA Signal Trader!' : '歡迎使用 K均訊號系統！'}
              </div>
              <div style={styles.onboardDesc}>
                {isEN
                  ? 'New here? Start with 📖 Beginner Guide inside the Signal Panel below. Then try 🧸 Paper Trading to practice without real money.'
                  : '第一次使用？請先展開下方「📖 新手指南」了解各功能。然後試試「🧸 模擬盤」模式，用虛擬資金練習，零風險！'}
              </div>
              <div style={styles.onboardSteps}>
                {(isEN
                  ? ['1️⃣ Read the Beginner Guide in the Signal Panel', '2️⃣ Switch to Paper Trading to practice for free', '3️⃣ Run a Backtest to see how signals performed historically']
                  : ['1️⃣ 展開訊號面板的「新手指南」', '2️⃣ 切換至「模擬盤」模式免費練習', '3️⃣ 使用「回歸測試」查看歷史訊號表現']
                ).map((s, i) => <div key={i} style={styles.onboardStep}>{s}</div>)}
              </div>
            </div>
            <button onClick={dismissOnboard} style={styles.onboardClose} title={isEN ? 'Dismiss' : '關閉'}>✕</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.header, color: modeColor }}>{tr('appTitle', lang)}</h1>
          <div style={styles.subHeader}>
            {symbolLabel} · {interval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}
            {signal && <span style={{ marginLeft: 8, color: signal.type === 'LONG' ? '#00c853' : '#ff1744', fontSize: '0.7rem' }}>● {isEN ? 'Signal Active' : '有訊號'}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ ...styles.badge, borderColor: modeColor, color: modeColor, background: modeColor + '18' }}>
            {mode === 'LIVE' ? tr('badgeLive', lang) : mode === 'PAPER' ? tr('badgePaper', lang) : tr('badgeBacktest', lang)}
          </span>
          {mode === 'LIVE' && config.enabled && (
            <span style={styles.tgBadge}>{sending ? tr('badgeTGSending', lang) : tr('badgeTG', lang)}</span>
          )}
        </div>
      </div>

      {/* ── Mode + Lang Bar ── */}
      <ModeBar mode={mode} onChange={setMode} lang={lang} onLangChange={setLang} />

      {/* ── Controls ── */}
      <ControlBar symbol={symbol} interval={interval} ma1Period={ma1Period} ma2Period={ma2Period}
        lang={lang}
        onSymbolChange={setSymbol} onIntervalChange={setInterval}
        onMa1Change={setMa1Period} onMa2Change={setMa2Period} />

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={styles.statusCard}>
          <span style={{ fontSize: '1.2rem' }}>⏳</span>
          <span>{tr('loading', lang)} {symbol} {tr('klineData', lang)}</span>
        </div>
      )}
      {error && !loading && (
        <div style={{ ...styles.statusCard, borderColor: '#ff1744', color: '#ff5252' }}>
          <span>❌ {error}</span>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>{isEN ? 'Check your internet connection.' : '請檢查網絡連接。'}</span>
        </div>
      )}

      {!loading && !error && (
        <ErrorBoundary fallback={isEN ? 'Chart failed to load' : '圖表載入失敗'}>
          <KlineChart candles={candles} ma20={ma20} ma60={ma60} signal={signal} />
        </ErrorBoundary>
      )}

      {/* ── LIVE mode ── */}
      {mode === 'LIVE' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Signal panel failed">
            <SignalPanel signal={signal} ma20={ma20} ma60={ma60} lastPrice={lastPrice} lang={lang} candles={candles} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Calculator failed">
            <PositionCalculator signal={signal} lastPrice={lastPrice} onAddTrade={addTrade} symbol={symbol} lang={lang} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal trades={trades} onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang} />
          </ErrorBoundary>
          <TelegramSettings config={config} onSave={saveConfig} onTest={testSend} sending={sending} lastStatus={lastStatus} />
          {history.length > 0 && (
            <div style={{ maxWidth: 700, width: '100%' }}>
              <SignalHistory history={history} />
              <button onClick={clearHistory} style={styles.clearBtn}>{tr('clearSignals', lang)}</button>
            </div>
          )}
        </>
      )}

      {/* ── PAPER mode ── */}
      {mode === 'PAPER' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Paper panel failed">
            <PaperTradingPanel account={account} signal={signal} lastPrice={lastPrice}
              symbol={symbol} pnl={paperPnl} pnlPct={paperPnlPct} lang={lang}
              onOpen={openPosition} onClose={closePosition} onReset={resetAccount} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal
              trades={trades.filter(t => t.notes?.includes('🧸') || t.notes?.includes('Paper') || t.notes?.includes('模擬'))}
              onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang} />
          </ErrorBoundary>
        </>
      )}

      {/* ── BACKTEST mode ── */}
      {mode === 'BACKTEST' && (
        <ErrorBoundary fallback="Backtest failed">
          <BacktestPanel candles={candles} ma1Period={ma1Period} ma2Period={ma2Period} lang={lang} />
        </ErrorBoundary>
      )}

      <p style={styles.footer}>
        📡 {candles.length} {tr('footerKlines', lang)}
        <span style={{ margin: '0 8px', color: '#1e1e35' }}>·</span>
        {isEN ? '⚠️ For reference only. Not financial advice.' : '⚠️ 僅供參考，非投資建議。'}
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px', gap: 14, fontFamily: 'monospace' },
  onboard: { background: 'linear-gradient(135deg, #1a1a35, #12122a)', border: '1px solid #f0b90b55', borderRadius: 14, padding: '18px 20px', maxWidth: 700, width: '100%', boxShadow: '0 4px 24px #f0b90b18' },
  onboardInner: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  onboardIcon: { fontSize: '2rem', flexShrink: 0 },
  onboardTitle: { fontSize: '0.95rem', fontWeight: 'bold', color: '#f0b90b', marginBottom: 6 },
  onboardDesc: { fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6, marginBottom: 10 },
  onboardSteps: { display: 'flex', flexDirection: 'column', gap: 4 },
  onboardStep: { fontSize: '0.78rem', color: '#888', background: '#ffffff08', border: '1px solid #2a2a3e', borderRadius: 6, padding: '4px 10px' },
  onboardClose: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: 4 },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', maxWidth: 700 },
  header: { fontFamily: 'monospace', fontSize: '1.15rem', margin: 0 },
  subHeader: { color: '#555', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 },
  badge: { border: '1px solid', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontFamily: 'monospace' },
  tgBadge: { background: '#0d2a3e', color: '#29b6f6', border: '1px solid #29b6f6', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontFamily: 'monospace' },
  statusCard: { background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, padding: '14px 18px', maxWidth: 700, width: '100%', color: '#888', fontFamily: 'monospace', fontSize: '0.85rem', display: 'flex', gap: 10, alignItems: 'center' },
  clearBtn: { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginTop: 6, padding: '2px 6px' },
  footer: { color: '#2a2a3e', fontSize: '0.72rem', fontFamily: 'monospace', textAlign: 'center', margin: 0, marginTop: 8 },
};
