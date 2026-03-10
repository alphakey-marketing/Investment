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

  const { candles, loading, error, lastPrice } = useBinanceKlines(interval, 100, symbol);
  const ma20 = calculateSMA(candles, ma1Period);
  const ma60 = calculateSMA(candles, ma2Period);
  const signal = detectSignal(candles, ma1Period, ma2Period);
  const { history, clearHistory } = useSignalHistory(signal);
  const { config, saveConfig, sendMessage, testSend, sending, lastStatus } = useTelegram();
  const { trades, addTrade, closeTrade, deleteTrade, clearAll } = useTradeJournal();
  const { account, openPosition, closePosition, resetAccount, pnl: paperPnl, pnlPct: paperPnlPct } = usePaperTrading(addTrade);
  const lastNotifiedRef = useRef<number | null>(null);

  const modeColor = mode === 'LIVE' ? '#f0b90b' : mode === 'PAPER' ? '#29b6f6' : '#ab47bc';
  const symbolLabel = symbol === 'XAUUSDT' ? '💥 Gold' : symbol === 'BTCUSDT' ? '₿ BTC' : 'Ξ ETH';

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

      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.header, color: modeColor }}>{tr('appTitle', lang)}</h1>
          <div style={styles.subHeader}>{symbolLabel} · {interval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{ ...styles.badge, borderColor: modeColor, color: modeColor, background: modeColor+'18' }}>
            {mode === 'LIVE' ? tr('badgeLive',lang) : mode === 'PAPER' ? tr('badgePaper',lang) : tr('badgeBacktest',lang)}
          </span>
          {mode === 'LIVE' && config.enabled && (
            <span style={styles.tgBadge}>{sending ? tr('badgeTGSending',lang) : tr('badgeTG',lang)}</span>
          )}
        </div>
      </div>

      <ModeBar mode={mode} onChange={setMode} lang={lang} onLangChange={setLang} />

      <ControlBar symbol={symbol} interval={interval} ma1Period={ma1Period} ma2Period={ma2Period}
        onSymbolChange={setSymbol} onIntervalChange={setInterval}
        onMa1Change={setMa1Period} onMa2Change={setMa2Period} />

      {loading && <div style={styles.status}>⏳ {tr('loading',lang)} {symbol} {tr('klineData',lang)}</div>}
      {error && !loading && <div style={{ ...styles.status, color:'#ff1744' }}>❌ {error}</div>}

      {!loading && !error && (
        <ErrorBoundary fallback="Chart failed to load">
          <KlineChart candles={candles} ma20={ma20} ma60={ma60} signal={signal} />
        </ErrorBoundary>
      )}

      {/* LIVE */}
      {mode === 'LIVE' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Signal panel failed">
            <SignalPanel signal={signal} ma20={ma20} ma60={ma60} lastPrice={lastPrice} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Calculator failed">
            <PositionCalculator signal={signal} lastPrice={lastPrice} onAddTrade={addTrade} symbol={symbol} lang={lang} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal trades={trades} onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang} />
          </ErrorBoundary>
          <TelegramSettings config={config} onSave={saveConfig} onTest={testSend} sending={sending} lastStatus={lastStatus} />
          {history.length > 0 && (
            <div style={{ maxWidth:700, width:'100%' }}>
              <SignalHistory history={history} />
              <button onClick={clearHistory} style={styles.clearBtn}>{tr('clearSignals',lang)}</button>
            </div>
          )}
        </>
      )}

      {/* PAPER */}
      {mode === 'PAPER' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Paper panel failed">
            <PaperTradingPanel account={account} signal={signal} lastPrice={lastPrice}
              symbol={symbol} pnl={paperPnl} pnlPct={paperPnlPct} lang={lang}
              onOpen={openPosition} onClose={closePosition} onReset={resetAccount} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal trades={trades.filter(t => t.notes.includes('🧸') || t.notes.includes('Paper') || t.notes.includes('模擬'))} onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang} />
          </ErrorBoundary>
        </>
      )}

      {/* BACKTEST */}
      {mode === 'BACKTEST' && (
        <ErrorBoundary fallback="Backtest failed">
          <BacktestPanel candles={candles} ma1Period={ma1Period} ma2Period={ma2Period} lang={lang} />
        </ErrorBoundary>
      )}

      <p style={styles.footer}>📡 {candles.length} {tr('footerKlines',lang)}</p>
      <p style={{ ...styles.footer, color:'#111' }}>⚠️ {lang==='ZH' ? '僅供參考，非投資建議。' : 'For reference only. Not financial advice.'}</p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { minHeight:'100vh', background:'#0f0f1a', display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 12px', gap:12 },
  headerRow: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', width:'100%', maxWidth:700 },
  header: { fontFamily:'monospace', fontSize:'1.15rem', margin:0 },
  subHeader: { color:'#555', fontFamily:'monospace', fontSize:'0.75rem', marginTop:3 },
  badge: { border:'1px solid', padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontFamily:'monospace' },
  tgBadge: { background:'#0d2a3e', color:'#29b6f6', border:'1px solid #29b6f6', padding:'2px 8px', borderRadius:20, fontSize:'0.68rem', fontFamily:'monospace' },
  status: { color:'#888', fontFamily:'monospace', fontSize:'0.9rem', maxWidth:700, width:'100%' },
  clearBtn: { background:'none', border:'none', color:'#333', fontFamily:'monospace', fontSize:'0.72rem', cursor:'pointer', marginTop:6, padding:'2px 6px' },
  footer: { color:'#2a2a3e', fontSize:'0.72rem', fontFamily:'monospace', textAlign:'center', margin:0 },
};
