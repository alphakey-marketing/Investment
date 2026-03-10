import React, { useState } from 'react';
import { SignalEvent, MAPoint, Candle } from '../types/binance';
import { Lang, tr } from '../i18n';

interface Props {
  signal: SignalEvent | null;
  ma20: MAPoint[];
  ma60: MAPoint[];
  lastPrice: number | null;
  lang: Lang;
  candles?: Candle[];
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 3 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e35', color: '#ddd', padding: '8px 12px', borderRadius: 8,
          fontSize: '0.78rem', whiteSpace: 'normal', zIndex: 200, border: '1px solid #444',
          lineHeight: 1.6, maxWidth: 240, textAlign: 'center', boxShadow: '0 4px 16px #0008',
        }}>{text}</span>
      )}
    </span>
  );
}

function StatCard({ label, value, color, tip, sub }: { label: string; value: string; color?: string; tip?: string; sub?: string }) {
  return (
    <div style={statStyles.card}>
      <div style={statStyles.label}>
        {tip ? <Tip text={tip}><span>{label} <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>ⓘ</span></Tip> : label}
      </div>
      <div style={{ ...statStyles.value, color: color ?? '#fff' }}>{value}</div>
      {sub && <div style={statStyles.sub}>{sub}</div>}
    </div>
  );
}

// ─── Candle Comparison Detail ─────────────────────────────────────────────────
function CandleCompare({
  prevCandle, latestCandle, mode, isEN,
}: {
  prevCandle: Candle | null;
  latestCandle: Candle | null;
  mode: 'high' | 'low';
  isEN: boolean;
}) {
  if (!prevCandle || !latestCandle) {
    return (
      <div style={{ fontSize: '0.78rem', color: '#555', fontStyle: 'italic' }}>
        {isEN ? 'Waiting for candle data…' : '等待K線資料載入…'}
      </div>
    );
  }

  const isHighMode = mode === 'high';
  const prevVal  = isHighMode ? prevCandle.high  : prevCandle.low;
  const currVal  = isHighMode ? latestCandle.high : latestCandle.low;
  const achieved = isHighMode ? currVal > prevVal : currVal < prevVal;
  const diff     = Math.abs(currVal - prevVal);
  const color    = isHighMode ? '#00c853' : '#ff1744';

  const prevLabel  = isEN ? 'Previous candle' : '上一根K線';
  const currLabel  = isEN ? 'Current candle'  : '本根K線';
  const fieldLabel = isHighMode ? (isEN ? 'High' : '高點mpty') : (isEN ? 'Low' : '低點');
  const needLabel  = isHighMode
    ? (isEN ? '← needs to be HIGHER than previous' : '← 需高於上一根')
    : (isEN ? '← needs to be LOWER than previous'  : '← 需低於上一根');

  const statusLine = achieved
    ? (isHighMode
        ? (isEN ? `✅ New High! +$${diff.toFixed(2)} above previous` : `✅ 創新高！高出 $${diff.toFixed(2)}`)
        : (isEN ? `✅ New Low! -$${diff.toFixed(2)} below previous`  : `✅ 創新低！低出 $${diff.toFixed(2)}`))
    : (isHighMode
        ? (isEN ? `❌ $${diff.toFixed(2)} short of a new high` : `❌ 還差 $${diff.toFixed(2)} 才創新高`)
        : (isEN ? `❌ $${diff.toFixed(2)} above previous low (not a new low yet)` : `❌ 還高出 $${diff.toFixed(2)}，尚未創新低`));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {isEN ? `📊 Candle Comparison (${isHighMode ? 'High' : 'Low'} Point):` : `📊 K線比較（${isHighMode ? '高點' : '低點'}）：`}
      </div>

      {/* Comparison rows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Previous candle */}
        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: 3 }}>{prevLabel}</div>
          <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>{fieldLabel}:</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#aaa', fontFamily: 'monospace' }}>
            ${prevVal.toFixed(2)}
          </div>
        </div>

        {/* Current candle */}
        <div style={{
          background: achieved ? color + '18' : '#1a1a2e',
          border: `1px solid ${achieved ? color + '55' : '#2a2a3e'}`,
          borderRadius: 8, padding: '8px 10px',
        }}>
          <div style={{ fontSize: '0.65rem', color: achieved ? color : '#555', marginBottom: 3 }}>{currLabel}</div>
          <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 2 }}>{fieldLabel}:</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: achieved ? color : '#aaa', fontFamily: 'monospace' }}>
            ${currVal.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#555', marginTop: 3, lineHeight: 1.4 }}>{needLabel}</div>
        </div>
      </div>

      {/* Status line */}
      <div style={{
        background: achieved ? color + '15' : '#0f0f1a',
        border: `1px solid ${achieved ? color + '44' : '#1a1a2e'}`,
        borderRadius: 6, padding: '7px 10px',
        fontSize: '0.8rem', color: achieved ? color : '#888', fontWeight: 'bold',
      }}>
        {statusLine}
      </div>

      {/* Mountain climber analogy */}
      <div style={{ background: '#16161e', border: '1px solid #2a2a3e', borderRadius: 7, padding: '8px 10px', fontSize: '0.75rem', color: '#666', lineHeight: 1.6 }}>
        {isHighMode
          ? (isEN
              ? `🏔️ Think of it like a mountain climber. We only buy when the climber reaches a new peak. Right now the climber is at $${currVal.toFixed(2)}, which is ${achieved ? 'higher than' : 'lower than'} the last peak $${prevVal.toFixed(2)}. ${achieved ? '🎉 New high confirmed!' : 'Not a new high yet.'}`
              : `🏔️ 想像登山者。我們只在登山者到達新峰頂時才買入。目前登山者在 $${currVal.toFixed(2)}，${achieved ? '高於' : '低於'}上一峰 $${prevVal.toFixed(2)}。${achieved ? '🎉 已創新高！' : '尚未創新高。'}`) 
          : (isEN
              ? `🧗 Think of it like a diver going deeper. We only short when the diver reaches a new depth. Right now at $${currVal.toFixed(2)}, which is ${achieved ? 'lower than' : 'higher than'} the last depth $${prevVal.toFixed(2)}. ${achieved ? '🎉 New low confirmed!' : 'Not a new low yet.'}`
              : `🧗 想像潛水員潛得更深。我們只在价格創新低點時才做空。目前 $${currVal.toFixed(2)}，${achieved ? '低於' : '高於'}上一個低點 $${prevVal.toFixed(2)}。${achieved ? '🎉 已創新低！' : '尚未創新低。'}`)}
      </div>
    </div>
  );
}

// ─── Live Wait Checklist ───────────────────────────────────────────────────────
function WaitCard({
  lastPrice, latestMA20, latestMA60, isEN, latestCandle, prevCandle,
}: {
  lastPrice: number | null;
  latestMA20: number | null;
  latestMA60: number | null;
  isEN: boolean;
  latestCandle: Candle | null;
  prevCandle: Candle | null;
}) {
  if (!lastPrice || !latestMA20 || !latestMA60) {
    return (
      <div style={wS.card}>
        <div style={wS.icon}>⏳</div>
        <div style={wS.title}>{isEN ? 'Loading data...' : '載入數據中...'}</div>
      </div>
    );
  }

  const PROX = 0.005; // 0.5%

  // ── LONG check ──
  const longZoneLow  = latestMA20 * (1 - PROX);
  const longZoneHigh = latestMA20 * (1 + PROX);
  const nearMA20     = Math.abs(lastPrice - latestMA20) / latestMA20 < PROX;
  const aboveMA20    = lastPrice > latestMA20;
  const longProx     = Math.max(0, 1 - Math.abs(lastPrice - latestMA20) / latestMA20 / PROX);

  // ── SHORT check ──
  const shortZoneLow  = latestMA60 * (1 - PROX);
  const shortZoneHigh = latestMA60 * (1 + PROX);
  const nearMA60      = Math.abs(lastPrice - latestMA60) / latestMA60 < PROX;
  const belowMA60     = lastPrice < latestMA60;
  const shortProx     = Math.max(0, 1 - Math.abs(lastPrice - latestMA60) / latestMA60 / PROX);

  // Distance in dollars
  const distMA20 = Math.abs(lastPrice - latestMA20);
  const distMA60 = Math.abs(lastPrice - latestMA60);

  // ── Live new-high / new-low flags ──
  const newHighMade = latestCandle && prevCandle ? latestCandle.high > prevCandle.high : false;
  const newLowMade  = latestCandle && prevCandle ? latestCandle.low  < prevCandle.low  : false;

  return (
    <div style={wS.card}>
      {/* Header */}
      <div style={wS.header}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span>
        <div>
          <div style={wS.title}>{isEN ? 'Waiting for a signal…' : '等待訊號中…'}</div>
          <div style={wS.subtitle}>
            {isEN
              ? 'Below are the exact conditions needed. Both ✅ must be green at the same time.'
              : '以下是觸發訊號所需的精確條件。兩個 ✅ 必須同時滿足才會觸發。'}
          </div>
        </div>
      </div>

      {/* ── Analogy ── */}
      <div style={wS.analogy}>
        <span style={{ fontSize: '1.1rem' }}>🙉</span>
        <span style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>
          {isEN
            ? `Think of MA20 as a train platform (currently at $${latestMA20.toFixed(2)}). The signal fires only when the price "arrives at the platform" (within 0.5%) AND a new passenger boards (price makes a new high). Right now the train is still en route.`
            : `把 MA20 想像火車月台（目前在 $${latestMA20.toFixed(2)}）。訊號只在價格「抵達月台」（0.5%範圍內）且 同時 有新乘客上車（創新高）時才觸發。現在火車仍在途中。`}
        </span>
      </div>

      <div style={wS.divider} />

      {/* ── LONG checklist ── */}
      <ConditionBlock
        title={isEN ? '🟢 BUY (Long) Signal — needs ALL 3:' : '🟢 買入（做多）訊號 — 需同時滿足共3項：'}
        color="#00c853"
      >
        <CondRow
          ok={aboveMA20}
          label={isEN ? 'Price is ABOVE MA20' : '現價在 MA20 上方'}
          detail={
            aboveMA20
              ? (isEN ? `✅ Yes — $${lastPrice.toFixed(2)} > MA20 $${latestMA20.toFixed(2)}` : `✅ 是 — $${lastPrice.toFixed(2)} > MA20 $${latestMA20.toFixed(2)}`)
              : (isEN ? `❌ No — price $${lastPrice.toFixed(2)} is still BELOW MA20 $${latestMA20.toFixed(2)}` : `❌ 否 — 現價 $${lastPrice.toFixed(2)} 仍低於 MA20 $${latestMA20.toFixed(2)}`)
          }
          tip={isEN ? 'The rule: only buy when price is floating above the MA line.' : '規則：只在價格浮於 MA 線上方時才考慮買入。'}
          color="#00c853"
        />
        <CondRow
          ok={nearMA20}
          label={isEN ? 'Price is close to MA20 (within 0.5%)' : '現價接近 MA20（0.5%範圍內）'}
          detail={
            nearMA20
              ? (isEN ? `✅ Yes — only $${distMA20.toFixed(2)} away (${((distMA20 / latestMA20) * 100).toFixed(2)}%)` : `✅ 是 — 距離只有 $${distMA20.toFixed(2)}（${((distMA20 / latestMA20) * 100).toFixed(2)}%）`)
              : (isEN ? `❌ Still $${distMA20.toFixed(2)} away — need to be within $${(latestMA20 * PROX).toFixed(2)} of MA20` : `❌ 還差 $${distMA20.toFixed(2)} — 需進入 MA20±$${(latestMA20 * PROX).toFixed(2)} 的範圍內`)
          }
          tip={isEN
            ? `The "arrive at the platform" rule. MA20 zone: $${longZoneLow.toFixed(2)} → $${longZoneHigh.toFixed(2)}`
            : `「到位才動」規則。MA20 觸發區間：$${longZoneLow.toFixed(2)} → $${longZoneHigh.toFixed(2)}`}
          color="#00c853"
          progress={longProx}
          progressLabel={isEN
            ? `Zone: $${longZoneLow.toFixed(2)} ← MA20 → $${longZoneHigh.toFixed(2)}`
            : `觸發區：$${longZoneLow.toFixed(2)} ← MA20 $${latestMA20.toFixed(2)} → $${longZoneHigh.toFixed(2)}`}
        />
        <CondRow
          ok={newHighMade}
          pending={!latestCandle || !prevCandle}
          label={isEN ? 'Current candle makes a NEW HIGH vs previous candle' : '本根K線創出比上一根更高的新高'}
          detail={isEN
            ? (newHighMade ? '✅ New high confirmed on this candle.' : '❌ Current candle high has not yet exceeded the previous candle high.')
            : (newHighMade ? '✅ 本根K線已創新高。' : '❌ 本根K線高點尚未超過上一根。')}
          tip={isEN ? 'Prevents false signals on sideways price.' : '防止橫盤時產生假訊號。'}
          color="#00c853"
          extraContent={
            <CandleCompare
              prevCandle={prevCandle}
              latestCandle={latestCandle}
              mode="high"
              isEN={isEN}
            />
          }
        />
      </ConditionBlock>

      <div style={wS.divider} />

      {/* ── SHORT checklist ── */}
      <ConditionBlock
        title={isEN ? '🔴 SELL (Short) Signal — needs ALL 3:' : '🔴 賣出（做空）訊號 — 需同時滿足共3項：'}
        color="#ff1744"
      >
        <CondRow
          ok={belowMA60}
          label={isEN ? 'Price is BELOW MA60' : '現價在 MA60 下方'}
          detail={
            belowMA60
              ? (isEN ? `✅ Yes — $${lastPrice.toFixed(2)} < MA60 $${latestMA60.toFixed(2)}` : `✅ 是 — $${lastPrice.toFixed(2)} < MA60 $${latestMA60.toFixed(2)}`)
              : (isEN ? `❌ No — price $${lastPrice.toFixed(2)} is still ABOVE MA60 $${latestMA60.toFixed(2)}` : `❌ 否 — 現價 $${lastPrice.toFixed(2)} 仍高於 MA60 $${latestMA60.toFixed(2)}`)
          }
          tip={isEN ? 'The rule: only sell/short when price is below the MA60 line.' : '規則：只在價格沉於 MA60 線下方時才考慮賣出。'}
          color="#ff1744"
        />
        <CondRow
          ok={nearMA60}
          label={isEN ? 'Price is close to MA60 (within 0.5%)' : '現價接近 MA60（0.5%範圍內）'}
          detail={
            nearMA60
              ? (isEN ? `✅ Yes — only $${distMA60.toFixed(2)} away (${((distMA60 / latestMA60) * 100).toFixed(2)}%)` : `✅ 是 — 距離只有 $${distMA60.toFixed(2)}（${((distMA60 / latestMA60) * 100).toFixed(2)}%）`)
              : (isEN ? `❌ Still $${distMA60.toFixed(2)} away — need within $${(latestMA60 * PROX).toFixed(2)} of MA60` : `❌ 還差 $${distMA60.toFixed(2)} — 需進入 MA60±$${(latestMA60 * PROX).toFixed(2)} 的範圍內`)
          }
          tip={isEN
            ? `MA60 trigger zone: $${shortZoneLow.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`
            : `MA60 觸發區間：$${shortZoneLow.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`}
          color="#ff1744"
          progress={shortProx}
          progressLabel={isEN
            ? `Zone: $${shortZoneLow.toFixed(2)} ← MA60 → $${shortZoneHigh.toFixed(2)}`
            : `觸發區：$${shortZoneLow.toFixed(2)} ← MA60 $${latestMA60.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`}
        />
        <CondRow
          ok={newLowMade}
          pending={!latestCandle || !prevCandle}
          label={isEN ? 'Current candle makes a NEW LOW vs previous candle' : '本根K線創出比上一根更低的新低'}
          detail={isEN
            ? (newLowMade ? '✅ New low confirmed on this candle.' : '❌ Current candle low has not yet broken below the previous candle low.')
            : (newLowMade ? '✅ 本根K線已創新低。' : '❌ 本根K線低點尚未突破上一根低點。')}
          tip={isEN ? 'Prevents false signals on sideways price.' : '防止橫盤時產生假訊號。'}
          color="#ff1744"
          extraContent={
            <CandleCompare
              prevCandle={prevCandle}
              latestCandle={latestCandle}
              mode="low"
              isEN={isEN}
            />
          }
        />
      </ConditionBlock>

      {/* ── Summary hint ── */}
      <div style={wS.hint}>
        {isEN
          ? `💡 Currently ${longProx > shortProx ? 'closer to a BUY signal' : 'closer to a SELL signal'} — price is ${distMA20 < distMA60 ? `$${distMA20.toFixed(2)} from MA20` : `$${distMA60.toFixed(2)} from MA60`}.`
          : `💡 目前${longProx > shortProx ? '較接近買入訊號' : '較接近賣出訊號'} — 現價距 ${distMA20 < distMA60 ? `MA20 還差 $${distMA20.toFixed(2)}` : `MA60 還差 $${distMA60.toFixed(2)}`}。`}
      </div>
    </div>
  );
}

function ConditionBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color, marginBottom: 2 }}>{title}</div>
      {children}
    </div>
  );
}

function CondRow({
  ok, pending, label, detail, tip, color, progress, progressLabel, extraContent,
}: {
  ok: boolean; pending?: boolean; label: string; detail: string; tip?: string; color: string;
  progress?: number; progressLabel?: string;
  extraContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const icon = pending ? '⏱' : ok ? '✅' : '❌';
  const rowBg = ok ? color + '12' : '#0f0f1a';
  const borderCol = ok ? color + '55' : '#2a2a3e';

  return (
    <div style={{ background: rowBg, border: `1px solid ${borderCol}`, borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
      >
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '0.8rem', color: ok ? color : '#888', flex: 1, fontFamily: 'monospace' }}>{label}</span>
        {tip && (
          <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <Tip text={tip}><span style={{ fontSize: '0.68rem', color: '#444' }}>ⓘ</span></Tip>
          </span>
        )}
        <span style={{ color: '#444', fontSize: '0.7rem', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa', lineHeight: 1.6 }}>{detail}</div>
          {progress !== undefined && (
            <div>
              <div style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>{progressLabel}</div>
              <div style={{ background: '#1a1a2e', borderRadius: 4, height: 8, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  height: '100%',
                  background: progress >= 1 ? color : `linear-gradient(90deg, ${color}44, ${color})`,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: progress >= 1 ? color : '#555', marginTop: 3, textAlign: 'right' }}>
                {progress >= 1 ? '✅ In zone!' : `${(progress * 100).toFixed(0)}% of the way there`}
              </div>
            </div>
          )}
          {extraContent && (
            <div style={{ marginTop: 6 }}>{extraContent}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Beginner Guide ───────────────────────────────────────────────────
function BeginnerGuide({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isEN = lang === 'EN';
  return (
    <div style={guide.wrapper}>
      <button onClick={() => setOpen(!open)} style={guide.toggle}>
        <span>{open ? '▼' : '▶'}</span>
        <span>{isEN ? '📖 Beginner Guide — What does everything mean?' : '📖 新手指南 — 每個數字代表什麼？'}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#444' }}>{open ? (isEN ? 'hide' : '收起') : (isEN ? 'show' : '展開')}</span>
      </button>
      {open && (
        <div style={guide.body}>
          <Section color="#f0b90b" title={isEN ? '🗺️ What is this app?' : '🗺️ 這個 App 是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'A traffic light for trading. It watches Gold / BTC / ETH around the clock and alerts you when rule-based conditions are met to BUY or SELL.'
                : '一個交易用的交通燈號系統。全天候監測黃金/BTC/ETH，在規則條件滿足時提示你買入或賣出。'}
            </p>
            <p style={guide.p}>{isEN ? '⚠️ It shows signals only — it does NOT place trades for you.' : '⚠️ 只顯示訊號，不會自動下單。'}</p>
          </Section>

          <Section color="#29b6f6" title={isEN ? '📊 Dashboard numbers explained' : '📊 面板數字說明'}>
            <GuideItem tag={isEN ? 'Current Price' : '現價'} tagColor="#f0b90b">
              {isEN ? 'The live price right now, updated every 10 seconds. Like the price tag on a shelf.' : '即時市場價格，每10秒更新。就像貨架上的標價貼，隨時在變。'}
            </GuideItem>
            <GuideItem tag="MA20" tagColor="#29b6f6">
              {isEN ? 'Average of last 20 candle closes — the market\'s "recent mood". Above it = bullish.' : '最近20根K線收盤均値——市場的「近期情緒」。現價在上 = 多頭。'}
            </GuideItem>
            <GuideItem tag="MA60" tagColor="#ab47bc">
              {isEN ? 'Average of last 60 candles — big-picture direction. Below it = bearish.' : '最近60根K線均値——大方向趨勢。現價在下 = 空頭。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Trend' : '趨勢'} tagColor="#888">
              {isEN ? 'Bullish = price above MA20 (boat on water). Bearish = price below (boat sinking).' : '多頭 = 價格浮在MA20上（船在水面）。空頭 = 價格沉在線下（船沉水底）。'}
            </GuideItem>
          </Section>

          <Section color="#888" title={isEN ? '📊 What is a candle (K-line)?' : '📊 K線是什麼？'}>
            <GuideItem tag={isEN ? 'Candle / K-line' : 'K線 / 螺烛圖'} tagColor="#888">
              {isEN
                ? 'A candle = 1 price bar on the chart. On a 1H chart, each candle = 1 hour of trading. It shows the open, high, low, and close price for that period. The "new high" condition compares the highest price reached this candle vs. the previous candle.'
                : 'K線 = 圖表上的一根價格樯。在一小時圖上，每根K線 = 1小時的交易。包含開盤、最高、最低和收盤價。「創新高」條件比較本根K線最高價與上一根K線最高價。'}
            </GuideItem>
          </Section>

          <Section color="#00c853" title={isEN ? '🚦 What triggers a signal?' : '🚦 什麼情況會觸發訊號？'}>
            <GuideItem tag={isEN ? '🟢 BUY' : '🟢 買入'} tagColor="#00c853">
              {isEN ? 'Price is above MA20 + within 0.5% of MA20 + current candle makes a new high. All 3 together = green light.' : '現價在MA20上方 + 距MA20偵0.5%以內 + 本根K線創新高。三個同時滿足 = 綠燈。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🔴 SELL' : '🔴 賣出'} tagColor="#ff1744">
              {isEN ? 'Price is below MA60 + within 0.5% of MA60 + current candle makes a new low. All 3 together = red light.' : '現價在MA60下方 + 距MA60偵0.5%以內 + 本根K線創新低。三個同時滿足 = 紅燈。'}
            </GuideItem>
            <GuideItem tag={isEN ? '⏳ Waiting' : '⏳ 等待'} tagColor="#888">
              {isEN ? 'Not all 3 conditions are met yet. The checklist above shows exactly how far away each condition is in real dollars.' : '3個條件未同時滿足。上方的條件清單會實時顯示每個條件距離觸發還差多少美元。'}
            </GuideItem>
          </Section>

          <Section color="#ff9800" title={isEN ? '💰 Stop Loss & Take Profit' : '💰 止蝕 & 止盈'}>
            <GuideItem tag={isEN ? '🛑 Stop Loss' : '🛑 止蝕'} tagColor="#ff1744">
              {isEN ? 'Auto-exit if price moves against you by 1%. Like an insurance policy — small fixed cost to avoid a big disaster.' : '若價格反向移動1%自動離場。就像保險——付小額保費防大損失。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🎯 Take Profit' : '🎯 止盈'} tagColor="#00c853">
              {isEN ? 'Target exit at +3% profit. You aim to earn 3× what you risk.' : '目標在+3%利潤離場。目標是賺取風險的3倍。'}
            </GuideItem>
            <GuideItem tag={isEN ? '⚖️ R:R 3:1' : '⚖️ 盈蹧比 3:1'} tagColor="#f0b90b">
              {isEN ? 'For every $1 risked, target $3 profit. Even with only 40% wins, you\'re profitable long-term.' : '每冒$1風險，目標賺$3。即使只有40%勝率，長期仍盈利。'}
            </GuideItem>
          </Section>

          <div style={{ background: '#1a1500', border: '1px solid #f0b90b44', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#f0b90b', lineHeight: 1.7 }}>
            {isEN ? '⚠️ For educational reference only. Not financial advice. Always practice with Paper Trading before using real money.' : '⚠️ 僅供教學參考，非投資建議。使用真實資金前請先在模擬盤充分練習。'}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.82rem', color, fontWeight: 'bold', borderBottom: `1px solid ${color}33`, paddingBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function GuideItem({ tag, tagColor, children }: { tag: string; tagColor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 }}>
      <span style={{ background: tagColor + '22', color: tagColor, border: `1px solid ${tagColor}55`, padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>{tag}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────
export default function SignalPanel({ signal, ma20, ma60, lastPrice, lang, candles }: Props) {
  const latestMA20 = ma20[ma20.length - 1]?.value ?? null;
  const latestMA60 = ma60[ma60.length - 1]?.value ?? null;
  const isEN = lang === 'EN';
  const isBull = lastPrice && latestMA20 ? lastPrice > latestMA20 : null;

  const latestCandle = candles && candles.length >= 2 ? candles[candles.length - 1] : null;
  const prevCandle   = candles && candles.length >= 2 ? candles[candles.length - 2] : null;

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
        <StatCard label="MA20" value={`$${latestMA20?.toFixed(2) ?? '---'}`} color="#29b6f6"
          tip={isEN ? 'Average of last 20 candles. Short-term trend. Price above = bullish.' : '最近20根K線均値，短期趨勢。現價在上 = 多頭。'}
          sub={isEN ? 'Short-term avg' : '短期均線'} />
        <StatCard label="MA60" value={`$${latestMA60?.toFixed(2) ?? '---'}`} color="#ab47bc"
          tip={isEN ? 'Average of last 60 candles. Big-picture trend. Price below = bearish.' : '最近60根K線均値，長期趨勢。現價在下 = 空頭。'}
          sub={isEN ? 'Long-term avg' : '長期均線'} />
        <StatCard
          label={isEN ? 'Trend' : '趨勢'}
          value={isBull === null ? '---' : isBull ? (isEN ? '⬆ Bullish' : '⬆ 多頭') : (isEN ? '⬇ Bearish' : '⬇ 空頭')}
          color={isBull === null ? '#888' : isBull ? '#00c853' : '#ff1744'}
          tip={isEN ? 'Bullish = price above MA20 (boat on water). Bearish = price below (boat sinking).' : '多頭 = 價格浮在MA20上如船在水面；空頭 = 沉在線下。'}
          sub={isEN ? 'Above = Bullish / Below = Bearish' : '線上多頭 / 線下空頭'} />
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
                tip={isEN ? 'Suggested entry price when signal triggered' : '訊號觸發時的建議入場價格'} />
              <LevelBadge icon="🛑" label={isEN ? 'Stop Loss' : '止蝕'}
                value={`$${(signal.type === 'LONG' ? signal.price * 0.99 : signal.price * 1.01).toFixed(2)}`} color="#ff5252"
                tip={isEN ? 'Exit here if trade goes wrong. Limits your loss to ~1%.' : '交易出錯時在此離場，損失限制在坧1%。'} />
              <LevelBadge icon="🎯" label={isEN ? 'Take Profit' : '止盈'}
                value={`$${(signal.type === 'LONG' ? signal.price * 1.03 : signal.price * 0.97).toFixed(2)}`} color="#00c853"
                tip={isEN ? 'Target exit. Profit = 3× stop loss distance.' : '目標離場。利潤 = 止蝕距離的3倍。'} />
              <LevelBadge icon="⚖️" label={isEN ? 'R:R Ratio' : '盈蹧比'} value="3 : 1" color="#f0b90b"
                tip={isEN ? 'Risk $1 to make $3. Works long-term even at 40% win rate.' : '冒$1賺$3。即使40%勝率長期仍盈利。'} />
            </div>
          </div>
        ) : (
          <WaitCard
            lastPrice={lastPrice}
            latestMA20={latestMA20}
            latestMA60={latestMA60}
            isEN={isEN}
            latestCandle={latestCandle}
            prevCandle={prevCandle}
          />
        )}
      </div>

      <BeginnerGuide lang={lang} />

      {/* 3 Rules */}
      <div style={styles.rulesFooter}>
        <div style={styles.rulesTitle}>{isEN ? '📖 The 3 MA Rules' : '📖 K均三大原則'}</div>
        <div style={styles.rulesRow}>
          <RulePill num="1" text={isEN ? 'Above line → Buy' : '線上做多'} color="#00c853" />
          <RulePill num="2" text={isEN ? 'Wait for the line' : '到位才動'} color="#f0b90b" />
          <RulePill num="3" text={isEN ? 'R:R = 3:1' : '盈蹧比3:1'} color="#ab47bc" />
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

const guide: Record<string, React.CSSProperties> = {
  wrapper: {},
  toggle: { width: '100%', background: '#16161e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' },
  body: { background: '#0d0d1e', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 },
  p: { margin: '0 0 4px', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 },
};

const wS: Record<string, React.CSSProperties> = {
  card: { background: '#0f0f1a', border: '1px dashed #2a2a3e', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  header: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  icon: { fontSize: '1.5rem', flexShrink: 0 },
  title: { fontSize: '0.95rem', color: '#888', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '0.75rem', color: '#555', marginTop: 4, lineHeight: 1.5 },
  analogy: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#16161e', border: '1px solid #2a2a3e', borderRadius: 8, padding: '10px 12px' },
  divider: { borderTop: '1px solid #1a1a2e' },
  hint: { background: '#1a1a2e', borderRadius: 8, padding: '9px 12px', fontSize: '0.78rem', color: '#888', lineHeight: 1.6 },
};
