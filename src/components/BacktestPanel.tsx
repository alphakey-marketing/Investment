import React, { useState, useMemo } from 'react';
import { Candle } from '../types/binance';
import { BacktestResult } from '../types/mode';
import { HKTicker, CONTRACT_SPECS } from '../types/hkmarket';
import { runBacktest } from '../utils/backtest';
import { Lang, tr } from '../i18n';

interface Props {
  candles:   Candle[];
  ma1Period: number;
  ma2Period: number;
  ma3Period: number;   // NEW — MA150 for triple stack
  symbol:    string;
  lang:      Lang;
}

function fmtHKD(n: number) {
  return `HK$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString('en-GB', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// ── Interpretation helper ──────────────────────────────────────────────────────────────────────────
function getInterpretation(
  result: BacktestResult,
  rr: number,
  commPerRound: number,
  multiplier: number,
  lang: Lang,
) {
  const isEN = lang === 'EN';
  const { winRate, totalPnl, profitFactor, totalSignals, totalCommission } = result;
  if (totalSignals === 0) return null;

  const breakEvenWinRate = Math.round((1 / (1 + rr)) * 100);
  const isProfitable = totalPnl > 0;
  const isViable     = winRate >= breakEvenWinRate;
  const isPFStrong   = profitFactor >= 1.5;
  const verdictColor = isProfitable && isViable ? '#00c853' : isProfitable ? '#f0b90b' : '#ff9800';
  const verdictIcon  = isProfitable && isViable ? '🟢' : isProfitable ? '🟡' : '🟠';

  const lines: { icon: string; color: string; text: string }[] = [];

  if (winRate >= breakEvenWinRate + 10) {
    lines.push({ icon: '✅', color: '#00c853',
      text: isEN
        ? `Win rate ${winRate}% is well above break-even (${breakEvenWinRate}% needed for ${rr}:1 R:R). Profitable long-term even after commission.`
        : `勝率 ${winRate}% 遠高於保本線（${rr}:1 風報比只需 ${breakEvenWinRate}%）。扣除會費後長期仍有獲利。`,
    });
  } else if (winRate >= breakEvenWinRate) {
    lines.push({ icon: '⚠️', color: '#f0b90b',
      text: isEN
        ? `Win rate ${winRate}% is just above break-even (${breakEvenWinRate}% needed). Marginal after commission — stick to rules every trade.`
        : `勝率 ${winRate}% 僅略高於保本線（需 ${breakEvenWinRate}%）。扣除會費後剩餘空間不大。`,
    });
  } else {
    lines.push({ icon: '❌', color: '#ff9800',
      text: isEN
        ? `Win rate ${winRate}% is BELOW break-even of ${breakEvenWinRate}% (after commission). Review SL/TP or increase R:R.`
        : `勝率 ${winRate}% 低於保本線 ${breakEvenWinRate}%（扣除會費後）。建議調整止蚁一止盈或提高風報比。`,
    });
  }

  if (isPFStrong) {
    lines.push({ icon: '✅', color: '#00c853',
      text: isEN
        ? `Profit Factor ${profitFactor} (≥1.5 is strong, net of HK$${commPerRound}/round commission). Strategy has a durable edge.`
        : `盈利因子 ${profitFactor}（≥1.5 為強勁，已扣 HK$${commPerRound}/回 會費）。策略具備持續優勢。`,
    });
  } else if (profitFactor >= 1.0) {
    lines.push({ icon: '⚠️', color: '#f0b90b',
      text: isEN
        ? `Profit Factor ${profitFactor} (>1 after commission = still profitable, but aim for 1.5+).`
        : `盈利因子 ${profitFactor}（扣會費後 >1 仍獲利，但目標應達 1.5+）。`,
    });
  } else {
    lines.push({ icon: '❌', color: '#ff1744',
      text: isEN
        ? `Profit Factor ${profitFactor} is below 1.0 after commission — losing strategy. Adjust parameters or increase contracts to offset commission drag.`
        : `盈利因子 ${profitFactor} 扣會費後低於 1.0 — 整體五損。建議調整參數或増加合約數以分播會費。`,
    });
  }

  if (totalCommission > 0 && totalSignals > 0) {
    const commPctOfGross = totalPnl + totalCommission > 0
      ? parseFloat(((totalCommission / (Math.abs(totalPnl) + totalCommission)) * 100).toFixed(1))
      : 0;
    lines.push({ icon: '💸', color: '#888',
      text: isEN
        ? `Total commission paid: ${fmtHKD(totalCommission)} across ${totalSignals} trades (${commPctOfGross}% of gross). Commission is ${fmtHKD(commPerRound)}/round-trip.`
        : `總會費：${fmtHKD(totalCommission)}，共 ${totalSignals} 筆交易（佔毛益 ${commPctOfGross}%）。每回會費 ${fmtHKD(commPerRound)}。`,
    });
  }

  if (totalSignals < 15) {
    lines.push({ icon: '⚠️', color: '#888',
      text: isEN
        ? `Only ${totalSignals} trades — small sample. Load more candles for reliable results.`
        : `只有 ${totalSignals} 筆交易 — 樣本較小。請載入更多K線。`,
    });
  }

  const breakEvenPts = multiplier > 0 ? Math.ceil(commPerRound / multiplier) : commPerRound;
  lines.push({ icon: '💡', color: '#29b6f6',
    text: isEN
      ? `Key insight: Commission drag is real — HK$${commPerRound}/trade on this contract (HK$${multiplier}/pt) needs ${breakEvenPts} extra pts just to break even. Use wider TP to offset.`
      : `重點：會費影響真實存在——每筆 HK$${commPerRound} 會費（HK$${multiplier}/點）需額外 ${breakEvenPts} 點才能扣平。可考慮擴大止盈目標。`,
  });

  return { verdictIcon, verdictColor, isProfitable, isViable, lines };
}

export default function BacktestPanel({ candles, ma1Period, ma2Period, ma3Period, symbol, lang }: Props) {
  const spec       = CONTRACT_SPECS[symbol as HKTicker];
  const isFutures  = spec?.isFutures ?? false;
  const multiplier = spec?.multiplier ?? 1;

  const [contractsInput, setContractsInput] = useState('1');
  const [commInput,      setCommInput]      = useState(multiplier >= 50 ? '120' : '80');
  const [ran,            setRan]            = useState(false);
  const [result,         setResult]         = useState<BacktestResult | null>(null);
  const isEN = lang === 'EN';

  const contracts    = Math.max(1, parseInt(contractsInput) || 1);
  const commPerRound = Math.max(0, parseFloat(commInput) || 0);

  const marginPerContract = spec?.marginEstHKD ?? 0;
  const totalMargin       = contracts * marginPerContract;

  const handleRun = () => {
    // v2: needs slowPeriod (MA150) + swing warmup — minimum ~169 bars
    if (candles.length < ma3Period + 20) return;
    const r = runBacktest(
      candles,
      ma1Period,    // MA5
      ma2Period,    // MA30
      ma3Period,    // MA150
      contracts,    // shares
      2.5,          // tpRatio — SL × 2.5, fixed by book rules
      0.008,        // proximityPct — 0.8% from MA30
      commPerRound,
      2,            // swingLookback
      false         // no evening for ETF
    );
    setResult(r); setRan(true);
  };

  const cumData = useMemo(() => {
    if (!result) return [];
    return result.trades.reduce<{ label: string; cum: number }[]>((acc, t, i) => {
      const prev = acc[i - 1]?.cum ?? 0;
      acc.push({ label: `#${i + 1}`, cum: parseFloat((prev + t.pnl).toFixed(2)) });
      return acc;
    }, []);
  }, [result]);

  const rrRatio = 2.5;  // Fixed by v2 book rules
  const interp = result ? getInterpretation(result, rrRatio, commPerRound, multiplier, lang) : null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>{tr('backtestTitle', lang)}</div>
      <div style={styles.desc}>
        {tr('backtestDesc1', lang)} {candles.length} {tr('backtestDesc2', lang)}
      </div>

      {isFutures && (
        <div style={styles.futuresNote}>
          {isEN
            ? `📐 Futures mode — P&L = pts × HK$${multiplier}/pt × contracts. Session filter active (no dead-zone signals). Commission deducted.`
            : `📐 期貨模式 — 盈兹 = 點數 × HK$${multiplier}/點 × 合約數。已套用交易時段過濾，會費已扣除。`}
        </div>
      )}

      <div style={styles.inputHint}>
        {isEN
          ? `💡 v2 Settings: Dynamic SL/TP (structure-based). 2.5:1 R:R. Commission ${fmtHKD(commPerRound)}/round. Click Run Backtest.`
          : `💡 v2 設置：結構止損/止盈（動態）。風報比 2.5:1。會費 ${fmtHKD(commPerRound)}/回。直接點擊執行。`}
      </div>

      <div style={styles.grid}>
        <Field
          label={isFutures
            ? (isEN ? `Contracts (HK$${multiplier}/pt each)` : `合約數（每張HK$${multiplier}/點）`)
            : (isEN ? 'Capital per trade' : '每次交易資本')}
          hint={isFutures
            ? (isEN
                ? `Margin: ${fmtHKD(totalMargin)} · P&L per 1pt: HK$${multiplier * contracts}`
                : `保證金: ${fmtHKD(totalMargin)} · 每1點: HK$${multiplier * contracts}`)
            : (isEN ? 'HKD per trade' : '每筆HKD')}
        >
          <input style={styles.input} type="number" min="1" value={contractsInput}
            onChange={(e) => setContractsInput(e.target.value)} />
        </Field>

        <Field
          label={isEN ? 'SL / TP Mode' : '止損/止盈模式'}
          hint={isEN
            ? 'v2: Structure-based. SL = prev swing LOW/HIGH. TP = SL × 2.5 (RR 2.5:1). Fixed by book rules.'
            : 'v2：結構止損。SL = 前擺動低/高點，TP = SL × 2.5（風報比2.5:1）。按書本規則固定。'}
        >
          <div style={{
            background: '#0f0f1a', border: '1px solid #2a2a3e',
            color: '#f0b90b', padding: '6px 10px', borderRadius: 6,
            fontFamily: 'monospace', fontSize: '0.78rem',
          }}>
            {isEN ? '⚡ Dynamic (K均 v2)' : '⚡ 動態結構止損 (K均 v2)'}
          </div>
        </Field>

        <Field
          label={isEN ? 'Commission HKD/round' : '會費 HKD/回'}
          hint={isEN
            ? `Entry + exit fees. ETF ≈ HK$60–80/round. Deducted from each trade P&L.`
            : `開倉+平倉會費。ETF 約 HK$60–80/回。從每筆P&L扣除。`}
        >
          <input style={styles.input} type="number" min="0" value={commInput}
            onChange={(e) => setCommInput(e.target.value)} />
        </Field>
      </div>

      <button onClick={handleRun} style={styles.runBtn} disabled={candles.length < 20}>
        ▶ {tr('runBacktest', lang)} ({candles.length} {lang === 'ZH' ? '根K線' : 'candles'})
      </button>

      {ran && result && (
        <>
          <div style={styles.sectionTitle}>{tr('backtestResults', lang)}</div>
          <div style={styles.summaryGrid}>
            <SBox label={tr('btTotalTrades', lang)}   value={result.totalSignals.toString()} />
            <SBox label={tr('btWinRate', lang)}        value={`${result.winRate}%`}  color={result.winRate >= 50 ? '#00c853' : '#ff9800'} />
            <SBox label={tr('btTotalPnl', lang)}       value={`${result.totalPnl >= 0 ? '+' : ''}${fmtHKD(result.totalPnl)}`} color={result.totalPnl >= 0 ? '#00c853' : '#ff1744'} />
            <SBox label={tr('btTotalReturn', lang)}    value={`${result.totalPnlPct >= 0 ? '+' : ''}${result.totalPnlPct}%`} color={result.totalPnlPct >= 0 ? '#00c853' : '#ff1744'} />
            <SBox label={tr('btProfitFactor', lang)}   value={result.profitFactor.toString()} color={result.profitFactor >= 1.5 ? '#00c853' : '#ff9800'} tooltip={tr('btPFTip', lang)} />
            <SBox label={tr('btMaxDD', lang)}          value={`-${fmtHKD(result.maxDrawdown)}`} color="#ff9800" tooltip={tr('btMaxDDTip', lang)} />
            <SBox label={tr('btWins', lang)}           value={result.wins.toString()}   color="#00c853" />
            <SBox label={tr('btLosses', lang)}         value={result.losses.toString()} color="#ff1744" />
            <SBox
              label={isEN ? 'Total Commission' : '總會費'}
              value={`-${fmtHKD(result.totalCommission)}`}
              color="#888"
              tooltip={isEN
                ? `${result.totalSignals} trades × HK$${commPerRound}/round = ${fmtHKD(result.totalCommission)} in fees`
                : `${result.totalSignals} 筆 × HK$${commPerRound}/回 = ${fmtHKD(result.totalCommission)} 會費`}
            />
            <SBox
              label={isEN ? 'Range Filtered' : '盤整過濾'}
              value={result.rangeFiltered.toString()}
              color="#f0b90b"
              tooltip={isEN
                ? `${result.rangeFiltered} entry-eligible candles skipped because MA5/MA30/MA150 were not cleanly aligned (RANGE state). This is the K均 RANGE kill-switch working correctly.`
                : `${result.rangeFiltered} 根符合條件的K線因MA5/MA30/MA150排列混亂（盤整狀態）而被過濾。這是K均均線排列過濾器正常運作。`}
            />
            <SBox
              label={isEN ? 'Avg SL Dist' : '平均止損距離'}
              value={result.avgSlDist > 0 ? result.avgSlDist.toFixed(3) : '—'}
              color="#888"
              tooltip={isEN
                ? `Average structure-based SL distance (price points). Based on previous swing point, not a fixed %. Avg TP = ${result.avgTpDist.toFixed(3)} pts.`
                : `平均結構止損距離（價格點數），基於前一個擺動低/高點，非固定百分比。平均止盈 = ${result.avgTpDist.toFixed(3)} 點。`}
            />
          </div>

          {interp && (
            <div style={styles.interpWrapper}>
              <div style={styles.interpHeader}>
                <span style={{ fontSize: '1.1rem' }}>{interp.verdictIcon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: interp.verdictColor }}>
                  {isEN
                    ? interp.isProfitable && interp.isViable
                      ? "Strategy profitable after commission — here's what the numbers mean:"
                      : "Results need attention — here's what the numbers mean:"
                    : interp.isProfitable && interp.isViable
                      ? '扣除會費後策略仍獲利 — 以下是數字的含義：'
                      : '結果需要留意 — 以下是數字的含義：'}
                </span>
              </div>
              <div style={styles.interpLines}>
                {interp.lines.map((line, i) => (
                  <div key={i} style={styles.interpLine}>
                    <span style={{ flexShrink: 0 }}>{line.icon}</span>
                    <span style={{ fontSize: '0.78rem', color: line.color, lineHeight: 1.6 }}>{line.text}</span>
                  </div>
                ))}
              </div>
              <div style={styles.interpFooter}>
                {isEN
                  ? '⚠️ Past performance does not guarantee future results. Always use stop loss. Commission rates vary — check with your broker for latest fees.'
                  : '⚠️ 過去表現不代表未來結果。每次交易必須設置止蚁。會費以登記訿商最新公告為準。'}
              </div>
            </div>
          )}

          {cumData.length > 1 && (
            <>
              <div style={styles.sectionTitle}>{tr('btCumChart', lang)}</div>
              <div style={styles.chartBox}>
                <svg width="100%" height="100"
                  viewBox={`0 0 ${Math.max(cumData.length * 36, 400)} 100`}
                  preserveAspectRatio="none"
                >
                  {(() => {
                    const vals  = cumData.map((d) => d.cum);
                    const minV  = Math.min(...vals, 0); const maxV = Math.max(...vals, 0);
                    const range = maxV - minV || 1;
                    const W     = Math.max(cumData.length * 36, 400);
                    const step  = W / (cumData.length - 1 || 1);
                    const toY   = (v: number) => 88 - ((v - minV) / range) * 78;
                    const zeroY = toY(0);
                    const pts   = cumData.map((d, i) => `${i * step},${toY(d.cum)}`).join(' ');
                    const lastVal = vals[vals.length - 1];
                    const area  = `M0,${toY(cumData[0].cum)} `
                      + cumData.slice(1).map((d, i) => `L${(i + 1) * step},${toY(d.cum)}`).join(' ')
                      + ` L${(cumData.length - 1) * step},${zeroY} L0,${zeroY} Z`;
                    return (
                      <>
                        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
                        <path d={area} fill={lastVal >= 0 ? '#00c85320' : '#ff174420'} />
                        <polyline points={pts} fill="none" stroke={lastVal >= 0 ? '#00c853' : '#ff1744'} strokeWidth="2" />
                        {cumData.map((d, i) => (
                          <circle key={i} cx={i * step} cy={toY(d.cum)} r="3" fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </>
          )}

          {result.trades.length > 0 && (
            <>
              <div style={styles.sectionTitle}>{tr('btTradeList', lang)} ({result.trades.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead><tr>
                    {['#', tr('btDir', lang), tr('btEntryTime', lang), tr('btEntryPrice', lang),
                      tr('btExitPrice', lang), tr('btPnl', lang), tr('btReturn', lang), tr('btExitReason', lang)]
                      .map((h) => <th key={h} style={styles.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={{ ...styles.td, color: t.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                          {t.type === 'LONG' ? '🟢 L' : '🔴 S'}
                        </td>
                        <td style={styles.td}>{fmtTime(t.entryTime)}</td>
                        <td style={styles.td}>{t.entryPrice.toFixed(0)} pts</td>
                        <td style={styles.td}>{t.exitPrice.toFixed(0)} pts</td>
                        <td style={{ ...styles.td, color: t.pnl >= 0 ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>
                          {t.pnl >= 0 ? '+' : ''}{fmtHKD(t.pnl)}
                        </td>
                        <td style={{ ...styles.td, color: t.pnlPct >= 0 ? '#00c853' : '#ff1744' }}>
                          {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct}%
                        </td>
                        <td style={{ ...styles.td,
                          color: t.exitReason === 'TP' ? '#00c853'
                               : t.exitReason === 'SL' ? '#ff1744' : '#888' }}
                        >
                          {t.exitReason === 'TP' ? tr('btTP', lang)
                           : t.exitReason === 'SL' ? tr('btSL', lang)
                           : tr('btIncomplete', lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {result.totalSignals === 0 && (
            <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.82rem' }}>
              {tr('btNoSignal', lang)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '0.65rem', color: '#333', fontFamily: 'monospace', lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}
function SBox({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '9px 11px', border: '1px solid #1a1a2e' }} title={tooltip}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper:       { background: '#1a1a2e', border: '1px solid #ab47bc', borderRadius: 10, padding: 16, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  title:         { fontSize: '1rem', color: '#ab47bc', fontFamily: 'monospace', fontWeight: 'bold' },
  desc:          { fontSize: '0.78rem', color: '#555', fontFamily: 'monospace' },
  futuresNote:   { fontSize: '0.78rem', color: '#f0b90b', fontFamily: 'monospace', background: '#1a1200', border: '1px solid #f0b90b33', borderRadius: 6, padding: '8px 12px' },
  inputHint:     { fontSize: '0.78rem', color: '#29b6f6', fontFamily: 'monospace', background: '#0d2a3e', border: '1px solid #29b6f630', borderRadius: 6, padding: '8px 12px', lineHeight: 1.5 },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 },
  input:         { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  runBtn:        { background: '#2a0a3e', border: '1px solid #ab47bc', color: '#ab47bc', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' },
  sectionTitle:  { fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  summaryGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: 8 },
  chartBox:      { background: '#0f0f1a', borderRadius: 8, padding: '10px 8px', border: '1px solid #1a1a2e', overflowX: 'auto' },
  table:         { width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.77rem', minWidth: 560 },
  th:            { padding: '7px 10px', color: '#444', fontWeight: 'normal', textAlign: 'left', borderBottom: '1px solid #1a1a2e', whiteSpace: 'nowrap' },
  td:            { padding: '7px 10px', color: '#aaa', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  interpWrapper: { background: '#0d1a0d', border: '1px solid #00c85333', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  interpHeader:  { display: 'flex', gap: 10, alignItems: 'center' },
  interpLines:   { display: 'flex', flexDirection: 'column', gap: 8 },
  interpLine:    { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#ffffff06', borderRadius: 6, padding: '8px 10px' },
  interpFooter:  { fontSize: '0.72rem', color: '#444', fontFamily: 'monospace', borderTop: '1px solid #1a1a2e', paddingTop: 8, marginTop: 2 },
};
