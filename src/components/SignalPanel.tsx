import React, { useState } from 'react';
import { SignalEvent, MAPoint, Candle } from '../types/binance';
import { Lang, tr } from '../i18n';

interface Props {
  signal: SignalEvent | null;
  ma20: MAPoint[];
  ma60: MAPoint[];
  lastPrice: number | null;
  lang: Lang;
  candles: Candle[];          // ← NEW: needed for high/low comparison
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Wait Card ────────────────────────────────────────────────────────────────
function WaitCard({
  lastPrice, latestMA20, latestMA60, isEN, candles,
}: {
  lastPrice: number | null;
  latestMA20: number | null;
  latestMA60: number | null;
  isEN: boolean;
  candles: Candle[];
}) {
  if (!lastPrice || !latestMA20 || !latestMA60) {
    return (
      <div style={wS.card}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span>
        <div style={wS.title}>{isEN ? 'Loading data…' : '載入數據中…'}</div>
      </div>
    );
  }

  const PROX = 0.005;

  // Latest & previous candle
  const latest = candles[candles.length - 1];
  const prev   = candles[candles.length - 2];
  const hasCandles = latest && prev;

  // ── LONG ──
  const aboveMA20  = lastPrice > latestMA20;
  const nearMA20   = Math.abs(lastPrice - latestMA20) / latestMA20 < PROX;
  const longZoneLo = latestMA20 * (1 - PROX);
  const longZoneHi = latestMA20 * (1 + PROX);
  const longProx   = Math.max(0, 1 - Math.abs(lastPrice - latestMA20) / latestMA20 / PROX);
  const distMA20   = Math.abs(lastPrice - latestMA20);
  const newHigh    = hasCandles && latest.high > prev.high;   // ← live boolean

  // ── SHORT ──
  const belowMA60   = lastPrice < latestMA60;
  const nearMA60    = Math.abs(lastPrice - latestMA60) / latestMA60 < PROX;
  const shortZoneLo = latestMA60 * (1 - PROX);
  const shortZoneHi = latestMA60 * (1 + PROX);
  const shortProx   = Math.max(0, 1 - Math.abs(lastPrice - latestMA60) / latestMA60 / PROX);
  const distMA60    = Math.abs(lastPrice - latestMA60);
  const newLow      = hasCandles && latest.low < prev.low;    // ← live boolean

  return (
    <div style={wS.card}>

      {/* Header */}
      <div style={wS.header}>
        <span style={{ fontSize: '1.5rem' }}>⏳</span>
        <div>
          <div style={wS.title}>{isEN ? 'Waiting for a signal…' : '等待訊號中…'}</div>
          <div style={wS.subtitle}>
            {isEN
              ? 'All 3 conditions below must turn ✅ at the same time to fire a signal.'
              : '以下 3 個條件必須同時變為 ✅，才會觸發訊號。'}
          </div>
        </div>
      </div>

      {/* Analogy */}
      <div style={wS.analogy}>
        <span style={{ fontSize: '1.1rem' }}>🚉</span>
        <span style={{ fontSize: '0.79rem', color: '#888', lineHeight: 1.65 }}>
          {isEN
            ? 'Imagine MA20 is a train platform. The signal only fires when the price “arrives at the platform” (within 0.5%) AND the train’s doors open (price makes a new high). If the train is still far away, we just wait — never chase it.'
            : '想像 MA20 是火車月台。只有當價格「抵達月台」（0.5%範圍內），且車門打開（創新高），訊號才會觸發。如果火車還在遠處，我們就等——絕不追車。'}
        </span>
      </div>

      <div style={wS.divider} />

      {/* ── BUY checklist ── */}
      <CondBlock
        title={isEN ? '🟢 BUY (Long) — needs ALL 3 at once:' : '🟢 買入（做多）— 需同時滿足全部3項：'}
        color="#00c853"
      >
        {/* Condition 1 */}
        <CondRow ok={aboveMA20} color="#00c853"
          label={isEN ? 'Price is ABOVE MA20' : '現價在 MA20 上方'}
          tip={isEN
            ? 'Like checking if the stock’s mood is positive. Only buy when things are already going up.'
            : '就像檢查市場情緒是否正面。僅在已層上漲時買入。'}
        >
          {aboveMA20
            ? <DetailLine color="#00c853">
                {isEN
                  ? <>✅ <b>Yes</b> — Current price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> is above MA20 <Val c="#29b6f6">${latestMA20.toFixed(2)}</Val></>
                  : <>✅ <b>是</b> — 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 高於 MA20 <Val c="#29b6f6">${latestMA20.toFixed(2)}</Val></>}
              </DetailLine>
            : <DetailLine color="#ff5252">
                {isEN
                  ? <>❌ <b>Not yet</b> — Current price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> is still BELOW MA20 <Val c="#29b6f6">${latestMA20.toFixed(2)}</Val>. Price needs to rise above the MA20 line first.
                  </>
                  : <>❌ <b>尚未</b> — 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 仍低於 MA20 <Val c="#29b6f6">${latestMA20.toFixed(2)}</Val>。需要價格先上穿 MA20 線。</>}
              </DetailLine>
          }
        </CondRow>

        {/* Condition 2 */}
        <CondRow ok={nearMA20} color="#00c853"
          label={isEN ? 'Price is within 0.5% of MA20 (the trigger zone)' : '現價距MA20 在0.5%以內（觸發區）'}
          tip={isEN
            ? 'The “arrive at the platform” rule. We only act when price is very close to the MA line — not too far above.'
            : '「到位才動」規則。價格需靠近MA線才操作，不能太遠。'}
          progress={longProx}
          progressLabel={
            isEN
              ? `Trigger zone: $${longZoneLo.toFixed(2)} ←│ MA20 $${latestMA20.toFixed(2)} │→ $${longZoneHi.toFixed(2)}`
              : `觸發區間：$${longZoneLo.toFixed(2)} ←│ MA20 $${latestMA20.toFixed(2)} │→ $${longZoneHi.toFixed(2)}`
          }
        >
          {nearMA20
            ? <DetailLine color="#00c853">
                {isEN
                  ? <>✅ <b>In zone!</b> — Only <Val c="#00c853">${distMA20.toFixed(2)}</Val> ({((distMA20/latestMA20)*100).toFixed(2)}%) away from MA20.
                    Trigger zone is <Val c="#29b6f6">${longZoneLo.toFixed(2)}</Val> – <Val c="#29b6f6">${longZoneHi.toFixed(2)}</Val>.
                  </>
                  : <>✅ <b>已入區！</b> — 距 MA20 只差 <Val c="#00c853">${distMA20.toFixed(2)}</Val>（{((distMA20/latestMA20)*100).toFixed(2)}%）。
                    觸發區間：<Val c="#29b6f6">${longZoneLo.toFixed(2)}</Val> – <Val c="#29b6f6">${longZoneHi.toFixed(2)}</Val>。
                  </>}
              </DetailLine>
            : <DetailLine color="#ff5252">
                {isEN
                  ? <>❌ <b>Not in zone yet.</b> Price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> needs to enter the range
                    <Val c="#29b6f6"> ${longZoneLo.toFixed(2)}</Val> – <Val c="#29b6f6">${longZoneHi.toFixed(2)}</Val>.
                    Currently <Val c="#ff5252">${distMA20.toFixed(2)}</Val> away.
                  </>
                  : <>❌ <b>尚未入區。</b> 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 需進入
                    <Val c="#29b6f6"> ${longZoneLo.toFixed(2)}</Val> – <Val c="#29b6f6">${longZoneHi.toFixed(2)}</Val> 範圍。
                    目前距離 <Val c="#ff5252">${distMA20.toFixed(2)}</Val>。
                  </>}
              </DetailLine>
          }
        </CondRow>

        {/* Condition 3 — NEW HIGH with live candle numbers */}
        <CondRow ok={hasCandles ? newHigh : false} color="#00c853"
          label={isEN ? 'Current candle makes a NEW HIGH (higher than previous candle)' : '本根K線高點必須高於上一根'}
          tip={isEN
            ? 'A “candle” is one time period on the chart (e.g. 1 hour). Its HIGH is the highest price reached during that hour. We need the current candle’s high to beat the previous one — proof that buyers are pushing price up.'
            : 'K線代表圖表上的一個時間段（如1小時）。高點是該小時內最高價格。需要目前這根的高點超過上一根，證明買方正在推高價格。'}
        >
          {hasCandles
            ? newHigh
              ? <DetailLine color="#00c853">
                  {isEN
                    ? <>✅ <b>Yes — new high confirmed!</b><br />
                        🔶 This candle high: <Val c="#00c853">${latest.high.toFixed(2)}</Val><br />
                        □ Previous candle high: <Val c="#888">${prev.high.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>Current is <Val c="#00c853">${(latest.high - prev.high).toFixed(2)}</Val> higher — buyers are pushing up 📈</span>
                    </>
                    : <>✅ <b>是，新高確認！</b><br />
                        🔶 本根高點：<Val c="#00c853">${latest.high.toFixed(2)}</Val><br />
                        □ 上一根高點：<Val c="#888">${prev.high.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>目前高出 <Val c="#00c853">${(latest.high - prev.high).toFixed(2)}</Val> — 買方正在推高 📈</span>
                    </>}
                </DetailLine>
              : <DetailLine color="#ff5252">
                  {isEN
                    ? <>❌ <b>Not yet — no new high.</b><br />
                        🔶 This candle high: <Val c="#f0b90b">${latest.high.toFixed(2)}</Val><br />
                        □ Previous candle high: <Val c="#888">${prev.high.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>Current is <Val c="#ff5252">${(prev.high - latest.high).toFixed(2)}</Val> short of a new high. Waiting for buyers to push higher.</span>
                    </>
                    : <>❌ <b>尚未創新高。</b><br />
                        🔶 本根高點：<Val c="#f0b90b">${latest.high.toFixed(2)}</Val><br />
                        □ 上一根高點：<Val c="#888">${prev.high.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>還差 <Val c="#ff5252">${(prev.high - latest.high).toFixed(2)}</Val> 才能創新高。等待買方推上。</span>
                    </>}
                </DetailLine>
            : <DetailLine color="#555">{isEN ? 'Waiting for candle data…' : '等待K線數據…'}</DetailLine>
          }
        </CondRow>
      </CondBlock>

      <div style={wS.divider} />

      {/* ── SELL checklist ── */}
      <CondBlock
        title={isEN ? '🔴 SELL (Short) — needs ALL 3 at once:' : '🔴 賣出（做空）— 需同時滿足全部3項：'}
        color="#ff1744"
      >
        {/* Condition 1 */}
        <CondRow ok={belowMA60} color="#ff1744"
          label={isEN ? 'Price is BELOW MA60' : '現價在 MA60 下方'}
          tip={isEN
            ? 'Like checking if the big-picture trend is negative. Only sell/short when things are already going down.'
            : '就像檢查大方向趨勢是否向下。僅在已層下跌時賣出。'}
        >
          {belowMA60
            ? <DetailLine color="#00c853">
                {isEN
                  ? <>✅ <b>Yes</b> — Current price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> is below MA60 <Val c="#ab47bc">${latestMA60.toFixed(2)}</Val></>
                  : <>✅ <b>是</b> — 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 低於 MA60 <Val c="#ab47bc">${latestMA60.toFixed(2)}</Val></>}
              </DetailLine>
            : <DetailLine color="#ff5252">
                {isEN
                  ? <>❌ <b>Not yet</b> — Current price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> is still ABOVE MA60 <Val c="#ab47bc">${latestMA60.toFixed(2)}</Val>. Price needs to fall below the MA60 line first.</>
                  : <>❌ <b>尚未</b> — 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 仍高於 MA60 <Val c="#ab47bc">${latestMA60.toFixed(2)}</Val>。需要價格先跌破 MA60 線。</>}
              </DetailLine>
          }
        </CondRow>

        {/* Condition 2 */}
        <CondRow ok={nearMA60} color="#ff1744"
          label={isEN ? 'Price is within 0.5% of MA60 (the trigger zone)' : '現價距 MA60 在0.5%以內（觸發區）'}
          tip={isEN
            ? 'Same “arrival at the platform” rule but for the sell side.'
            : '同樣的「到位才動」規則，不過是賣出方向。'}
          progress={shortProx}
          progressLabel={
            isEN
              ? `Trigger zone: $${shortZoneLo.toFixed(2)} ←│ MA60 $${latestMA60.toFixed(2)} │→ $${shortZoneHi.toFixed(2)}`
              : `觸發區間：$${shortZoneLo.toFixed(2)} ←│ MA60 $${latestMA60.toFixed(2)} │→ $${shortZoneHi.toFixed(2)}`
          }
        >
          {nearMA60
            ? <DetailLine color="#00c853">
                {isEN
                  ? <>✅ <b>In zone!</b> — Only <Val c="#00c853">${distMA60.toFixed(2)}</Val> ({((distMA60/latestMA60)*100).toFixed(2)}%) from MA60.
                    Zone: <Val c="#ab47bc">${shortZoneLo.toFixed(2)}</Val> – <Val c="#ab47bc">${shortZoneHi.toFixed(2)}</Val>.
                  </>
                  : <>✅ <b>已入區！</b> — 距 MA60 只差 <Val c="#00c853">${distMA60.toFixed(2)}</Val>（{((distMA60/latestMA60)*100).toFixed(2)}%）。
                    區間：<Val c="#ab47bc">${shortZoneLo.toFixed(2)}</Val> – <Val c="#ab47bc">${shortZoneHi.toFixed(2)}</Val>。
                  </>}
              </DetailLine>
            : <DetailLine color="#ff5252">
                {isEN
                  ? <>❌ <b>Not in zone yet.</b> Price <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> needs to enter
                    <Val c="#ab47bc"> ${shortZoneLo.toFixed(2)}</Val> – <Val c="#ab47bc">${shortZoneHi.toFixed(2)}</Val>.
                    Currently <Val c="#ff5252">${distMA60.toFixed(2)}</Val> away.
                  </>
                  : <>❌ <b>尚未入區。</b> 現價 <Val c="#f0b90b">${lastPrice.toFixed(2)}</Val> 需進入
                    <Val c="#ab47bc"> ${shortZoneLo.toFixed(2)}</Val> – <Val c="#ab47bc">${shortZoneHi.toFixed(2)}</Val> 範圍。
                    目前距離 <Val c="#ff5252">${distMA60.toFixed(2)}</Val>。
                  </>}
              </DetailLine>
          }
        </CondRow>

        {/* Condition 3 — NEW LOW with live candle numbers */}
        <CondRow ok={hasCandles ? newLow : false} color="#ff1744"
          label={isEN ? 'Current candle makes a NEW LOW (lower than previous candle)' : '本根K線低點必須低於上一根'}
          tip={isEN
            ? 'A candle’s LOW is the lowest price in that time period. We need the current candle’s low to break below the previous one — proof that sellers are pushing the price down.'
            : 'K線低點是該時間段內最低價格。目前這根的低點需穿破上一根，證明賣方正在壓低價格。'}
        >
          {hasCandles
            ? newLow
              ? <DetailLine color="#00c853">
                  {isEN
                    ? <>✅ <b>Yes — new low confirmed!</b><br />
                        🔶 This candle low: <Val c="#ff1744">${latest.low.toFixed(2)}</Val><br />
                        □ Previous candle low: <Val c="#888">${prev.low.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>Current is <Val c="#ff1744">${(prev.low - latest.low).toFixed(2)}</Val> lower — sellers are pushing down 📉</span>
                    </>
                    : <>✅ <b>是，新低確認！</b><br />
                        🔶 本根低點：<Val c="#ff1744">${latest.low.toFixed(2)}</Val><br />
                        □ 上一根低點：<Val c="#888">${prev.low.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>目前低了 <Val c="#ff1744">${(prev.low - latest.low).toFixed(2)}</Val> — 賣方正在壓低 📉</span>
                    </>}
                </DetailLine>
              : <DetailLine color="#ff5252">
                  {isEN
                    ? <>❌ <b>Not yet — no new low.</b><br />
                        🔶 This candle low: <Val c="#f0b90b">${latest.low.toFixed(2)}</Val><br />
                        □ Previous candle low: <Val c="#888">${prev.low.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>Current needs to drop another <Val c="#ff5252">${(latest.low - prev.low).toFixed(2)}</Val> to make a new low.</span>
                    </>
                    : <>❌ <b>尚未創新低。</b><br />
                        🔶 本根低點：<Val c="#f0b90b">${latest.low.toFixed(2)}</Val><br />
                        □ 上一根低點：<Val c="#888">${prev.low.toFixed(2)}</Val><br />
                        <span style={{color:'#555',fontSize:'0.72rem'}}>還需再跌 <Val c="#ff5252">${(latest.low - prev.low).toFixed(2)}</Val> 才就創新低。</span>
                    </>}
                </DetailLine>
            : <DetailLine color="#555">{isEN ? 'Waiting for candle data…' : '等待K線數據…'}</DetailLine>
          }
        </CondRow>
      </CondBlock>

      {/* Summary */}
      <div style={wS.hint}>
        💡{' '}
        {isEN
          ? <>Currently <b style={{color: longProx > shortProx ? '#00c853' : '#ff1744'}}>
              {longProx > shortProx ? 'closer to a BUY signal' : 'closer to a SELL signal'}
            </b> — price is <b style={{color:'#f0b90b'}}>
              {distMA20 < distMA60 ? `$${distMA20.toFixed(2)} from MA20` : `$${distMA60.toFixed(2)} from MA60`}
            </b> away from the trigger zone.</>
          : <>目前 <b style={{color: longProx > shortProx ? '#00c853' : '#ff1744'}}>
              {longProx > shortProx ? '較接近買入訊號' : '較接近賣出訊號'}
            </b> — 現價距觸發區 <b style={{color:'#f0b90b'}}>
              {distMA20 < distMA60 ? `MA20 還差 $${distMA20.toFixed(2)}` : `MA60 還差 $${distMA60.toFixed(2)}`}
            </b>。</>}
      </div>
    </div>
  );
}

// Small helpers
function Val({ c, children }: { c: string; children: React.ReactNode }) {
  return <span style={{ color: c, fontWeight: 'bold', fontFamily: 'monospace' }}>{children}</span>;
}
function DetailLine({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ fontSize: '0.79rem', color: '#aaa', lineHeight: 1.8, padding: '2px 0' }}>{children}</div>;
}

function CondBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color, marginBottom: 1 }}>{title}</div>
      {children}
    </div>
  );
}

function CondRow({ ok, color, label, tip, children, progress, progressLabel }: {
  ok: boolean; color: string; label: string; tip?: string;
  children: React.ReactNode;
  progress?: number; progressLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: ok ? color + '0f' : '#0f0f1a',
      border: `1px solid ${ok ? color + '55' : '#2a2a3e'}`,
      borderRadius: 8, overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'none', border: 'none', padding: '9px 12px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
      }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ok ? '✅' : '❌'}</span>
        <span style={{ fontSize: '0.8rem', color: ok ? color : '#888', flex: 1, fontFamily: 'monospace' }}>{label}</span>
        {tip && (
          <span onClick={e => e.stopPropagation()}>
            <Tip text={tip}><span style={{ fontSize: '0.68rem', color: '#444' }}>ⓘ</span></Tip>
          </span>
        )}
        <span style={{ color: '#333', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children}
          {progress !== undefined && (
            <div>
              <div style={{ fontSize: '0.67rem', color: '#555', marginBottom: 4, fontFamily: 'monospace' }}>{progressLabel}</div>
              <div style={{ background: '#1a1a2e', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(progress * 100, 100)}%`, height: '100%', borderRadius: 4,
                  background: progress >= 1 ? color : `linear-gradient(90deg,${color}44,${color})`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.67rem', color: progress >= 1 ? color : '#555', marginTop: 3, textAlign: 'right' }}>
                {progress >= 1 ? '✅ In the trigger zone!' : `${(progress * 100).toFixed(0)}% of the way into the zone`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Beginner Guide ────────────────────────────────────────────────────────────
function BeginnerGuide({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isEN = lang === 'EN';
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={guide.toggle}>
        <span>{open ? '▼' : '▶'}</span>
        <span>{isEN ? '📖 Beginner Guide — tap to learn what everything means' : '📖 新手指南 — 點擊了解每個數字的意思'}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#444' }}>{open ? (isEN ? 'hide' : '收起') : (isEN ? 'show' : '展開')}</span>
      </button>
      {open && (
        <div style={guide.body}>

          <GSection color="#f0b90b" title={isEN ? '🗺️ What is this app?' : '🗺️ 這個 App 是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'Think of it as a smart alarm system for trading. It monitors Gold, BTC, or ETH 24/7 and rings an alarm when a specific set of conditions are all met at once — suggesting it might be a good time to buy or sell.'
                : '想像它是交易用的智慧鬧鐘系統。它全天候監測黃金、BTC、ETH，在所有條件同時滿足時發出警報——提示可能是買賣的好時機。'}
            </p>
            <p style={{ ...guide.p, color: '#f0b90b' }}>
              {isEN
                ? '⚠️ It gives you signals to LOOK AT — it does NOT automatically place any trades. You always decide.'
                : '⚠️ 它只是提供參考訊號，不會自動下單。永遠由你自己決定。'}
            </p>
          </GSection>

          <GSection color="#29b6f6" title={isEN ? '📊 What are the 4 numbers on the dashboard?' : '📊 面板上 4 個數字說明'}>
            <GItem tag={isEN ? 'Current Price' : '現價'} c="#f0b90b">
              {isEN
                ? 'The price someone would pay for this asset RIGHT NOW. Updates every 10 seconds. Think of it like a live auction price — it moves every second.'
                : '即時市場價格，每10秒自動更新。就像現場拍賣價格，每秒都在變動。'}
            </GItem>
            <GItem tag="MA20" c="#29b6f6">
              {isEN
                ? 'The average closing price of the last 20 chart bars (candles). Imagine asking "What was the average price over the last 20 hours?" — that’s MA20. Price above it = market mood is positive (bullish).'
                : '最近20根K線收盤均價。就像詢問「過去20小時的平均價格是多少？」——那就是 MA20。價格在其上 = 市場情緒正面（多頭）。'}
            </GItem>
            <GItem tag="MA60" c="#ab47bc">
              {isEN
                ? 'Same idea but over 60 bars — a longer, smoother view of the trend. Like asking "Where has price been on average over the last 60 hours?" Price below it = longer-term trend is negative (bearish).'
                : '同樣理念但為60根K線，代表更長期的趨勢。價格在其下 = 長期趨勢向下（空頭）。'}
            </GItem>
            <GItem tag={isEN ? 'Trend' : '趨勢'} c="#888">
              {isEN
                ? 'Simply: is price above or below MA20? Above = “Bullish” (like a boat sitting on top of the water line). Below = “Bearish” (boat sinking under the water).'
                : '簡單說：現價在 MA20 的上還是下？上 = 「多頭」（船浮在水面上）。下 = 「空頭」（船沉在水面下）。'}
            </GItem>
          </GSection>

          <GSection color="#00c853" title={isEN ? '🚦 When does a signal appear?' : '🚦 什麼時候會出現訊號？'}>
            <GItem tag={isEN ? '🟢 BUY signal' : '🟢 買入訊號'} c="#00c853">
              {isEN
                ? '3 things must happen at the same time: (1) price is above MA20, (2) price is very close to MA20 (within 0.5%), and (3) the current hourly candle’s high beats the previous one. Think: price is riding the MA line upward like a surfer catching a wave.'
                : '3項必須同時發生：（1）現價在 MA20 上方，（2）現價非常接近 MA20（0.5%內），（3）本根K線高點強於上一根。就像衝浪手騎乘MA波浪上滁。'}
            </GItem>
            <GItem tag={isEN ? '🔴 SELL signal' : '🔴 賣出訊號'} c="#ff1744">
              {isEN
                ? 'Same logic, but flipped: (1) price is below MA60, (2) within 0.5% of MA60, and (3) current candle’s low breaks below the previous. Like a surfer riding the MA line downward.'
                : '相同邏輯但方向相反：（1）現價在 MA60 下方，（2）距 MA60 在0.5%內，（3）本根K線低點穿破上一根。就像衝浪手沖著MA波浪向下滑行。'}
            </GItem>
          </GSection>

          <GSection color="#ff9800" title={isEN ? '💰 What are Stop Loss and Take Profit?' : '💰 止蝕與止盈是什麼？'}>
            <GItem tag={isEN ? '🛑 Stop Loss' : '🛑 止蝕'} c="#ff5252">
              {isEN
                ? 'A safety net price you set in advance. If the trade goes the wrong way and price drops to this level, you exit immediately to stop further losses. Set at 1% below your entry. Like putting a floor under your money.'
                : '預先設定的保護價格。若交易方向错誤，價格跌至此位就立即離場。設於入場價下方1%。就像在資金下方敎一層安全網。'}
            </GItem>
            <GItem tag={isEN ? '🎯 Take Profit' : '🎯 止盈'} c="#00c853">
              {isEN
                ? 'The target price where you lock in your gains and exit the trade. Set at 3% above entry (for a buy). You’re aiming to earn 3× the amount you risked.'
                : '目標價格，達到此价就鎖定利潤離場。設於入場價上方3%（買入）。目標賺取風險金額的3倍。'}
            </GItem>
            <GItem tag={isEN ? '⚖️ Risk/Reward = 3:1' : '⚖️ 盈虧比 3:1'} c="#f0b90b">
              {isEN
                ? 'If you risk losing $100, you aim to make $300. This means: even if you only win 4 out of every 10 trades, you still make overall profit. The math works in your favour over time.'
                : '若你冒險輸 $100，目標嵌 $300。這意味著：即使10次交易只勝4次，整體仍然盈利。長期下數學對你有利。'}
            </GItem>
          </GSection>

          <GSection color="#29b6f6" title={isEN ? '🗒️ What is a “candle” (K線 / K-line)?' : '🗒️ 「K線」是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'Each candle represents one time period (e.g. 1 hour). It shows 4 prices: Open (where price started), Close (where it ended), High (the peak), and Low (the trough). Think of it like a weather report: “Today’s high was 32°C, low was 22°C, started at 25°C and ended at 29°C.”'
                : '每根K線代表一個時間段（如1小時）。顯示4個價格：開盤、收盤、高點、低點。就像天氣預報：「今天最高氣溫32°C，最低22°C，早上25°C，晚上29°C。」'}
            </p>
            <p style={guide.p}>
              {isEN
                ? 'The “new high” condition checks: did this hour’s candle reach a higher peak than last hour’s? If yes, buyers are actively pushing price up — a good sign for a BUY entry.'
                : '「創新高」的檢查就是：本小時的K線高點有沒有超過上一小時？如有，表示買方正積極推高價格——是買入的好信號。'}
            </p>
          </GSection>

          <div style={{ background: '#1a1500', border: '1px solid #f0b90b44', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#f0b90b', lineHeight: 1.7 }}>
            {isEN
              ? '⚠️ For educational reference only. Not financial advice. Always practise with Paper Trading before using real money.'
              : '⚠️ 僅供教學參考，非投資建議。使用真實資金前請先在模擬盤充分練習。'}
          </div>
        </div>
      )}
    </div>
  );
}

function GSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.82rem', color, fontWeight: 'bold', borderBottom: `1px solid ${color}33`, paddingBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
function GItem({ tag, c, children }: { tag: string; c: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.75 }}>
      <span style={{ background: c + '22', color: c, border: `1px solid ${c}55`, padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>{tag}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────
export default function SignalPanel({ signal, ma20, ma60, lastPrice, lang, candles }: Props) {
  const latestMA20 = ma20[ma20.length - 1]?.value ?? null;
  const latestMA60 = ma60[ma60.length - 1]?.value ?? null;
  const isEN = lang === 'EN';
  const isBull = lastPrice && latestMA20 ? lastPrice > latestMA20 : null;

  return (
    <div style={styles.panel}>
      <div>
        <div style={styles.title}>{isEN ? '📊 MA Signal Dashboard' : '📊 K均訊號面板'}</div>
        <div style={styles.subtitle}>{isEN ? 'Real-time buy/sell signals based on Moving Average rules' : '基於移動平均線規則的即時買賣訊號'}</div>
      </div>

      <div style={styles.statsRow}>
        <StatCard label={isEN ? 'Current Price' : '現價 (USDT)'} value={`$${lastPrice?.toFixed(2) ?? '---'}`} color="#f0b90b"
          tip={isEN ? 'Live market price, updates every 10 seconds.' : '即時市場價格，每10秒自動更新。'} sub={isEN ? 'Updates every 10s' : '每10秒更新'} />
        <StatCard label="MA20" value={`$${latestMA20?.toFixed(2) ?? '---'}`} color="#29b6f6"
          tip={isEN ? 'Avg of last 20 candles. Short-term trend. Above = bullish.' : '最近20根K線均值，短期趨勢。現價在上 = 多頭。'} sub={isEN ? 'Short-term avg' : '短期均線'} />
        <StatCard label="MA60" value={`$${latestMA60?.toFixed(2) ?? '---'}`} color="#ab47bc"
          tip={isEN ? 'Avg of last 60 candles. Big-picture trend. Below = bearish.' : '最近60根K線均值，長期趨勢。現價在下 = 空頭。'} sub={isEN ? 'Long-term avg' : '長期均線'} />
        <StatCard
          label={isEN ? 'Trend' : '趨勢'}
          value={isBull === null ? '---' : isBull ? (isEN ? '⬆ Bullish' : '⬆ 多頭') : (isEN ? '⬇ Bearish' : '⬇ 空頭')}
          color={isBull === null ? '#888' : isBull ? '#00c853' : '#ff1744'}
          tip={isEN ? 'Bullish = price above MA20 (boat on water). Bearish = price below (boat sinking).' : '多頭 = 價格浮在MA20上如船在水面；空頭 = 沉在線下。'}
          sub={isEN ? 'Price vs MA20' : '現價 vs MA20'} />
      </div>

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
                tip={isEN ? 'Price when the signal fired — your suggested entry point.' : '訊號觸發時的價格，即建議入場點。'} />
              <LevelBadge icon="🛑" label={isEN ? 'Stop Loss' : '止蝕'}
                value={`$${(signal.type === 'LONG' ? signal.price * 0.99 : signal.price * 1.01).toFixed(2)}`} color="#ff5252"
                tip={isEN ? 'Exit immediately if price hits this. Caps your loss at ~1%.' : '價格觸及此點立即離場，損失上限約1%。'} />
              <LevelBadge icon="🎯" label={isEN ? 'Take Profit' : '止盈'}
                value={`$${(signal.type === 'LONG' ? signal.price * 1.03 : signal.price * 0.97).toFixed(2)}`} color="#00c853"
                tip={isEN ? 'Target exit. Profit = 3× stop loss. Lock in gains here.' : '目標離場點。利潤 = 止蝕距離的3倍，在此鎖定利潤。'} />
              <LevelBadge icon="⚖️" label={isEN ? 'R:R Ratio' : '盈虧比'} value="3 : 1" color="#f0b90b"
                tip={isEN ? 'Risk $1 → Target $3. Even at 40% win rate, this is profitable long-term.' : '冒$1賺$3。即使40%勝率，長期仍盈利。'} />
            </div>
          </div>
        ) : (
          <WaitCard lastPrice={lastPrice} latestMA20={latestMA20} latestMA60={latestMA60} isEN={isEN} candles={candles} />
        )}
      </div>

      <BeginnerGuide lang={lang} />

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

const guide: Record<string, React.CSSProperties> = {
  toggle: { width: '100%', background: '#16161e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' },
  body: { background: '#0d0d1e', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 },
  p: { margin: '0 0 6px', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.75 },
};

const wS: Record<string, React.CSSProperties> = {
  card: { background: '#0f0f1a', border: '1px dashed #2a2a3e', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  header: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: '0.95rem', color: '#888', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '0.75rem', color: '#555', marginTop: 4, lineHeight: 1.5 },
  analogy: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#16161e', border: '1px solid #2a2a3e', borderRadius: 8, padding: '10px 12px' },
  divider: { borderTop: '1px solid #1a1a2e' },
  hint: { background: '#1a1a2e', borderRadius: 8, padding: '9px 12px', fontSize: '0.78rem', color: '#888', lineHeight: 1.6 },
};
