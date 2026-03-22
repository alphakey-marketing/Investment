/**
 * SignalBeginnerGuide.tsx — K均交易法 v2
 *
 * Previously described the old MA20/MA60 strategy with fixed 1% SL,
 * 3% TP and 3:1 R:R. Updated to reflect v2 logic:
 *   - Triple MA stack (MA5/MA30/MA150)
 *   - HH/LL swing point breakout entry
 *   - Structure-based dynamic stop loss (placed at swing low/high)
 *   - NO fixed take profit — trailing stop only
 *   - Minimum 2.5:1 R:R, unlimited upside
 */
import React, { useState } from 'react';
import { Lang } from '../i18n';

export default function BeginnerGuide({ lang }: { lang: Lang }) {
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

          {/* ── What is this app ── */}
          <Section color="#f0b90b" title={isEN ? '🗺️ What is this app?' : '🗺️ 這個 App 是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'A rule-based signal system for Hong Kong ETFs and futures. It monitors the market and alerts you when all 5 entry conditions are met simultaneously based on the K均交易法 v2 strategy.'
                : '一個基於規則的香港 ETF 及期貨訊號系統。全天候監測市場，當所有 5 個入場條件同時達成時發出提示，基於「K均交易法 v2」策略。'}
            </p>
            <p style={guide.p}>{isEN ? '⚠️ It shows signals only — it does NOT place trades for you.' : '⚠️ 只顯示訊號，不會自動下單。'}</p>
          </Section>

          {/* ── Dashboard numbers ── */}
          <Section color="#29b6f6" title={isEN ? '📊 Dashboard numbers explained' : '📊 面板數字說明'}>
            <GuideItem tag={isEN ? 'Current Price' : '現價'} tagColor="#f0b90b">
              {isEN ? 'The live price right now, updated every 10 seconds.' : '即時市場價格，每10秒更新。'}
            </GuideItem>
            <GuideItem tag="MA5" tagColor="#2196f3">
              {isEN
                ? 'Average of last 5 candles — the fastest line. When it\'s above MA30 and MA150, short-term momentum is bullish.'
                : '最近5根K線均值——最快的均線。當它高於 MA30 和 MA150 時，短期動能為多頭。'}
            </GuideItem>
            <GuideItem tag="MA30" tagColor="#ff9800">
              {isEN
                ? 'Average of last 30 candles — the entry anchor. The signal fires when price is near this line (within 0.8%). Think of it as dynamic support (LONG) or resistance (SHORT).'
                : '最近30根K線均值——入場錨點。價格靠近此線（0.8%以內）時才觸發訊號。可理解為動態支撐（做多）或壓力（做空）。'}
            </GuideItem>
            <GuideItem tag="MA150" tagColor="#ab47bc">
              {isEN
                ? 'Average of last 150 candles — the macro trend filter. No trades are ever taken against it. MA5 > MA30 > MA150 = BULL trend only.'
                : '最近150根K線均值——宏觀趨勢過濾器。永遠不逆此線交易。MA5 > MA30 > MA150 = 只做多。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'MA Stack' : '均線堆疊'} tagColor="#888">
              {isEN
                ? 'BULL = MA5 > MA30 > MA150 (long only). BEAR = MA5 < MA30 < MA150 (short only). RANGE = mixed, no trades.'
                : '多頭 = MA5 > MA30 > MA150（只做多）。空頭 = MA5 < MA30 < MA150（只做空）。橫盤 = 混亂，不交易。'}
            </GuideItem>
          </Section>

          {/* ── What triggers a signal ── */}
          <Section color="#00c853" title={isEN ? '🚦 What triggers a signal? (5 gates, all must pass)' : '🚦 什麼情況會觸發訊號？（5個條件，全部達成）'}>
            <GuideItem tag={isEN ? 'Gate 1' : '條件1'} tagColor="#29b6f6">
              {isEN
                ? 'HKEX session is open (09:15–12:00 or 13:00–16:30 HKT, weekdays). No signals fire outside trading hours.'
                : '港交所交易時段（週一至五 09:15–12:00 或 13:00–16:30 港時）。收市後不發訊號。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Gate 2' : '條件2'} tagColor="#ab47bc">
              {isEN
                ? 'Triple MA stack is clean: BULL (MA5 > MA30 > MA150) for LONG, or BEAR (MA5 < MA30 < MA150) for SHORT. RANGE = no trade.'
                : '三線堆疊乾淨：多頭（MA5 > MA30 > MA150）做多；空頭（MA5 < MA30 < MA150）做空。橫盤不交易。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Gate 3' : '條件3'} tagColor="#f0b90b">
              {isEN
                ? 'For LONG: the latest confirmed swing high must be a Higher High (HH) — above the previous swing high. For SHORT: the latest confirmed swing low must be a Lower Low (LL) — below the previous swing low. This confirms the market is genuinely trending, not just noise.'
                : '做多：最新確認的前高必須是「更高前高」（Higher High）——高於上一個前高。做空：最新確認的前低必須是「更低前低」（Lower Low）——低於上一個前低。這確認市場正在真正趨勢運行，而非橫盤噪音。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Gate 4' : '條件4'} tagColor="#00c853">
              {isEN
                ? 'Price has just closed above that swing high — the breakout is confirmed. Entry is on the breakout candle itself, never before.'
                : '價格剛剛收盤突破了那個前高——突破確認。在突破的那根K線入場，絕不提前。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Gate 5' : '條件5'} tagColor="#ff9800">
              {isEN
                ? 'Price is still within 0.8% of MA30 at the time of breakout. This ensures you\'re not chasing a runaway move — entry stays near the trend anchor.'
                : '突破時價格仍在 MA30 的 0.8% 範圍內。確保不追高——入場點維持在趨勢錨點附近。'}
            </GuideItem>
          </Section>

          {/* ── Stop Loss ── */}
          <Section color="#ff9800" title={isEN ? '🛑 Stop Loss — structure-based, dynamic' : '🛑 止損——結構性，動態設置'}>
            <GuideItem tag={isEN ? 'Initial SL' : '初始止損'} tagColor="#ff5252">
              {isEN
                ? 'Placed at the most recent confirmed swing LOW (for LONG). This is the price level where the bullish structure is proven wrong — not an arbitrary percentage.'
                : '置於最近確認的前低（做多時）。這是多頭結構被否定的價格水平——不是隨意的百分比。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Trailing SL' : '跟隨止損'} tagColor="#29b6f6">
              {isEN
                ? 'As new higher swing lows form above your initial stop, your stop moves up — locking in more profit over time. You never manually move it down.'
                : '隨著新的更高前低出現在初始止損之上，止損自動上移——逐步鎖定更多利潤。永遠不要手動向下移動止損。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'When to exit' : '何時離場'} tagColor="#888">
              {isEN
                ? 'Exit ONLY when the trailing stop is hit. There is no fixed take-profit level. The market decides when your trade is over.'
                : '只在跟隨止損被觸及時離場。沒有固定止盈。市場決定交易何時結束。'}
            </GuideItem>
          </Section>

          {/* ── R:R ── */}
          <Section color="#f0b90b" title={isEN ? '⚖️ Risk : Reward — minimum 2.5:1, no upper limit' : '⚖️ 風險報酬比——最低 2.5:1，無上限'}>
            <GuideItem tag={isEN ? 'Minimum R:R' : '最低盈虧比'} tagColor="#f0b90b">
              {isEN
                ? 'The SL distance × 2.5 gives you the minimum profit target. But because there is no fixed TP, the trade stays open as long as the trend holds — the actual R:R could be 5:1, 8:1 or more.'
                : '止損距離 × 2.5 得出最低利潤目標。但因為沒有固定止盈，交易在趨勢持續時一直持有——實際盈虧比可能達 5:1、8:1 甚至更高。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Why no fixed TP?' : '為什麼沒有固定止盈？'} tagColor="#00c853">
              {isEN
                ? 'Cutting winners early is the most common trading mistake. A trending market can run 10× your stop distance. Fixing a TP at 2.5× means you miss 90% of the move.'
                : '過早鎖利是最常見的交易錯誤。趨勢市場的移動幅度可達止損距離的10倍。設定 2.5× 的固定止盈意味著你錯過了90%的行情。'}
            </GuideItem>
          </Section>

          <div style={{ background: '#1a1500', border: '1px solid #f0b90b44', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#f0b90b', lineHeight: 1.7 }}>
            {isEN
              ? '⚠️ For educational reference only. Not financial advice. Always practice with Paper Trading before using real money.'
              : '⚠️ 僅供教學參考，非投資建議。使用真實資金前請先在模擬盤充分練習。'}
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

const guide: Record<string, React.CSSProperties> = {
  wrapper: {},
  toggle:  { width: '100%', background: '#16161e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' },
  body:    { background: '#0d0d1e', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 },
  p:       { margin: '0 0 4px', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 },
};