import React, { useState } from 'react';
import { Candle, KMASignalEvent, MAPoint } from '../types/binance';
import { Lang, tr } from '../i18n';
import Tip from './Tip';
import BeginnerGuide from './SignalBeginnerGuide';
import WaitCard from './SignalWaitCard';

interface Props {
  signal:     KMASignalEvent | null;
  ma5:        MAPoint[];
  ma30:       MAPoint[];
  ma150:      MAPoint[];
  lastPrice:  number | null;
  lang:       Lang;
  candles?:   Candle[];
  ma1Period?: number;
  ma2Period?: number;
  ma3Period?: number;
}

function StatCard({ label, value, color, tip, sub }: { label: string; value: string; color?: string; tip?: string; sub?: string }) {
  return (
    <div style={statStyles.card}>
      <div style={statStyles.label}>
        {tip ? <Tip text={tip}><span>{label} <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>ⓘ</span></span></Tip> : label}
      </div>
      <div style={{ ...statStyles.value, color: color ?? '#fff' }}>{value}</div>
      {sub && <div style={statStyles.sub}>{sub}</div>}
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function SignalPanel({ signal, ma5, ma30, ma150, lastPrice, lang, candles, ma1Period = 5, ma2Period = 30, ma3Period = 150 }: Props) {
  const latestMA5 = ma5[ma5.length - 1]?.value ?? null;
  const latestMA30 = ma30[ma30.length - 1]?.value ?? null;
  const latestMA150 = ma150[ma150.length - 1]?.value ?? null;
  const isEN = lang === 'EN';
  const isBull = lastPrice && latestMA30 ? lastPrice > latestMA30 : null;

  return (
    <div style={styles.panel}>
      {/* Title */}
      <div>
        <div style={styles.title}>{isEN ? '📊 MA Signal Dashboard' : '📊 K均訊號面板'}</div>
        <div style={styles.subtitle}>{isEN ? 'Real-time buy/sell signals based on Moving Average rules' : '基於移動平均線規則的即時買賣訊號'}</div>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        <StatCard label={isEN ? 'Current Price' : '現價 (USDT)'} value={`$${lastPrice?.toFixed(2) ?? '---'}`} color="#f0b90b"
          tip={isEN ? 'Live market price, updates every 10 seconds.' : '即時市場價格，每10秒自動更新。'}
          sub={isEN ? 'Updates every 10s' : '每10秒更新'} />
        <StatCard label={`MA${ma1Period}`} value={`$${latestMA5?.toFixed(2) ?? '---'}`} color="#2196f3"
          tip={isEN ? `Average of last ${ma1Period} candles. Short-term entry zone.` : `最近${ma1Period}根K線均值，短期入場區間。`}
          sub={isEN ? 'Fast MA' : '快速均線'} />
        <StatCard label={`MA${ma2Period}`} value={`$${latestMA30?.toFixed(2) ?? '---'}`} color="#ff9800"
          tip={isEN ? `Average of last ${ma2Period} candles. Trend anchor.` : `最近${ma2Period}根K線均值，趨勢錨點。`}
          sub={isEN ? 'Trend MA' : '趨勢均線'} />
        <StatCard
          label={`MA${ma3Period}`}
          value={`$${latestMA150?.toFixed(2) ?? '---'}`}
          color="#ab47bc"
          tip={isEN ? `Average of last ${ma3Period} candles. Macro regime filter.` : `最近${ma3Period}根K線均值，宏觀制度過濾。`}
          sub={isEN ? 'Macro MA' : '宏觀均線'} />
        <StatCard
          label={isEN ? 'Trend' : '趨勢'}
          value={isBull === null ? '---' : isBull ? (isEN ? '⬆ Bullish' : '⬆ 多頭') : (isEN ? '⬇ Bearish' : '⬇ 空頭')}
          color={isBull === null ? '#888' : isBull ? '#00c853' : '#ff1744'}
          tip={isEN ? `Bullish = price above MA${ma2Period} (boat on water). Bearish = price below (boat sinking).` : `多頭 = 價格浮在MA${ma2Period}上如船在水面；空頭 = 沉在線下。`}
          sub={isEN ? `Price vs MA${ma2Period}` : `現價 vs MA${ma2Period}`} />
      </div>

      {/* Signal or Wait */}
      <div>
        <div style={styles.sectionLabel}>{isEN ? '🚦 LIVE SIGNAL' : '🚦 即時訊號'}</div>
        {signal ? (
          <div style={{
            ...styles.signalCard,
            background: signal.type === 'LONG' ? '#0a2e18' : '#2e0a0a',
            borderColor: signal.type === 'LONG' ? '#00c853' : '#ff1744',
            boxShadow: `0 0 20px ${signal.type === 'LONG' ? '#00c85330' : '#ff174430'}`,
          }}>
            <div style={styles.signalTop}>
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{signal.type === 'LONG' ? '🟢' : '🔴'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                  {signal.type === 'LONG' ? (isEN ? 'BUY / Long Entry Signal' : '買入（做多）入場訊號') : (isEN ? 'SELL / Short Entry Signal' : '賣出（做空）入場訊號')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#bbb', marginTop: 4, lineHeight: 1.5 }}>{signal.message}</div>
              </div>
            </div>
            <div style={styles.levelsRow}>
              <LevelBadge icon="📍" label={isEN ? 'Entry' : '入場'} value={`$${signal.price.toFixed(2)}`} color="#f0b90b"
                tip={isEN ? 'Entry price when signal triggered' : '訊號觸發時的入場價格'} />
              <LevelBadge icon="🛑" label={isEN ? 'Stop Loss' : '止蝕'}
                value={`$${signal.sl.toFixed(2)}`} color="#ff5252"
                tip={isEN ? 'Exit here if trade goes wrong. Structure-based dynamic SL from swing low.' : '交易出錯時在此離場。動態止蝕基於擺動低點。'} />
              <LevelBadge icon="🎯" label={isEN ? 'Take Profit' : '止盈'}
                value={`$${signal.tp.toFixed(2)}`} color="#00c853"
                tip={isEN ? 'Target exit. Profit = 3× stop loss distance (risk:reward ~3:1).' : '目標離場。利潤 = 止蝕距離的3倍（風險報酬比 ~3:1）。'} />
              <LevelBadge icon="⚖️" label={isEN ? 'R:R Ratio' : '盈虧比'} value="3 : 1" color="#f0b90b"
                tip={isEN ? 'Risk $1 to make $3. Works long-term even at 40% win rate.' : '冒$1賺$3。即使40%勝率長期仍盈利。'} />
            </div>
          </div>
        ) : (
          <WaitCard lastPrice={lastPrice} latestMA5={latestMA5} latestMA30={latestMA30} isEN={isEN} />
        )}
      </div>

      <BeginnerGuide lang={lang} />

      {/* 3 Rules */}
      <div style={styles.rulesFooter}>
        <div style={styles.rulesTitle}>{isEN ? '📖 The 3 MA Rules' : '📖 K均三大原則'}</div>
        <div style={styles.rulesRow}>
          <RulePill num="1" text={isEN ? 'Above line → Buy' : '線上做多'} color="#00c853" />
          <RulePill num="2" text={isEN ? 'Wait for the line' : '到位才動'} color="#f0b90b" />
          <RulePill num="3" text={isEN ? 'R:R = 3:1' : '盈虧比3:1'} color="#ab47bc" />
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ icon, label, value, color, tip }: { icon: string; label: string; value: string; color: string; tip: string }) {
  return (
    <Tip text={tip}>
      <div style={{ background: color + '18', border: `1px solid ${color}55`, borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, cursor: 'help', flex: 1, minWidth: 90 }}>
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
  panel: { background: '#12122a', border: '1px solid #2a2a3e', borderRadius: 14, padding: '20px', color: '#fff', fontFamily: 'monospace', maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 },
  title: { fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: 0 },
  subtitle: { fontSize: '0.72rem', color: '#555', marginTop: 3 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 },
  sectionLabel: { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  signalCard: { border: '1px solid', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  signalTop: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  levelsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 },
  rulesFooter: { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 10, padding: '12px 14px' },
  rulesTitle: { fontSize: '0.68rem', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rulesRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
};

const statStyles: Record<string, React.CSSProperties> = {
  card: { background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { fontSize: '1rem', fontWeight: 'bold' },
  sub: { fontSize: '0.65rem', color: '#444', marginTop: 1 },
};
