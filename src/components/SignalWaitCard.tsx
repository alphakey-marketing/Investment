/**
 * SignalWaitCard.tsx — K均交易法 v2
 *
 * Shows the real-time status of all 5 gates that must pass before
 * a signal fires. Rebuilt from scratch to match signal.ts exactly.
 *
 * Previous version showed MA5/MA30 proximity — which is NOT what
 * signal.ts checks. This version shows the actual 5-gate logic:
 *   Gate 1: HKEX session
 *   Gate 2: MA triple stack (BULL / BEAR / RANGE)
 *   Gate 3: Swing structure (HH for LONG, LL for SHORT)
 *   Gate 4: Breakout confirmed (price > swing high, or < swing low)
 *   Gate 5: MA30 proximity (within 0.8%)
 */
import React, { useState } from 'react';
import { SwingPoint } from '../utils/swingPoints';
import { MAStack }    from '../utils/maTrend';
import Tip            from './Tip';

interface WaitCardProps {
  lastPrice:       number | null;
  latestMA30:      number | null;
  latestMA150:     number | null;
  maStack:         MAStack | null;
  isInSession:     boolean;
  swingHighs:      SwingPoint[]; // latest 2 confirmed swing HIGHs [older, newer]
  swingLows:       SwingPoint[]; // latest 2 confirmed swing LOWs  [older, newer]
  isEN:            boolean;
}

export default function WaitCard({
  lastPrice,
  latestMA30,
  latestMA150,
  maStack,
  isInSession,
  swingHighs,
  swingLows,
  isEN,
}: WaitCardProps) {

  if (!lastPrice) {
    return (
      <div style={wS.card}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <div style={wS.title}>{isEN ? 'Loading data...' : '載入數據中...'}</div>
      </div>
    );
  }

  const price = lastPrice;

  // ── Gate 1: Session ──────────────────────────────────────────────────────
  const g1ok = isInSession;

  // ── Gate 2: MA Stack ─────────────────────────────────────────────────────
  const trend     = maStack?.trend ?? null;
  const ma5val    = maStack?.ma5   ?? null;
  const ma30val   = maStack?.ma30  ?? latestMA30;
  const ma150val  = maStack?.ma150 ?? latestMA150;
  const g2bull    = trend === 'BULL';
  const g2bear    = trend === 'BEAR';
  const g2ok      = g2bull || g2bear;

  // ── Gate 3: Swing structure ───────────────────────────────────────────────
  // LONG: latest swing HIGH must be a HH (higher than previous swing HIGH)
  const lastHigh  = swingHighs.length >= 1 ? swingHighs[swingHighs.length - 1] : null;
  const prevHigh  = swingHighs.length >= 2 ? swingHighs[swingHighs.length - 2] : null;
  const isHH      = lastHigh && prevHigh ? lastHigh.price > prevHigh.price : false;

  // SHORT: latest swing LOW must be a LL (lower than previous swing LOW)
  const lastLow   = swingLows.length >= 1 ? swingLows[swingLows.length - 1] : null;
  const prevLow   = swingLows.length >= 2 ? swingLows[swingLows.length - 2] : null;
  const isLL      = lastLow && prevLow ? lastLow.price < prevLow.price : false;

  const g3longOk  = g2bull && isHH;
  const g3shortOk = g2bear && isLL;

  // ── Gate 4: Breakout ──────────────────────────────────────────────────────
  const g4longOk  = g3longOk  && lastHigh  != null && price > lastHigh.price;
  const g4shortOk = g3shortOk && lastLow   != null && price < lastLow.price;

  // ── Gate 5: MA30 proximity (0.8%) ────────────────────────────────────────
  const PROX = 0.008;
  const ma30 = ma30val ?? 0;
  const distFromMA30Pct = ma30 > 0 ? Math.abs(price - ma30) / ma30 : 1;
  const isNearMA30Long  = price >= ma30 && distFromMA30Pct <= PROX;
  const isNearMA30Short = price <= ma30 && distFromMA30Pct <= PROX;
  const g5longOk        = g2bull && isNearMA30Long;
  const g5shortOk       = g2bear && isNearMA30Short;
  const ma30ProxProg    = Math.max(0, 1 - distFromMA30Pct / PROX);

  // ── Overall readiness ────────────────────────────────────────────────────
  // Which direction are we checking? Follow the MA stack.
  const isLongMode  = g2bull || (!g2bear); // default to LONG if RANGE/unknown
  const gatesLong   = [g1ok, g2bull, g3longOk,  g4longOk,  g5longOk];
  const gatesShort  = [g1ok, g2bear, g3shortOk, g4shortOk, g5shortOk];
  const activeGates = isLongMode ? gatesLong : gatesShort;
  const passCount   = activeGates.filter(Boolean).length;

  return (
    <div style={wS.card}>

      {/* ── Header ── */}
      <div style={wS.header}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span>
        <div>
          <div style={wS.title}>{isEN ? 'Waiting for a signal…' : '等待訊號中…'}</div>
          <div style={wS.subtitle}>
            {isEN
              ? `${passCount}/5 gates passed — all 5 must be green simultaneously.`
              : `${passCount}/5 個條件達成 — 必須5個同時綠色才觸發訊號。`}
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div>
        <div style={{ background: '#1a1a2e', borderRadius: 6, height: 6, overflow: 'hidden' }}>
          <div style={{
            width: `${(passCount / 5) * 100}%`,
            height: '100%',
            background: passCount === 5 ? '#00c853' : passCount >= 3 ? '#f0b90b' : '#ff5252',
            borderRadius: 6,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 4 }}>
          {passCount === 5
            ? (isEN ? '🚀 All gates passed — signal should fire!' : '🚀 全部條件達成 — 訊號應已觸發！')
            : isEN ? `Still waiting for ${5 - passCount} more condition(s)` : `仍需 ${5 - passCount} 個條件`}
        </div>
      </div>

      {/* ── Analogy ── */}
      <div style={wS.analogy}>
        <span style={{ fontSize: '1.1rem' }}>🏔️</span>
        <span style={{ fontSize: '0.78rem', color: '#888', lineHeight: 1.6 }}>
          {isEN
            ? 'Think of a swing high as a mountain summit. A BUY signal needs: (1) all MAs pointing up, (2) this summit is higher than the last one (HH), (3) price has just climbed past the summit (breakout), (4) price is still near the MA30 mid-slope — not already at the top.'
            : '把前高點想像成山頂。買入訊號需要：(1) 三條均線全部向上排列，(2) 這座山頂比上一座更高（Higher High），(3) 價格剛剛突破了山頂（突破確認），(4) 價格仍然靠近 MA30 半山腰——而非已到山頂遠處。'}
        </span>
      </div>

      <div style={wS.divider} />

      {/* ════════════════════════════════════════════════════
          GATE 1 — SESSION
      ════════════════════════════════════════════════════ */}
      <GateRow
        num={1}
        ok={g1ok}
        label={isEN ? 'HKEX Trading Session' : '香港交易時段'}
        detail={g1ok
          ? (isEN ? '✅ Market is open — signals are active.' : '✅ 市場開放中，訊號運行中。')
          : (isEN ? '❌ Market is closed (outside 09:15–16:30 HKT). No signals fire outside trading hours.' : '❌ 市場已收市（香港時間 09:15–16:30 外）。收市後不發訊號。')}
        tip={isEN
          ? '3081.HK is an ETF — no evening session. Signals only fire during morning (09:15–12:00) and afternoon (13:00–16:30) HKT.'
          : '3081.HK 是 ETF，沒有夜市。訊號只在港股上午（09:15–12:00）及下午（13:00–16:30）時段觸發。'}
        isEN={isEN}
      />

      {/* ════════════════════════════════════════════════════
          GATE 2 — MA STACK
      ════════════════════════════════════════════════════ */}
      <GateRow
        num={2}
        ok={g2ok}
        label={isEN ? 'Triple MA Stack (BULL or BEAR)' : '三線堆疊（多頭或空頭）'}
        detail={
          trend === 'BULL'
            ? (isEN
                ? `✅ BULL — MA5(${ma5val?.toFixed(2)}) > MA30(${ma30val?.toFixed(2)}) > MA150(${ma150val?.toFixed(2)}). Only LONG trades allowed.`
                : `✅ 多頭 — MA5(${ma5val?.toFixed(2)}) > MA30(${ma30val?.toFixed(2)}) > MA150(${ma150val?.toFixed(2)})。只做多。`)
            : trend === 'BEAR'
            ? (isEN
                ? `✅ BEAR — MA5(${ma5val?.toFixed(2)}) < MA30(${ma30val?.toFixed(2)}) < MA150(${ma150val?.toFixed(2)}). Only SHORT trades allowed.`
                : `✅ 空頭 — MA5(${ma5val?.toFixed(2)}) < MA30(${ma30val?.toFixed(2)}) < MA150(${ma150val?.toFixed(2)})。只做空。`)
            : (isEN
                ? `❌ RANGE — MAs are mixed or crossing. Stand aside completely until a clean stack forms.`
                : `❌ 橫盤 — 均線排列混亂或交叉中。等待乾淨堆疊出現後再行動。`)
        }
        tip={isEN
          ? 'BULL = MA5 > MA30 > MA150 (all aligned up). BEAR = MA5 < MA30 < MA150 (all down). RANGE = any other order → no trade.'
          : '多頭 = MA5 > MA30 > MA150（全線向上）。空頭 = MA5 < MA30 < MA150（全線向下）。橫盤 = 其他排列 → 不交易。'}
        isEN={isEN}
      />

      <div style={wS.divider} />

      {/* ════════════════════════════════════════════════════
          GATE 3 — SWING STRUCTURE
      ════════════════════════════════════════════════════ */}
      {/* LONG side */}
      {(g2bull || trend === 'RANGE' || trend === null) && (
        <GateRow
          num={3}
          ok={g3longOk}
          label={isEN ? 'Swing Structure: Higher High (for LONG)' : '擺動結構：更高的前高（做多用）'}
          detail={
            !lastHigh
              ? (isEN ? '⏱ Not enough swing highs detected yet. Need at least 2 confirmed pivots.' : '⏱ 尚未檢測到足夠的前高點，需至少 2 個確認拐點。')
              : !prevHigh
              ? (isEN ? '⏱ Only 1 swing high found. Need 2 to compare.' : '⏱ 只找到 1 個前高，需要 2 個才能比較。')
              : isHH
              ? (isEN
                  ? `✅ Higher High confirmed — latest swing high ${lastHigh.price.toFixed(2)} > previous ${prevHigh.price.toFixed(2)}. Bullish structure intact.`
                  : `✅ 確認更高前高 — 最新前高 ${lastHigh.price.toFixed(2)} > 上一個 ${prevHigh.price.toFixed(2)}。多頭結構完整。`)
              : (isEN
                  ? `❌ Lower High (LH) — latest swing high ${lastHigh.price.toFixed(2)} ≤ previous ${prevHigh?.price.toFixed(2)}. Trend may be weakening. Wait for a new HH.`
                  : `❌ 較低前高（LH）— 最新前高 ${lastHigh.price.toFixed(2)} ≤ 上一個 ${prevHigh?.price.toFixed(2)}。趨勢可能轉弱，等待新的更高前高出現。`)
          }
          tip={isEN
            ? 'HH = Higher High. The most recent swing high must be above the previous one. This confirms the market is making upward progress — buyers are stronger than the last peak.'
            : 'HH = 更高前高。最新的擺動高點必須高於上一個。這確認市場正在向上推進——買方比上次更強。'}
          isEN={isEN}
        />
      )}

      {/* SHORT side */}
      {g2bear && (
        <GateRow
          num={3}
          ok={g3shortOk}
          label={isEN ? 'Swing Structure: Lower Low (for SHORT)' : '擺動結構：更低的前低（做空用）'}
          detail={
            !lastLow
              ? (isEN ? '⏱ Not enough swing lows detected yet.' : '⏱ 尚未檢測到足夠的前低點。')
              : !prevLow
              ? (isEN ? '⏱ Only 1 swing low found. Need 2 to compare.' : '⏱ 只找到 1 個前低，需要 2 個才能比較。')
              : isLL
              ? (isEN
                  ? `✅ Lower Low confirmed — latest swing low ${lastLow.price.toFixed(2)} < previous ${prevLow.price.toFixed(2)}. Bearish structure intact.`
                  : `✅ 確認更低前低 — 最新前低 ${lastLow.price.toFixed(2)} < 上一個 ${prevLow.price.toFixed(2)}。空頭結構完整。`)
              : (isEN
                  ? `❌ Higher Low (HL) — latest swing low ${lastLow.price.toFixed(2)} ≥ previous ${prevLow?.price.toFixed(2)}. Wait for a new LL.`
                  : `❌ 較高前低（HL）— 最新前低 ${lastLow.price.toFixed(2)} ≥ 上一個 ${prevLow?.price.toFixed(2)}。等待新的更低前低出現。`)
          }
          tip={isEN
            ? 'LL = Lower Low. The most recent swing low must be below the previous one — sellers are gaining control.'
            : 'LL = 更低前低。最新的擺動低點必須低於上一個——賣方在加速控場。'}
          isEN={isEN}
        />
      )}

      {/* ════════════════════════════════════════════════════
          GATE 4 — BREAKOUT
      ════════════════════════════════════════════════════ */}
      {g2bull && (
        <GateRow
          num={4}
          ok={g4longOk}
          label={isEN ? 'Breakout: Price closed above swing high' : '突破確認：收盤價突破前高'}
          detail={
            !lastHigh
              ? (isEN ? '⏱ Waiting for Gate 3 first.' : '⏱ 等待條件3先達成。')
              : g4longOk
              ? (isEN
                  ? `✅ Breakout confirmed — price ${price.toFixed(2)} has closed above swing high ${lastHigh.price.toFixed(2)}.`
                  : `✅ 突破確認 — 現價 ${price.toFixed(2)} 已收盤突破前高 ${lastHigh.price.toFixed(2)}。`)
              : (isEN
                  ? `❌ Not yet — price ${price.toFixed(2)} needs to close above ${lastHigh.price.toFixed(2)} (${(lastHigh.price - price).toFixed(2)} away).`
                  : `❌ 尚未突破 — 現價 ${price.toFixed(2)}，需收盤突破 ${lastHigh.price.toFixed(2)}（還差 ${(lastHigh.price - price).toFixed(2)}）。`)
          }
          tip={isEN
            ? 'The signal fires on the breakout candle itself — not before. Entering before the break is anticipating, not confirming.'
            : '訊號在突破的那根K線觸發，而非提前入場。在突破前進場是預判，不是確認。'}
          progress={lastHigh ? Math.min((price / lastHigh.price), 1.0) : undefined}
          progressLabel={lastHigh
            ? (isEN
                ? `Price ${price.toFixed(2)} → Target breakout: ${lastHigh.price.toFixed(2)}`
                : `現價 ${price.toFixed(2)} → 突破目標：${lastHigh.price.toFixed(2)}`)
            : undefined}
          isEN={isEN}
        />
      )}

      {g2bear && (
        <GateRow
          num={4}
          ok={g4shortOk}
          label={isEN ? 'Breakout: Price closed below swing low' : '突破確認：收盤價跌破前低'}
          detail={
            !lastLow
              ? (isEN ? '⏱ Waiting for Gate 3 first.' : '⏱ 等待條件3先達成。')
              : g4shortOk
              ? (isEN
                  ? `✅ Breakdown confirmed — price ${price.toFixed(2)} has closed below swing low ${lastLow.price.toFixed(2)}.`
                  : `✅ 跌破確認 — 現價 ${price.toFixed(2)} 已收盤跌破前低 ${lastLow.price.toFixed(2)}。`)
              : (isEN
                  ? `❌ Not yet — price ${price.toFixed(2)} needs to close below ${lastLow.price.toFixed(2)} (${(price - lastLow.price).toFixed(2)} away).`
                  : `❌ 尚未跌破 — 現價 ${price.toFixed(2)}，需收盤跌破 ${lastLow.price.toFixed(2)}（還差 ${(price - lastLow.price).toFixed(2)}）。`)
          }
          tip={isEN
            ? 'Entry is on confirmed breakdown — price must close below the swing low, not just touch it.'
            : '在確認跌破後入場——收盤價必須低於前低，而非僅觸及。'}
          progress={lastLow ? Math.min((lastLow.price / price), 1.0) : undefined}
          progressLabel={lastLow
            ? (isEN
                ? `Price ${price.toFixed(2)} → Target breakdown: ${lastLow.price.toFixed(2)}`
                : `現價 ${price.toFixed(2)} → 跌破目標：${lastLow.price.toFixed(2)}`)
            : undefined}
          isEN={isEN}
        />
      )}

      {/* ════════════════════════════════════════════════════
          GATE 5 — MA30 PROXIMITY
      ════════════════════════════════════════════════════ */}
      <GateRow
        num={5}
        ok={g2bull ? g5longOk : g2bear ? g5shortOk : false}
        label={isEN ? 'MA30 Proximity — entry near the trend anchor (≤ 0.8%)' : 'MA30 靠近度 — 在趨勢錨點附近入場（≤ 0.8%）'}
        detail={
          !ma30val
            ? (isEN ? '⏱ MA30 not yet calculated.' : '⏱ MA30 尚未計算。')
            : (g2bull ? g5longOk : g5shortOk)
            ? (isEN
                ? `✅ Price ${price.toFixed(2)} is within ${(distFromMA30Pct * 100).toFixed(2)}% of MA30 (${ma30val.toFixed(2)}) — good entry zone.`
                : `✅ 現價 ${price.toFixed(2)} 距 MA30（${ma30val.toFixed(2)}）僅 ${(distFromMA30Pct * 100).toFixed(2)}%，入場區間良好。`)
            : (isEN
                ? `❌ Price ${price.toFixed(2)} is ${(distFromMA30Pct * 100).toFixed(2)}% from MA30 (${ma30val.toFixed(2)}) — too far. Max allowed: 0.8%. Wait for a pullback.`
                : `❌ 現價 ${price.toFixed(2)} 距 MA30（${ma30val.toFixed(2)}）已達 ${(distFromMA30Pct * 100).toFixed(2)}%，超出 0.8% 上限。等待回調靠近均線。`)
        }
        tip={isEN
          ? 'The "don\'t chase" rule. MA30 acts as dynamic support (LONG) or resistance (SHORT). Entry must be close to it — if price has already run 2% away, the risk:reward is degraded. Wait for a pullback.'
          : '「不追高」規則。MA30 作為動態支撐（做多）或壓力（做空）。入場必須靠近均線——若價格已偏離 2%，風報比已惡化。等待回調。'}
        progress={ma30ProxProg}
        progressLabel={ma30val
          ? (isEN
              ? `Distance from MA30: ${(distFromMA30Pct * 100).toFixed(2)}% (limit 0.8%)`
              : `距 MA30 偏離：${(distFromMA30Pct * 100).toFixed(2)}%（上限 0.8%）`)
          : undefined}
        isEN={isEN}
      />

      {/* ── Summary hint ── */}
      <div style={wS.hint}>
        {trend === 'RANGE'
          ? (isEN
              ? '⏸ Market is in RANGE. The system stands aside — no LONG or SHORT setups until the MA stack aligns cleanly.'
              : '⏸ 市場橫盤中。系統暫停——等到均線乾淨排列後再行動，多空均不做。')
          : (isEN
              ? `💡 Current direction: ${g2bull ? '🟢 LONG setup' : '🔴 SHORT setup'} — ${passCount}/5 gates passed. ${passCount < 5 ? `Closest gap: Gate ${activeGates.indexOf(false) + 1}.` : 'All gates passed!'}`
              : `💡 當前方向：${g2bull ? '🟢 做多準備' : '🔴 做空準備'} — ${passCount}/5 條件達成。${passCount < 5 ? `最近的缺口：條件 ${activeGates.indexOf(false) + 1}。` : '全部條件達成！'}`)}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function GateRow({
  num, ok, label, detail, tip, progress, progressLabel, isEN,
}: {
  num: number; ok: boolean; label: string; detail: string; tip?: string;
  progress?: number; progressLabel?: string; isEN: boolean;
}) {
  const [open, setOpen] = useState(false);
  const color     = ok ? '#00c853' : '#555';
  const borderCol = ok ? '#00c85355' : '#2a2a3e';
  const rowBg     = ok ? '#00c85312' : '#0f0f1a';

  return (
    <div style={{ background: rowBg, border: `1px solid ${borderCol}`, borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
      >
        {/* Gate number badge */}
        <span style={{
          background: ok ? '#00c853' : '#1a1a2e',
          color: ok ? '#000' : '#555',
          borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', flexShrink: 0,
        }}>
          {ok ? '✓' : num}
        </span>
        <span style={{ fontSize: '0.8rem', color, flex: 1, fontFamily: 'monospace' }}>{label}</span>
        {tip && (
          <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <Tip text={tip}><span style={{ fontSize: '0.68rem', color: '#444' }}>ⓘ</span></Tip>
          </span>
        )}
        <span style={{ color: '#444', fontSize: '0.7rem', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa', lineHeight: 1.6 }}>{detail}</div>
          {progress !== undefined && progressLabel && (
            <div>
              <div style={{ fontSize: '0.68rem', color: '#555', marginBottom: 4 }}>{progressLabel}</div>
              <div style={{ background: '#1a1a2e', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  height: '100%',
                  background: progress >= 1 ? '#00c853' : `linear-gradient(90deg, #f0b90b44, #f0b90b)`,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: progress >= 1 ? '#00c853' : '#f0b90b', marginTop: 3, textAlign: 'right' }}>
                {progress >= 1
                  ? (isEN ? '✅ Condition met!' : '✅ 條件達成！')
                  : `${Math.min(progress * 100, 100).toFixed(0)}%`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const wS: Record<string, React.CSSProperties> = {
  card:     { background: '#0f0f1a', border: '1px dashed #2a2a3e', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  header:   { display: 'flex', gap: 12, alignItems: 'flex-start' },
  title:    { fontSize: '0.95rem', color: '#888', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '0.75rem', color: '#555', marginTop: 4, lineHeight: 1.5 },
  analogy:  { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#16161e', border: '1px solid #2a2a3e', borderRadius: 8, padding: '10px 12px' },
  divider:  { borderTop: '1px solid #1a1a2e' },
  hint:     { background: '#1a1a2e', borderRadius: 8, padding: '9px 12px', fontSize: '0.78rem', color: '#888', lineHeight: 1.6 },
};