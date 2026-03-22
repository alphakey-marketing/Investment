/**
 * SignalPanel.tsx — K均交易法 v2
 *
 * Changes vs previous version:
 *  - WaitCard now receives full 5-gate data (maStack, swings, isInSession)
 *  - Signal card: removed fixed T/P badge — replaced with "Trailing Stop" badge
 *  - R:R badge corrected from "3:1" to "2.5:1 minimum" with honest explanation
 *  - Added trailing stop explanation banner below the entry levels
 *  - "3 Rules" footer updated to reflect v2 logic (trailing stop, not fixed TP)
 */
import React, { useState } from 'react';
import { Candle, KMASignalEvent, MAPoint } from '../types/binance';
import { Lang, tr } from '../i18n';
import { MAStack }    from '../utils/maTrend';
import { SwingPoint } from '../utils/swingPoints';
import Tip            from './Tip';
import BeginnerGuide  from './SignalBeginnerGuide';
import WaitCard       from './SignalWaitCard';

interface Props {
  signal:       KMASignalEvent | null;
  ma5:          MAPoint[];
  ma30:         MAPoint[];
  ma150:        MAPoint[];
  lastPrice:    number | null;
  lang:         Lang;
  candles?:     Candle[];
  ma1Period?:   number;
  ma2Period?:   number;
  ma3Period?:   number;
  // New: gate data passed from App.tsx
  maStack:      MAStack | null;
  isInSession:  boolean;
  swingHighs:   SwingPoint[];
  swingLows:    SwingPoint[];
}

function StatCard({ label, value, color, tip, sub }: {
  label: string; value: string; color?: string; tip?: string; sub?: string;
}) {
  return (
    <div style={statStyles.card}>
      <div style={statStyles.label}>
        {tip
          ? <Tip text={tip}><span>{label} <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>ⓘ</span></span></Tip>
          : label}
      </div>
      <div style={{ ...statStyles.value, color: color ?? '#fff' }}>{value}</div>
      {sub && <div style={statStyles.sub}>{sub}</div>}
    </div>
  );
}

export default function SignalPanel({
  signal, ma5, ma30, ma150, lastPrice, lang, candles,
  ma1Period = 5, ma2Period = 30, ma3Period = 150,
  maStack, isInSession, swingHighs, swingLows,
}: Props) {
  const latestMA5   = ma5[ma5.length - 1]?.value   ?? null;
  const latestMA30  = ma30[ma30.length - 1]?.value  ?? null;
  const latestMA150 = ma150[ma150.length - 1]?.value ?? null;
  const isEN        = lang === 'EN';
  const trend       = maStack?.trend ?? null;
  const trendLabel  = trend === 'BULL'
    ? (isEN ? '⬆ Bullish' : '⬆ 多頭')
    : trend === 'BEAR'
    ? (isEN ? '⬇ Bearish' : '⬇ 空頭')
    : (isEN ? '↔ Range' : '↔ 橫盤');
  const trendColor  = trend === 'BULL' ? '#00c853' : trend === 'BEAR' ? '#ff1744' : '#888';

  return (
    <div style={styles.panel}>

      {/* ── Title ── */}
      <div>
        <div style={styles.title}>{isEN ? '📊 KMA v2 Signal Dashboard' : '📊 K均 v2 訊號面板'}</div>
        <div style={styles.subtitle}>
          {isEN
            ? '5-gate entry system based on MA stack + swing point breakout'
            : '5條件入場系統：三線堆疊 + 擺動拐點突破'}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={styles.statsRow}>
        <StatCard
          label={isEN ? 'Current Price' : '現價'}
          value={`$${lastPrice?.toFixed(2) ?? '---'}`}
          color="#f0b90b"
          tip={isEN ? 'Live market price, updates every 10s.' : '即時價格，每10秒更新。'}
          sub={isEN ? 'Updates every 10s' : '每10秒更新'}
        />
        <StatCard
          label={`MA${ma1Period}`}
          value={`$${latestMA5?.toFixed(2) ?? '---'}`}
          color="#2196f3"
          tip={isEN ? `${ma1Period}-candle average. Short-term momentum.` : `最近 ${ma1Period} 根均值，短期動能。`}
          sub={isEN ? 'Fast MA' : '快線'}
        />
        <StatCard
          label={`MA${ma2Period}`}
          value={`$${latestMA30?.toFixed(2) ?? '---'}`}
          color="#ff9800"
          tip={isEN ? `${ma2Period}-candle average. Dynamic support/resistance anchor for entries.` : `最近 ${ma2Period} 根均值，入場動態支撐/壓力錨點。`}
          sub={isEN ? 'Entry Anchor' : '入場錨點'}
        />
        <StatCard
          label={`MA${ma3Period}`}
          value={`$${latestMA150?.toFixed(2) ?? '---'}`}
          color="#ab47bc"
          tip={isEN ? `${ma3Period}-candle average. Macro trend filter — no trades against it.` : `最近 ${ma3Period} 根均值，宏觀趨勢過濾，不逆勢交易。`}
          sub={isEN ? 'Macro Trend' : '宏觀趨勢'}
        />
        <StatCard
          label={isEN ? 'MA Stack' : '均線堆疊'}
          value={trendLabel}
          color={trendColor}
          tip={isEN
            ? 'BULL = MA5>MA30>MA150 (long only). BEAR = MA5<MA30<MA150 (short only). RANGE = stand aside.'
            : '多頭 = MA5>MA30>MA150（只做多）。空頭 = MA5<MA30<MA150（只做空）。橫盤 = 不交易。'}
          sub={isEN ? 'Gate 2 filter' : '條件2過濾'}
        />
      </div>

      {/* ── Signal or Wait ── */}
      <div>
        <div style={styles.sectionLabel}>{isEN ? '🚦 LIVE SIGNAL' : '🚦 即時訊號'}</div>

        {signal ? (
          <div style={{
            ...styles.signalCard,
            background:   signal.type === 'LONG' ? '#0a2e18' : '#2e0a0a',
            borderColor:  signal.type === 'LONG' ? '#00c853' : '#ff1744',
            boxShadow:    `0 0 20px ${signal.type === 'LONG' ? '#00c85330' : '#ff174430'}`,
          }}>

            {/* Signal header */}
            <div style={styles.signalTop}>
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>
                {signal.type === 'LONG' ? '🟢' : '🔴'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                  {signal.type === 'LONG'
                    ? (isEN ? 'BUY / Long Entry Signal' : '買入（做多）入場訊號')
                    : (isEN ? 'SELL / Short Entry Signal' : '賣出（做空）入場訊號')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#bbb', marginTop: 4, lineHeight: 1.5 }}>
                  {signal.message}
                </div>
              </div>
            </div>

            {/* Entry / SL / Trailing / R:R */}
            <div style={styles.levelsRow}>
              <LevelBadge
                icon="📍"
                label={isEN ? 'Entry' : '入場'}
                value={`$${signal.price.toFixed(2)}`}
                color="#f0b90b"
                tip={isEN
                  ? 'Entry price at the moment the breakout candle closed.'
                  : '突破K線收盤時的入場價格。'}
              />
              <LevelBadge
                icon="🛑"
                label={isEN ? 'Stop Loss' : '止損'}
                value={`$${signal.sl.toFixed(2)}`}
                color="#ff5252"
                tip={isEN
                  ? `Structure-based stop at the last confirmed swing ${signal.type === 'LONG' ? 'LOW' : 'HIGH'}. Exit here if the trade thesis is proven wrong.`
                  : `結構性止損，置於最近確認的擺動${signal.type === 'LONG' ? '低點' : '高點'}。交易邏輯被否定時在此離場。`}
              />
              <LevelBadge
                icon="📈"
                label={isEN ? 'Trailing Stop' : '止損跟隨'}
                value={isEN ? 'Auto-move' : '自動上移'}
                color="#29b6f6"
                tip={isEN
                  ? 'No fixed take profit. As new swing lows (for LONG) form above your stop, the stop moves up — locking in profit automatically. Hold until the trailing stop is hit.'
                  : '沒有固定止盈。隨著新的前低（做多時）出現並高於現有止損，止損自動上移，自動鎖定利潤。持倉直到跟隨止損被觸發。'}
              />
              <LevelBadge
                icon="⚖️"
                label={isEN ? 'Min R:R' : '最低盈虧比'}
                value="2.5 : 1"
                color="#f0b90b"
                tip={isEN
                  ? 'Minimum risk:reward based on SL distance × 2.5. The real R:R is unlimited — you hold until the trailing stop is triggered, which could be 5:1 or 10:1 in a strong trend.'
                  : '基於止損距離 × 2.5 的最低風報比。實際盈虧比無上限——持倉至跟隨止損觸發，強趨勢下可達 5:1 甚至 10:1。'}
              />
            </div>

            {/* Trailing stop explanation banner */}
            <div style={styles.trailingBanner}>
              <span style={{ fontSize: '1rem' }}>💡</span>
              <div style={{ fontSize: '0.78rem', color: '#29b6f6', lineHeight: 1.6 }}>
                {isEN
                  ? 'This position has NO fixed take profit. The book\'s method is to hold and let the trailing stop lock in gains — your stop moves up each time a new swing low forms above it. Exit only when the stop is hit.'
                  : '此持倉沒有固定止盈。書中的方法是持倉不動，讓止損跟隨鎖定獲利——每次出現新的前低高於現有止損時，止損自動上移。只有止損被觸及才離場。'}
              </div>
            </div>

            {/* Swing breached context */}
            <div style={{ fontSize: '0.72rem', color: '#444', fontFamily: 'monospace' }}>
              {isEN
                ? `Swing ${signal.type === 'LONG' ? 'high' : 'low'} breached: $${signal.swingBreached.toFixed(2)} | Trend: ${signal.trend} | MA${ma2Period}: $${signal.ma30.toFixed(2)}`
                : `突破${signal.type === 'LONG' ? '前高' : '前低'}：$${signal.swingBreached.toFixed(2)} | 趨勢：${signal.trend} | MA${ma2Period}：$${signal.ma30.toFixed(2)}`}
            </div>
          </div>

        ) : (
          <WaitCard
            lastPrice={lastPrice}
            latestMA30={latestMA30}
            latestMA150={latestMA150}
            maStack={maStack}
            isInSession={isInSession}
            swingHighs={swingHighs}
            swingLows={swingLows}
            isEN={isEN}
          />
        )}
      </div>

      <BeginnerGuide lang={lang} />

      {/* ── Rules Footer ── */}
      <div style={styles.rulesFooter}>
        <div style={styles.rulesTitle}>{isEN ? '📖 The 3 Core Principles' : '📖 K均三大原則'}</div>
        <div style={styles.rulesRow}>
          <RulePill num="1" text={isEN ? 'MA stack aligned' : '三線堆疊'} color="#00c853" />
          <RulePill num="2" text={isEN ? 'HH/LL breakout' : 'HH/LL拐點突破'} color="#f0b90b" />
          <RulePill num="3" text={isEN ? 'Trailing stop' : '止損跟隨'} color="#ab47bc" />
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ icon, label, value, color, tip }: {
  icon: string; label: string; value: string; color: string; tip: string;
}) {
  return (
    <Tip text={tip}>
      <div style={{
        background: color + '18', border: `1px solid ${color}55`, borderRadius: 8,
        padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2,
        cursor: 'help', flex: 1, minWidth: 90,
      }}>
        <div style={{ fontSize: '0.67rem', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{icon} {label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color, fontFamily: 'monospace' }}>{value}</div>
      </div>
    </Tip>
  );
}

function RulePill({ num, text, color }: { num: string; color: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: color + '15', border: `1px solid ${color}44`, borderRadius: 20, padding: '5px 12px' }}>
      <span style={{ background: color, color: '#000', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0 }}>{num}</span>
      <span style={{ fontSize: '0.78rem', color, fontFamily: 'monospace' }}>{text}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel:          { background: '#12122a', border: '1px solid #2a2a3e', borderRadius: 14, padding: '20px', color: '#fff', fontFamily: 'monospace', maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 },
  title:          { fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: 0 },
  subtitle:       { fontSize: '0.72rem', color: '#555', marginTop: 3 },
  statsRow:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 },
  sectionLabel:   { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  signalCard:     { border: '1px solid', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  signalTop:      { display: 'flex', gap: 14, alignItems: 'flex-start' },
  levelsRow:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 },
  trailingBanner: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#0d1a2e', border: '1px solid #29b6f633', borderRadius: 8, padding: '10px 12px' },
  rulesFooter:    { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 10, padding: '12px 14px' },
  rulesTitle:     { fontSize: '0.68rem', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rulesRow:       { display: 'flex', gap: 8, flexWrap: 'wrap' },
};

const statStyles: Record<string, React.CSSProperties> = {
  card:  { background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { fontSize: '1rem', fontWeight: 'bold' },
  sub:   { fontSize: '0.65rem', color: '#444', marginTop: 1 },
};