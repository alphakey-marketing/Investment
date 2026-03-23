import React, { useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useYahooKlines } from './hooks/useYahooKlines';
import { useAppState } from './hooks/useAppState';
import { useSignalHistory } from './hooks/useSignalHistory';
import { useTelegram } from './hooks/useTelegram';
import { useEmail } from './hooks/useEmail';
import { useTradeJournal } from './hooks/useTradeJournal';
import { calculateSMA } from './utils/ma';
import { detectSignal } from './utils/signal';
import { getMATrend } from './utils/maTrend';
import { findSwingPoints, getLatestSwings } from './utils/swingPoints';
import { isHKTradingHours, isHKWeekend } from './utils/hkSession';
import ModeBar from './components/ModeBar';
import ControlBar from './components/ControlBar';
import KlineChart from './components/KlineChart';
import SignalPanel from './components/SignalPanel';
import SignalHistory from './components/SignalHistory';
import TelegramSettings from './components/TelegramSettings';
import EmailSettings from './components/EmailSettings';
import PositionCalculator from './components/PositionCalculator';
import TradeJournal from './components/TradeJournal';
import BacktestPanel from './components/BacktestPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HKTicker } from './types/hkmarket';
import {
  STALE_THRESHOLD_MS,
  SIGNAL_TOAST_DURATION_MS,
} from './constants';
import './App.css';

export default function App() {
  const [state, actions] = useAppState();
  const { mode, symbol, klineInterval, ma1Period, ma2Period, ma3Period, now } = state;
  const { setMode, setSymbol, setKlineInterval, setMa1Period, setMa2Period } = actions;

  const { candles, loading, error, lastPrice, dataSource, lastUpdated } =
    useYahooKlines(klineInterval, 200, symbol);

  const isStale = lastUpdated !== null && (now - lastUpdated.getTime()) > STALE_THRESHOLD_MS;
  const secsSinceUpdate = lastUpdated ? Math.round((now - lastUpdated.getTime()) / 1000) : null;

  const ma5   = calculateSMA(candles, ma1Period);
  const ma30  = calculateSMA(candles, ma2Period);
  const ma150 = calculateSMA(candles, ma3Period);
  const signal = detectSignal(candles, ma1Period, ma2Period, ma3Period);

  const maStack = candles.length > 155
    ? getMATrend(candles, ma1Period, ma2Period, ma3Period)
    : null;

  const confirmedCandles = candles.length > 4 ? candles.slice(0, -2) : [];
  const swings = confirmedCandles.length > 10
    ? findSwingPoints(confirmedCandles, 2)
    : [];

  const swingHighs = getLatestSwings(swings, 'HIGH', 2);
  const swingLows  = getLatestSwings(swings, 'LOW',  2);

  const isInSession = candles.length > 0
    ? (
        isHKTradingHours(candles[candles.length - 1].time, false) &&
        !isHKWeekend(candles[candles.length - 1].time)
      )
    : false;

  const { history, clearHistory } = useSignalHistory(signal);
  const { config, saveConfig, sendMessage, testSend, sending, lastStatus } = useTelegram();
  const { emailConfig, saveEmailConfig, sendEmail, testEmail, emailSending, emailStatus } = useEmail();
  const { trades, addTrade, closeTrade, deleteTrade, clearAll } = useTradeJournal();
  const lastNotifiedRef = useRef<number | null>(null);

  const symbolLabels: Record<HKTicker, string> = {
    '3081.HK': 'Value Gold ETF (3081.HK)',
  };
  const symbolLabel = symbolLabels[symbol] ?? symbol;
  const modeColor = mode === 'LIVE' ? '#f0b90b' : '#ab47bc';

  const handleIntervalChange = (i: string) => {
    setKlineInterval(i.toLowerCase() as any);
  };

  // ── Signal notifications ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'LIVE' || !signal) return;
    if (lastNotifiedRef.current === signal.time) return;
    lastNotifiedRef.current = signal.time;

    const isLong = signal.type === 'LONG';
    toast(signal.message, {
      icon: isLong ? '🟢' : '🔴',
      style: {
        background: isLong ? '#0d3d1f' : '#3d0d0d',
        color: '#fff',
        border: `1px solid ${isLong ? '#00c853' : '#ff1744'}`,
        fontFamily: 'monospace',
      },
      duration: SIGNAL_TOAST_DURATION_MS,
    });

    const tgMsg = [
      `${isLong ? '🟢' : '🔴'} <b>KMA v2 ${signal.type} Entry Signal</b>`,
      `📊 <b>Asset:</b> ${symbolLabel}`,
      `💰 <b>Price:</b> HK$${signal.price.toFixed(3)}`,
      `🛑 <b>S/L:</b> HK$${signal.sl.toFixed(3)}`,
      `🎯 <b>T/P:</b> HK$${signal.tp.toFixed(3)}`,
      `🧭 <b>Trend:</b> ${signal.trend === 'BULL' ? '🐂 BULL' : '🐻 BEAR'}`,
      `📐 <b>Pivot:</b> HK$${signal.swingBreached.toFixed(3)}`,
      `📊 <b>MA${ma1Period}/${ma2Period}/${ma3Period}:</b> ${signal.ma5.toFixed(3)} / ${signal.ma30.toFixed(3)} / ${signal.ma150.toFixed(3)}`,
      `⏰ ${new Date(signal.time * 1000).toLocaleString('en-HK')}`,
      `<i>⚠️ For reference only. Not financial advice.</i>`,
    ].join('\n');

    sendMessage(tgMsg);
    sendEmail({
      subject: `${isLong ? '🟢 LONG' : '🔴 SHORT'} Signal — ${symbolLabel} @ HK$${signal.price.toFixed(3)}`,
      signal_type: isLong ? '🟢 LONG' : '🔴 SHORT',
      asset: symbolLabel,
      price: signal.price.toFixed(3),
      stop_loss: signal.sl.toFixed(3),
      take_profit: signal.tp.toFixed(3),
      trend: signal.trend,
      pivot_breached: signal.swingBreached.toFixed(3),
      ma5: signal.ma5.toFixed(3),
      ma30: signal.ma30.toFixed(3),
      ma150: signal.ma150.toFixed(3),
      time: new Date(signal.time * 1000).toLocaleString('en-HK'),
      message: signal.message,
    });
  }, [signal?.time, mode]);

  // ── Banner ─────────────────────────────────────────────────────────────────
  const dataSourceBanner = isStale
    ? `🔴 STALE — last update ${secsSinceUpdate}s ago. Check server connection.`
    : dataSource === 'yahoo'
    ? '📡 Data via Yahoo Finance proxy (60s delay)'
    : '📡 Connecting to data source…';

  const bannerColor      = isStale ? '#ff5252' : dataSource === 'yahoo' ? '#f0b90b88' : '#55555588';
  const bannerBackground = isStale ? '#2a0000' : dataSource === 'yahoo' ? '#1a1500'   : '#0f0f1a';
  const bannerBorder     = isStale ? '#ff174422' : dataSource === 'yahoo' ? '#f0b90b22' : '#2a2a3e';

  const showChart = candles.length > 0;

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* Banner */}
      <div style={{
        ...styles.dataSourceBadge,
        borderColor: bannerBorder,
        color: bannerColor,
        background: bannerBackground,
        fontWeight: isStale ? 'bold' : 'normal',
      }}>
        {dataSourceBanner}
      </div>

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.header, color: modeColor }}>KMA Signal Dashboard</h1>
          <div style={styles.subHeader}>
            {symbolLabel} · {klineInterval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}/MA{ma3Period}
            <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#ab47bc', background: '#ab47bc18', border: '1px solid #ab47bc44', borderRadius: 4, padding: '1px 5px' }}>
              KMA v2
            </span>
            {signal && (
              <span style={{ marginLeft: 8, color: signal.type === 'LONG' ? '#00c853' : '#ff1744', fontSize: '0.7rem' }}>
                ● Signal Active
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ ...styles.badge, borderColor: modeColor, color: modeColor, background: modeColor + '18' }}>
            {mode === 'LIVE' ? '● LIVE' : '⬡ BACKTEST'}
          </span>
          {mode === 'LIVE' && config.enabled && (
            <span style={styles.tgBadge}>{sending ? 'Sending…' : '📱 Telegram ON'}</span>
          )}
          {mode === 'LIVE' && emailConfig.enabled && (
            <span style={styles.emailBadge}>{emailSending ? 'Sending…' : '✉️ Email ON'}</span>
          )}
        </div>
      </div>

      <div id="mode-bar">
        <ModeBar mode={mode} onChange={setMode} />
      </div>

      <ControlBar
        symbol={symbol}
        interval={klineInterval}
        ma1Period={ma1Period}
        ma2Period={ma2Period}
        ma3Period={ma3Period}
        lang="EN"
        onSymbolChange={(s) => setSymbol(s as HKTicker)}
        onIntervalChange={handleIntervalChange}
        onMa1Change={setMa1Period}
        onMa2Change={setMa2Period}
      />

      {/* Chart area */}
      <div style={{ maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {showChart ? (
          <ErrorBoundary fallback="Chart failed to render.">
            <KlineChart
              candles={candles}
              ma5={ma5}
              ma30={ma30}
              ma150={ma150}
              signal={signal}
              lang="EN"
              ma1Period={ma1Period}
              ma2Period={ma2Period}
              ma3Period={ma3Period}
            />
          </ErrorBoundary>
        ) : loading ? (
          <div style={styles.chartSkeleton}>
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <span style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              Loading chart data…
            </span>
          </div>
        ) : error ? (
          <div style={{ ...styles.chartSkeleton, borderColor: '#f0b90b33' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span style={{ color: '#f0b90b88', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              Chart data unavailable.
            </span>
          </div>
        ) : null}
      </div>

      {/* Loading / error status cards */}
      {loading && candles.length === 0 && (
        <div style={styles.statusCard}>
          <span style={{ fontSize: '1.2rem' }}>⏳</span>
          <span>Loading {symbolLabel} kline data…</span>
        </div>
      )}
      {error && !loading && (
        <div style={{ ...styles.statusCard, borderColor: '#f0b90b55', color: '#f0b90b88' }}>
          <span>⚠️ Data error. Please check server.</span>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>{error}</span>
        </div>
      )}

      {/* ── LIVE mode ── */}
      {mode === 'LIVE' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Signal panel failed.">
            <div id="signal-panel">
              <SignalPanel
                signal={signal}
                ma5={ma5}
                ma30={ma30}
                ma150={ma150}
                lastPrice={lastPrice}
                lang="EN"
                candles={candles}
                ma1Period={ma1Period}
                ma2Period={ma2Period}
                ma3Period={ma3Period}
                maStack={maStack}
                isInSession={isInSession}
                swingHighs={swingHighs}
                swingLows={swingLows}
              />
            </div>
          </ErrorBoundary>
          <ErrorBoundary fallback="Calculator failed.">
            <PositionCalculator signal={signal} lastPrice={lastPrice} onAddTrade={addTrade} symbol={symbol} lang="EN" />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed.">
            <TradeJournal
              trades={trades}
              onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang="EN"
            />
          </ErrorBoundary>
          <TelegramSettings config={config} onSave={saveConfig} onTest={testSend} sending={sending} lastStatus={lastStatus} lang="EN" />
          <EmailSettings config={emailConfig} onSave={saveEmailConfig} onTest={testEmail} sending={emailSending} lastStatus={emailStatus} lang="EN" />
          {history.length > 0 && (
            <div style={{ maxWidth: 700, width: '100%' }}>
              <SignalHistory history={history} />
              <button onClick={clearHistory} style={styles.clearBtn}>Clear signal history</button>
            </div>
          )}
        </>
      )}

      {/* ── BACKTEST mode ── */}
      {mode === 'BACKTEST' && (
        <ErrorBoundary fallback="Backtest failed.">
          <BacktestPanel candles={candles} ma1Period={ma1Period} ma2Period={ma2Period} ma3Period={ma3Period} symbol={symbol} lang="EN" />
        </ErrorBoundary>
      )}

      <p style={styles.footer}>
        📡 {candles.length} candles loaded ·{' '}
        <span style={{ color: '#2a2a3e' }}>For reference only. Not financial advice.</span>
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main:            { minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px', gap: 14, fontFamily: 'monospace' },
  dataSourceBadge: { borderRadius: 8, padding: '4px 12px', fontSize: '0.68rem', fontFamily: 'monospace', maxWidth: 700, width: '100%', textAlign: 'center', border: '1px solid', transition: 'all 0.5s' },
  headerRow:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', maxWidth: 700 },
  header:          { fontFamily: 'monospace', fontSize: '1.15rem', margin: 0 },
  subHeader:       { color: '#555', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  badge:           { border: '1px solid', padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontFamily: 'monospace' },
  tgBadge:         { background: '#0d2a3e', color: '#29b6f6', border: '1px solid #29b6f6', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontFamily: 'monospace' },
  emailBadge:      { background: '#1a0d2e', color: '#ce93d8', border: '1px solid #ce93d8', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontFamily: 'monospace' },
  chartSkeleton:   { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 12, height: 200, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 },
  statusCard:      { background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, padding: '14px 18px', maxWidth: 700, width: '100%', color: '#888', fontFamily: 'monospace', fontSize: '0.85rem', display: 'flex', gap: 10, alignItems: 'center' },
  clearBtn:        { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginTop: 6, padding: '2px 6px' },
  footer:          { color: '#2a2a3e', fontSize: '0.72rem', fontFamily: 'monospace', textAlign: 'center', margin: 0, marginTop: 8 },
};