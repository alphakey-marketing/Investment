import React, { useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useYahooKlines } from './hooks/useYahooKlines';
import { useAppState } from './hooks/useAppState';
import { useSignalHistory } from './hooks/useSignalHistory';
import { useTelegram } from './hooks/useTelegram';
import { useEmail } from './hooks/useEmail';
import { useTradeJournal } from './hooks/useTradeJournal';
import { usePaperTrading } from './hooks/usePaperTrading';
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
import PaperTradingPanel from './components/PaperTradingPanel';
import BacktestPanel from './components/BacktestPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HKTicker, CONTRACT_SPECS } from './types/hkmarket';
import { Lang, tr } from './i18n';
import {
  STALE_THRESHOLD_MS,
  SIGNAL_TOAST_DURATION_MS,
  LS_ROADMAP_DONE,
} from './constants';
import './App.css';

// ─── Beginner Roadmap ────────────────────────────────────────────────────────
function BeginnerRoadmap({ lang, onDismiss }: { lang: Lang; onDismiss: () => void }) {
  const isEN = lang === 'EN';
  const [done, setDone] = React.useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_ROADMAP_DONE) || '{}'); } catch { return {}; }
  });
  const markDone = (step: number) => {
    const next = { ...done, [step]: true };
    setDone(next);
    localStorage.setItem(LS_ROADMAP_DONE, JSON.stringify(next));
  };
  const steps = isEN ? [
    { icon: '📖', label: 'Read the Beginner Guide', sub: 'Scroll to Signal Panel below', id: 'signal-guide' },
    { icon: '🔁', label: 'Run a Backtest', sub: 'Switch to Backtest mode above', id: 'mode-bar' },
    { icon: '🚦', label: 'Watch for a Live Signal', sub: 'Stay in Live mode and wait', id: 'signal-panel' },
    { icon: '📱', label: 'Set Up Telegram Alerts', sub: 'Add your bot token below', id: 'signal-panel' },
  ] : [
    { icon: '📖', label: '閱讀新手指南', sub: '向下滾動至訊號面板', id: 'signal-guide' },
    { icon: '🔁', label: '執行回歸渠湋試', sub: '切換至回歸渠湋模式', id: 'mode-bar' },
    { icon: '🚦', label: '等待即時訊號', sub: '留在即時模式等待訊號出現', id: 'signal-panel' },
    { icon: '📱', label: '設定Telegram警報', sub: '在下方輸入Bot Token', id: 'signal-panel' },
  ];
  const allDone = steps.every((_, i) => done[i]);
  return (
    <div style={rmStyles.wrapper}>
      <div style={rmStyles.inner}>
        <div style={rmStyles.titleRow}>
          <span style={rmStyles.title}>{tr('rmTitle', lang)}</span>
          <button onClick={onDismiss} style={rmStyles.dismiss} title={tr('rmDismiss', lang)}>✕</button>
        </div>
        <div style={rmStyles.stepsRow}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{ ...rmStyles.step, background: done[i] ? '#0d2a0d' : '#12122a', border: `1px solid ${done[i] ? '#00c85355' : '#2a2a3e'}` }}
              onClick={() => { markDone(i); const el = document.getElementById(step.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            >
              <span style={rmStyles.stepNum}>
                {done[i]
                  ? '✅'
                  : <span style={{ background: '#29b6f6', color: '#000', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>{i + 1}</span>}
              </span>
              <div>
                <div style={{ fontSize: '0.78rem', color: done[i] ? '#00c853' : '#ccc', fontWeight: 'bold' }}>{step.icon} {step.label}</div>
                <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 2 }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
        {allDone && (
          <div style={{ fontSize: '0.78rem', color: '#00c853', textAlign: 'center', padding: '6px 0' }}>
            {tr('rmAllDone', lang)}
          </div>
        )}
      </div>
    </div>
  );
}
const rmStyles: Record<string, React.CSSProperties> = {
  wrapper:  { background: 'linear-gradient(135deg, #0d0d1e, #12122a)', border: '1px solid #29b6f644', borderRadius: 14, maxWidth: 700, width: '100%', boxShadow: '0 4px 24px #29b6f610' },
  inner:    { padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:    { fontSize: '0.85rem', fontWeight: 'bold', color: '#29b6f6', fontFamily: 'monospace' },
  dismiss:  { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.9rem', padding: 4 },
  stepsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 },
  step:     { borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'opacity 0.2s' },
  stepNum:  { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
};

// ─── Data source badge ───────────────────────────────────────────────────────
function ChartSourceBadge({ source, lang }: { source: 'yahoo' | null; lang: Lang }) {
  if (!source) return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.65rem', fontFamily: 'monospace',
      color: '#f0b90b',
      background: '#f0b90b10',
      border: '1px solid #f0b90b33',
      borderRadius: 5, padding: '2px 8px',
    }}>
      {tr('chartSource60s', lang)}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [state, actions] = useAppState();
  const { mode, lang, symbol, klineInterval, ma1Period, ma2Period, ma3Period, showOnboard, showRoadmap, now } = state;
  const { setMode, setLang, setSymbol, setKlineInterval, setMa1Period, setMa2Period, setMa3Period, dismissOnboard, dismissRoadmap, showRoadmapAgain } = actions;

  const { candles, loading, error, lastPrice, dataSource, lastUpdated } =
    useYahooKlines(klineInterval, 200, symbol);

  const isStale = lastUpdated !== null && (now - lastUpdated.getTime()) > STALE_THRESHOLD_MS;
  const secsSinceUpdate = lastUpdated ? Math.round((now - lastUpdated.getTime()) / 1000) : null;

  const ma5   = calculateSMA(candles, ma1Period);
  const ma30  = calculateSMA(candles, ma2Period);
  const ma150 = calculateSMA(candles, ma3Period);
  const signal = detectSignal(candles, ma1Period, ma2Period, ma3Period);

  // ── Gate data for SignalPanel WaitCard ─────────────────────────────────────
  // maStack: classified MA trend (BULL / BEAR / RANGE) — Gate 2
  const maStack = candles.length > 155
    ? getMATrend(candles, ma1Period, ma2Period, ma3Period)
    : null;

  // Exclude the latest 2 unconfirmed candles before computing swing points
  // (a pivot needs 2 right-side bars to be confirmed — see swingPoints.ts)
  const confirmedCandles = candles.length > 4 ? candles.slice(0, -2) : [];
  const swings           = confirmedCandles.length > 10
    ? findSwingPoints(confirmedCandles, 2)
    : [];

  // Latest 2 swing HIGHs (for Gate 3: HH check) and 2 LOWs (LL check)
  const swingHighs = getLatestSwings(swings, 'HIGH', 2);
  const swingLows  = getLatestSwings(swings, 'LOW',  2);

  // Gate 1: is the market currently in a HKEX trading session?
  const isInSession = candles.length > 0
    ? (
        isHKTradingHours(candles[candles.length - 1].time, false) &&
        !isHKWeekend(candles[candles.length - 1].time)
      )
    : false;
  // ───────────────────────────────────────────────────────────────────────────

  const { history, clearHistory } = useSignalHistory(signal);
  const { config, saveConfig, sendMessage, testSend, sending, lastStatus } = useTelegram();
  const { emailConfig, saveEmailConfig, sendEmail, testEmail, emailSending, emailStatus } = useEmail();
  const { trades, addTrade, closeTrade, deleteTrade, clearAll } = useTradeJournal();
  const { account, openPosition, closePosition, resetAccount, pnl: paperPnl, pnlPct: paperPnlPct } =
    usePaperTrading(addTrade);
  const lastNotifiedRef = useRef<number | null>(null);
  const isEN = lang === 'EN';

  const symbolLabels: Record<HKTicker, string> = {
    '3081.HK': tr('sym3081', lang),
  };
  const symbolLabel = symbolLabels[symbol] ?? symbol;
  const modeColor = mode === 'LIVE' ? '#f0b90b' : mode === 'PAPER' ? '#29b6f6' : '#ab47bc';

  const handleIntervalChange = (i: string) => {
    setKlineInterval(i.toLowerCase() as any);
  };

  // ── Signal notifications ──────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'LIVE' || !signal) return;
    if (lastNotifiedRef.current === signal.time) return;
    lastNotifiedRef.current = signal.time;
    const isLong = signal.type === 'LONG';
    toast(signal.message, {
      icon: isLong ? '🟢' : '🔴',
      style: { background: isLong ? '#0d3d1f' : '#3d0d0d', color: '#fff', border: `1px solid ${isLong ? '#00c853' : '#ff1744'}`, fontFamily: 'monospace' },
      duration: SIGNAL_TOAST_DURATION_MS,
    });
    if (Notification.permission === 'granted')
      new Notification(`KMA ${signal.type} — ${symbolLabel}`, { body: signal.message });
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

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // ── Banner text ───────────────────────────────────────────────────────────
  const dataSourceBanner = isStale
    ? (isEN ? `🔴 STALE — last update ${secsSinceUpdate}s ago. Check server connection.`
            : `🔴 數据已過時 — 最後更新於 ${secsSinceUpdate} 秒前。請檢查服務器連接。`)
    : dataSource === 'yahoo'
    ? tr('chartSourceProxy', lang)
    : tr('chartSourceConnect', lang);

  const bannerColor      = isStale ? '#ff5252' : dataSource === 'yahoo' ? '#f0b90b88' : '#55555588';
  const bannerBackground = isStale ? '#2a0000' : dataSource === 'yahoo' ? '#1a1500'   : '#0f0f1a';
  const bannerBorder     = isStale ? '#ff174422' : dataSource === 'yahoo' ? '#f0b90b22' : '#2a2a3e';

  const showChart = candles.length > 0;

  return (
    <main style={styles.main}>
      <Toaster position="top-right" />

      {/* Banner */}
      <div style={{ ...styles.dataSourceBadge, borderColor: bannerBorder, color: bannerColor, background: bannerBackground, fontWeight: isStale ? 'bold' : 'normal' }}>
        {dataSourceBanner}
      </div>

      {/* Onboarding */}
      {showOnboard && (
        <div style={styles.onboard}>
          <div style={styles.onboardInner}>
            <div style={styles.onboardIcon}>👋</div>
            <div style={{ flex: 1 }}>
              <div style={styles.onboardTitle}>{tr('onboardTitle', lang)}</div>
              <div style={styles.onboardDesc}>{tr('onboardDesc', lang)}</div>
            </div>
            <button onClick={dismissOnboard} style={styles.onboardClose}>✕</button>
          </div>
        </div>
      )}

      {showRoadmap && <BeginnerRoadmap lang={lang} onDismiss={dismissRoadmap} />}
      {!showRoadmap && (
        <button
          onClick={showRoadmapAgain}
          style={{ background: 'none', border: '1px solid #1a1a2e', color: '#2a2a4e', fontSize: '0.68rem', fontFamily: 'monospace', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', alignSelf: 'flex-end' }}
        >
          {tr('showRoadmap', lang)}
        </button>
      )}

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={{ ...styles.header, color: modeColor }}>{tr('appTitle', lang)}</h1>
          <div style={styles.subHeader}>
            {symbolLabel} · {klineInterval.toUpperCase()} · MA{ma1Period}/MA{ma2Period}/MA{ma3Period}
            <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#ab47bc', background: '#ab47bc18', border: '1px solid #ab47bc44', borderRadius: 4, padding: '1px 5px' }}>
              {tr('kmaV2Badge', lang)}
            </span>
            {signal && (
              <span style={{ marginLeft: 8, color: signal.type === 'LONG' ? '#00c853' : '#ff1744', fontSize: '0.7rem' }}>
                ● {tr('signalActive', lang)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ ...styles.badge, borderColor: modeColor, color: modeColor, background: modeColor + '18' }}>
            {mode === 'LIVE' ? tr('badgeLive', lang) : mode === 'PAPER' ? tr('badgePaper', lang) : tr('badgeBacktest', lang)}
          </span>
          {mode === 'LIVE' && config.enabled && (
            <span style={styles.tgBadge}>{sending ? tr('badgeTGSending', lang) : tr('badgeTG', lang)}</span>
          )}
          {mode === 'LIVE' && emailConfig.enabled && (
            <span style={styles.emailBadge}>{emailSending ? tr('emailSendingBadge', lang) : tr('emailOnBadge', lang)}</span>
          )}
        </div>
      </div>

      <div id="mode-bar">
        <ModeBar mode={mode} onChange={setMode} lang={lang} onLangChange={setLang} />
      </div>

      <ControlBar
        symbol={symbol}
        interval={klineInterval}
        ma1Period={ma1Period}
        ma2Period={ma2Period}
        ma3Period={ma3Period}
        lang={lang}
        onSymbolChange={(s) => setSymbol(s as HKTicker)}
        onIntervalChange={handleIntervalChange}
        onMa1Change={setMa1Period}
        onMa2Change={setMa2Period}
      />

      {/* Chart area */}
      <div style={{ maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 2 }}>
          <ChartSourceBadge source={dataSource} lang={lang} />
        </div>
        {showChart ? (
          <ErrorBoundary fallback={tr('chartFailed', lang)}>
            <KlineChart
              candles={candles}
              ma5={ma5}
              ma30={ma30}
              ma150={ma150}
              signal={signal}
              lang={lang}
              ma1Period={ma1Period}
              ma2Period={ma2Period}
              ma3Period={ma3Period}
            />
          </ErrorBoundary>
        ) : loading ? (
          <div style={styles.chartSkeleton}>
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <span style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              {tr('chartLoading', lang)}
            </span>
          </div>
        ) : error ? (
          <div style={{ ...styles.chartSkeleton, borderColor: '#f0b90b33' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span style={{ color: '#f0b90b88', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {tr('chartError', lang)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Loading / error status cards */}
      {loading && candles.length === 0 && (
        <div style={styles.statusCard}>
          <span style={{ fontSize: '1.2rem' }}>⏳</span>
          <span>{tr('loading', lang)} {symbolLabel} {tr('klineData', lang)}</span>
        </div>
      )}
      {error && !loading && (
        <div style={{ ...styles.statusCard, borderColor: '#f0b90b55', color: '#f0b90b88' }}>
          <span>⚠️ {tr('dataError', lang)}</span>
          <span style={{ fontSize: '0.75rem', color: '#555' }}>{error}</span>
        </div>
      )}

      {/* ── LIVE mode ── */}
      {mode === 'LIVE' && !loading && !error && (
        <>
          <ErrorBoundary fallback="Signal panel failed">
            <div id="signal-panel">
              <SignalPanel
                signal={signal}
                ma5={ma5}
                ma30={ma30}
                ma150={ma150}
                lastPrice={lastPrice}
                lang={lang}
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
          <ErrorBoundary fallback="Calculator failed">
            <PositionCalculator signal={signal} lastPrice={lastPrice} onAddTrade={addTrade} symbol={symbol} lang={lang} />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal
              trades={trades.filter(t => !t.notes?.includes('[paper]'))}
              onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang}
            />
          </ErrorBoundary>
          <TelegramSettings config={config} onSave={saveConfig} onTest={testSend} sending={sending} lastStatus={lastStatus} lang={lang} />
          <EmailSettings config={emailConfig} onSave={saveEmailConfig} onTest={testEmail} sending={emailSending} lastStatus={emailStatus} lang={lang} />
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
            <PaperTradingPanel
              account={account} signal={signal} lastPrice={lastPrice}
              symbol={symbol} pnl={paperPnl} pnlPct={paperPnlPct} lang={lang}
              onOpen={openPosition} onClose={closePosition} onReset={resetAccount}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback="Journal failed">
            <TradeJournal
              trades={trades.filter(t => t.notes?.includes('[paper]'))}
              onClose={closeTrade} onDelete={deleteTrade} onClear={clearAll} lang={lang}
            />
          </ErrorBoundary>
        </>
      )}

      {/* ── BACKTEST mode ── */}
      {mode === 'BACKTEST' && (
        <ErrorBoundary fallback="Backtest failed">
          <BacktestPanel candles={candles} ma1Period={ma1Period} ma2Period={ma2Period} ma3Period={ma3Period} symbol={symbol} lang={lang} />
        </ErrorBoundary>
      )}

      <p style={styles.footer}>
        📡 {candles.length} {tr('footerKlines', lang)}
        <span style={{ margin: '0 8px', color: '#1e1e35' }}>·</span>
        {tr('footerDisclaimer', lang)}
      </p>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main:            { minHeight: '100vh', background: '#0a0a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 12px', gap: 14, fontFamily: 'monospace' },
  dataSourceBadge: { borderRadius: 8, padding: '4px 12px', fontSize: '0.68rem', fontFamily: 'monospace', maxWidth: 700, width: '100%', textAlign: 'center', border: '1px solid', transition: 'all 0.5s' },
  onboard:         { background: 'linear-gradient(135deg, #1a1a35, #12122a)', border: '1px solid #f0b90b55', borderRadius: 14, padding: '18px 20px', maxWidth: 700, width: '100%', boxShadow: '0 4px 24px #f0b90b18' },
  onboardInner:    { display: 'flex', gap: 14, alignItems: 'flex-start' },
  onboardIcon:     { fontSize: '2rem', flexShrink: 0 },
  onboardTitle:    { fontSize: '0.95rem', fontWeight: 'bold', color: '#f0b90b', marginBottom: 6 },
  onboardDesc:     { fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6, marginBottom: 10 },
  onboardClose:    { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: 4 },
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