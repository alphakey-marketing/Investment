import React, { useState } from 'react';
import Tip from './Tip';

export default function WaitCard({
  lastPrice, latestMA5, latestMA30, isEN,
}: {
  lastPrice: number | null;
  latestMA5: number | null;
  latestMA30: number | null;
  isEN: boolean;
}) {
  if (!lastPrice || !latestMA5 || !latestMA30) {
    return (
      <div style={wS.card}>
        <div style={wS.icon}>⏳</div>
        <div style={wS.title}>{isEN ? 'Loading data...' : '載入數據中...'}</div>
      </div>
    );
  }

  const PROX = 0.005; // 0.5%

  // ── LONG check ──
  const longZoneLow  = latestMA5 * (1 - PROX);   // e.g. MA5 × 0.995
  const longZoneHigh = latestMA5 * (1 + PROX);   // e.g. MA5 × 1.005
  const nearMA5      = Math.abs(lastPrice - latestMA5) / latestMA5 < PROX;
  const aboveMA5     = lastPrice > latestMA5;
  // proximity 0→1 (1 = right on MA5)
  const longProx     = Math.max(0, 1 - Math.abs(lastPrice - latestMA5) / latestMA5 / PROX);

  // ── SHORT check ──
  const shortZoneLow  = latestMA30 * (1 - PROX);
  const shortZoneHigh = latestMA30 * (1 + PROX);
  const nearMA30      = Math.abs(lastPrice - latestMA30) / latestMA30 < PROX;
  const belowMA30     = lastPrice < latestMA30;
  const shortProx     = Math.max(0, 1 - Math.abs(lastPrice - latestMA30) / latestMA30 / PROX);

  // Distance in dollars
  const distMA5 = Math.abs(lastPrice - latestMA5);
  const distMA30 = Math.abs(lastPrice - latestMA30);

  // Which scenario is closer?
  const longReady  = aboveMA5 && nearMA5;
  const shortReady = belowMA30 && nearMA30;

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
        <span style={{ fontSize: '1.1rem' }}>🚉</span>
        <span style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>
          {isEN
            ? 'Think of MA20 as a train platform. The signal fires only when the price "arrives at the platform" (within 0.5%) AND a new passenger boards (price makes a new high). Right now the train is still en route.'
            : '把 MA20 想像成火車月台。訊號只在價格「抵達月台」（0.5%範圍內）且 同時 有新乘客上車（創新高）時才觸發。現在火車仍在途中。'}
        </span>
      </div>

      <div style={wS.divider} />

      {/* ── LONG checklist ── */}
      <ConditionBlock
        title={isEN ? '🟢 BUY (Long) Signal — needs ALL 3:' : '🟢 買入（做多）訊號 — 需同時滿足全部3項：'}
        color="#00c853"
      >
        <CondRow
          ok={aboveMA5}
          label={isEN ? 'Price is ABOVE MA5' : '現價在 MA5 上方'}
          detail={
            aboveMA5
              ? (isEN ? `✅ Yes — $${lastPrice.toFixed(2)} > MA5 $${latestMA5.toFixed(2)}` : `✅ 是 — $${lastPrice.toFixed(2)} > MA5 $${latestMA5.toFixed(2)}`)
              : (isEN ? `❌ No — price $${lastPrice.toFixed(2)} is still BELOW MA5 $${latestMA5.toFixed(2)}` : `❌ 否 — 現價 $${lastPrice.toFixed(2)} 仍低於 MA5 $${latestMA5.toFixed(2)}`)
          }
          tip={isEN ? 'The rule: only buy when price is floating above the MA line.' : '規則：只在價格浮於 MA 線上方時才考慮買入。'}
          color="#00c853"
        />
        <CondRow
          ok={nearMA5}
          label={isEN ? 'Price is close to MA5 (within 0.5%)' : '現價接近 MA5（0.5%範圍內）'}
          detail={
            nearMA5
              ? (isEN ? `✅ Yes — only $${distMA5.toFixed(2)} away (${((distMA5 / latestMA5) * 100).toFixed(2)}%)` : `✅ 是 — 距離只有 $${distMA5.toFixed(2)}（${((distMA5 / latestMA5) * 100).toFixed(2)}%）`)
              : (isEN ? `❌ Still $${distMA5.toFixed(2)} away — need to be within $${(latestMA5 * PROX).toFixed(2)} of MA5` : `❌ 還差 $${distMA5.toFixed(2)} — 需進入 MA5±$${(latestMA5 * PROX).toFixed(2)} 的範圍內`)
          }
          tip={isEN
            ? `The "arrive at the platform" rule. MA5 zone: $${longZoneLow.toFixed(2)} → $${longZoneHigh.toFixed(2)}`
            : `「到位才動」規則。MA5 觸發區間：$${longZoneLow.toFixed(2)} → $${longZoneHigh.toFixed(2)}`}
          color="#00c853"
          progress={longProx}
          progressLabel={isEN
            ? `Zone: $${longZoneLow.toFixed(2)} ← MA5 → $${longZoneHigh.toFixed(2)}`
            : `觸發區：$${longZoneLow.toFixed(2)} ← MA5 $${latestMA5.toFixed(2)} → $${longZoneHigh.toFixed(2)}`}
        />
        <CondRow
          ok={false}
          pending
          label={isEN ? 'Current candle makes a NEW HIGH vs previous candle' : '本根K線創出比上一根更高的新高'}
          detail={isEN
            ? 'Checked live on each new candle close. Like a new peak being formed — momentum confirmation.'
            : '每根K線收盤時即時檢查。就像形成一個新高峰——動能確認信號。'}
          tip={isEN ? 'Prevents false signals on sideways price.' : '防止橫盤時產生假訊號。'}
          color="#00c853"
        />
      </ConditionBlock>

      <div style={wS.divider} />

      {/* ── SHORT checklist ── */}
      <ConditionBlock
        title={isEN ? '🔴 SELL (Short) Signal — needs ALL 3:' : '🔴 賣出（做空）訊號 — 需同時滿足全部3項：'}
        color="#ff1744"
      >
        <CondRow
          ok={belowMA30}
          label={isEN ? 'Price is BELOW MA30' : '現價在 MA30 下方'}
          detail={
            belowMA30
              ? (isEN ? `✅ Yes — $${lastPrice.toFixed(2)} < MA30 $${latestMA30.toFixed(2)}` : `✅ 是 — $${lastPrice.toFixed(2)} < MA30 $${latestMA30.toFixed(2)}`)
              : (isEN ? `❌ No — price $${lastPrice.toFixed(2)} is still ABOVE MA30 $${latestMA30.toFixed(2)}` : `❌ 否 — 現價 $${lastPrice.toFixed(2)} 仍高於 MA30 $${latestMA30.toFixed(2)}`)
          }
          tip={isEN ? 'The rule: only sell/short when price is below the MA30 line.' : '規則：只在價格沉於 MA30 線下方時才考慮賣出。'}
          color="#ff1744"
        />
        <CondRow
          ok={nearMA30}
          label={isEN ? 'Price is close to MA30 (within 0.5%)' : '現價接近 MA30（0.5%範圍內）'}
          detail={
            nearMA30
              ? (isEN ? `✅ Yes — only $${distMA30.toFixed(2)} away (${((distMA30 / latestMA30) * 100).toFixed(2)}%)` : `✅ 是 — 距離只有 $${distMA30.toFixed(2)}（${((distMA30 / latestMA30) * 100).toFixed(2)}%）`)
              : (isEN ? `❌ Still $${distMA30.toFixed(2)} away — need within $${(latestMA30 * PROX).toFixed(2)} of MA30` : `❌ 還差 $${distMA30.toFixed(2)} — 需進入 MA30±$${(latestMA30 * PROX).toFixed(2)} 的範圍內`)
          }
          tip={isEN
            ? `MA30 trigger zone: $${shortZoneLow.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`
            : `MA30 觸發區間：$${shortZoneLow.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`}
          color="#ff1744"
          progress={shortProx}
          progressLabel={isEN
            ? `Zone: $${shortZoneLow.toFixed(2)} ← MA30 → $${shortZoneHigh.toFixed(2)}`
            : `觸發區：$${shortZoneLow.toFixed(2)} ← MA30 $${latestMA30.toFixed(2)} → $${shortZoneHigh.toFixed(2)}`}
        />
        <CondRow
          ok={false}
          pending
          label={isEN ? 'Current candle makes a NEW LOW vs previous candle' : '本根K線創出比上一根更低的新低'}
          detail={isEN
            ? 'Checked live on each new candle close. Confirms the downward momentum.'
            : '每根K線收盤時即時檢查。確認下行動能。'}
          tip={isEN ? 'Prevents false signals on sideways price.' : '防止橫盤時產生假訊號。'}
          color="#ff1744"
        />
      </ConditionBlock>

      {/* ── Summary hint ── */}
      <div style={wS.hint}>
        {isEN
          ? `💡 Currently ${longProx > shortProx ? 'closer to a BUY signal' : 'closer to a SELL signal'} — price is ${distMA5 < distMA30 ? `$${distMA5.toFixed(2)} from MA5` : `$${distMA30.toFixed(2)} from MA30`}.`
          : `💡 目前${longProx > shortProx ? '較接近買入訊號' : '較接近賣出訊號'} — 現價距 ${distMA5 < distMA30 ? `MA5 還差 $${distMA5.toFixed(2)}` : `MA30 還差 $${distMA30.toFixed(2)}`}。`}
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
  ok, pending, label, detail, tip, color, progress, progressLabel,
}: {
  ok: boolean; pending?: boolean; label: string; detail: string; tip?: string; color: string;
  progress?: number; progressLabel?: string;
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
        </div>
      )}
    </div>
  );
}

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
