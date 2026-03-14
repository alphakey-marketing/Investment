import React, { useState, useMemo } from 'react';
import { Candle } from '../types/binance';
import { BacktestResult } from '../types/mode';
import { FutuSymbol, CONTRACT_SPECS } from '../types/futu';
import { runBacktest } from '../utils/backtest';
import { Lang, tr } from '../i18n';

interface Props {
  candles:   Candle[];
  ma1Period: number;
  ma2Period: number;
  symbol:    string;
  lang:      Lang;
}

function fmt2(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtHKD(n: number) {
  return `HK$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

// ── Interpretation helper ─────────────────────────────────────────────────────
function getInterpretation(result: BacktestResult, rr: number, lang: Lang) {
  const isEN = lang === 'EN';
  const { winRate, totalPnl, profitFactor, totalSignals } = result;

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
        ? `Win rate ${winRate}% is well above break-even (${breakEvenWinRate}% needed for ${rr}:1 R:R). The strategy is mathematically profitable long-term.`
        : `勝率 ${winRate}% 遠高於保本線（${rr}:1 風報比只需 ${breakEvenWinRate}%）。此策略長期數學期望值為正。`,
    });
  } else if (winRate >= breakEvenWinRate) {
    lines.push({ icon: '⚠️', color: '#f0b90b',
      text: isEN
        ? `Win rate ${winRate}% is just above break-even (${breakEvenWinRate}% needed). Profitable, but only by a small margin — stick to the rules every trade.`
        : `勝率 ${winRate}% 僅略高於保本線（需 ${breakEvenWinRate}%）。有獲利，但空間不大，每筆交易都必須嚴守紀律。`,
    });
  } else {
    lines.push({ icon: '❌', color: '#ff9800',
      text: isEN
        ? `Win rate ${winRate}% is BELOW break-even of ${breakEvenWinRate}% for this ${rr}:1 R:R. Consider reviewing stop-loss/take-profit levels.`
        : `勝率 ${winRate}% 低於 ${rr}:1 風報比所需的保本線 ${breakEvenWinRate}%。建議重新審視止蝕／止盈設定。`,
    });
  }

  if (isPFStrong) {
    lines.push({ icon: '✅', color: '#00c853',
      text: isEN
        ? `Profit Factor ${result.profitFactor} (≥1.5 is strong). For every HK$1 lost, the strategy earns HK$${result.profitFactor}.`
        : `盈利因子 ${result.profitFactor}（≥1.5 為強勁）。每虧損 HK$1，策略可賺 HK$${result.profitFactor}。`,
    });
  } else if (profitFactor >= 1.0) {
    lines.push({ icon: '⚠️', color: '#f0b90b',
      text: isEN
        ? `Profit Factor ${result.profitFactor} (above 1 = profitable, but aim for 1.5+). Marginal edge — needs consistent execution.`
        : `盈利因子 ${result.profitFactor}（>1 代表獲利，但目標應達 1.5+）。優勢有限，需要一致執行。`,
    });
  } else {
    lines.push({ icon: '❌', color: '#ff1744',
      text: isEN
        ? `Profit Factor ${result.profitFactor} is below 1.0 — the strategy is losing money overall. Consider different parameters.`
        : `盈利因子 ${result.profitFactor} 低於 1.0 — 策略整體虧損。建議調整參數。`,
    });
  }

  if (totalSignals < 15) {
    lines.push({ icon: '⚠️', color: '#888',
      text: isEN
        ? `Only ${totalSignals} trades — this is a small sample. Load more candles for a more reliable result.`
        : `只有 ${totalSignals} 筆交易 — 樣本較小。請載入更多K線以獲得更可靠的結果。`,
    });
  }

  lines.push({ icon: '💡', color: '#29b6f6',
    text: isEN
      ? `Key insight: Even a 40% win-rate strategy is profitable with a 3:1 R:R. What matters most is ALWAYS using your stop loss on every trade — never skip it.`
      : `重點認知：即使勝率只有 40%，只要風報比達 3:1 就能獲利。最重要的是每筆交易都必須設置止蝕——絕不跳過。`,
  });

  return { verdictIcon, verdictColor, isProfitable, isViable, lines };
}

export default function BacktestPanel({ candles, ma1Period, ma2Period, symbol, lang }: Props) {
  const spec       = CONTRACT_SPECS[symbol as FutuSymbol];
  const isFutures  = spec?.isFutures ?? false;
  const multiplier = spec?.multiplier ?? 1;

  const [contractsInput, setContractsInput] = useState('1');
  const [slPct,          setSlPct]          = useState(isFutures ? '0.5' : '1');    // % for signal detection
  const [tpPct,          setTpPct]          = useState(isFutures ? '1.5' : '3');
  const [ran,            setRan]            = useState(false);
  const [result,         setResult]         = useState<BacktestResult | null>(null);
  const isEN = lang === 'EN';

  const rrRatio   = parseFloat(tpPct) / parseFloat(slPct) || 3;
  const contracts = Math.max(1, parseInt(contractsInput) || 1);

  // Estimated margin for info display
  const marginPerContract = spec?.marginEstHKD ?? 0;
  const totalMargin       = contracts * marginPerContract;

  const handleRun = () => {
    if (candles.length < Math.max(ma1Period, ma2Period) + 10) return;
    const r = runBacktest(
      candles, ma1Period, ma2Period,
      contracts, multiplier,
      parseFloat(slPct)  / 100 || 0.005,
      parseFloat(tpPct)  / 100 || 0.015,
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

  const interp = result ? getInterpretation(result, rrRatio, lang) : null;

  // SL / TP in points for display hint
  const sampleEntry  = candles[candles.length - 1]?.close ?? 20000;
  const slPts        = Math.round(sampleEntry * (parseFloat(slPct) / 100));
  const tpPts        = Math.round(sampleEntry * (parseFloat(tpPct) / 100));
  const slHKD        = slPts * multiplier * contracts;
  const tpHKD        = tpPts * multiplier * contracts;

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>{tr('backtestTitle', lang)}</div>
      <div style={styles.desc}>
        {tr('backtestDesc1', lang)} {candles.length} {tr('backtestDesc2', lang)}
      </div>

      {isFutures && (
        <div style={styles.futuresNote}>
          {isEN
            ? `📐 Futures mode — P&L = pts × HK$${multiplier}/pt × contracts. Each trade uses real HKD point math.`
            : `📐 期貨模式 — 盈虧 = 點數 × HK$${multiplier}/點 × 合約數。每筆交易以真實港幣計算。`}
        </div>
      )}

      <div style={styles.inputHint}>
        {isEN
          ? `💡 Defaults: ${isFutures ? `1 contract, SL=${slPct}% (≈${slPts}pts = -HK$${slHKD.toLocaleString()}), TP=${tpPct}% (≈${tpPts}pts = +HK$${tpHKD.toLocaleString()})` : '2% risk, 1% SL, 3% TP (3:1 R:R)'}. Click Run Backtest.`
          : `💡 預設：${isFutures ? `1張合約，止蝕=${slPct}%（約${slPts}點 = -HK$${slHKD.toLocaleString()}），止盈=${tpPct}%（約${tpPts}點 = +HK$${tpHKD.toLocaleString()}）` : '2%風險、1%止蝕、3%止盈（3:1風報比）'}。直接點擊執行。`}
      </div>

      <div style={styles.grid}>
        <Field
          label={isFutures
            ? (isEN ? `Contracts (HK$${multiplier}/pt each)` : `合約數（每張HK$${multiplier}/點）`)
            : (isEN ? 'Capital per trade' : '每次交易資本')}
          hint={isFutures
            ? (isEN
                ? `Margin locked: HK$${totalMargin.toLocaleString()} · P&L per 1pt: HK$${multiplier * contracts}`
                : `鎖定保證金：HK$${totalMargin.toLocaleString()} · 每1點盈虧：HK$${multiplier * contracts}`)
            : (isEN ? 'How much HK$ you invest per trade' : '每次交易投入多少資金')}
        >
          <input style={styles.input} type="number" min="1" value={contractsInput}
            onChange={(e) => setContractsInput(e.target.value)} />
        </Field>
        <Field
          label={isEN ? 'Stop Loss %' : '止蝕 %'}
          hint={isEN
            ? `≈ ${slPts} pts = -HK$${slHKD.toLocaleString()} per trade`
            : `約 ${slPts} 點 = 每筆 -HK$${slHKD.toLocaleString()}`}
        >
          <input style={styles.input} type="number" value={slPct} onChange={(e) => setSlPct(e.target.value)} />
        </Field>
        <Field
          label={isEN ? `Take Profit % (R:R = ${rrRatio.toFixed(1)}:1)` : `止盈 %（風報比 = ${rrRatio.toFixed(1)}:1）`}
          hint={isEN
            ? `≈ ${tpPts} pts = +HK$${tpHKD.toLocaleString()} per trade`
            : `約 ${tpPts} 點 = 每筆 +HK$${tpHKD.toLocaleString()}`}
        >
          <input style={styles.input} type="number" value={tpPct} onChange={(e) => setTpPct(e.target.value)} />
        </Field>
      </div>

      <button onClick={handleRun} style={styles.runBtn} disabled={candles.length < 20}>
        ▶ {tr('runBacktest', lang)} ({candles.length} {lang === 'ZH' ? '根K線' : 'candles'})
      </button>

      {ran && result && (
        <>
          <div style={styles.sectionTitle}>{tr('backtestResults', lang)}</div>
          <div style={styles.summaryGrid}>
            <SBox label={tr('btTotalTrades', lang)} value={result.totalSignals.toString()} />
            <SBox label={tr('btWinRate', lang)} value={`${result.winRate}%`} color={result.winRate >= 50 ? '#00c853' : '#ff9800'} />
            <SBox label={tr('btTotalPnl', lang)} value={`${result.totalPnl >= 0 ? '+' : ''}${fmtHKD(result.totalPnl)}`} color={result.totalPnl >= 0 ? '#00c853' : '#ff1744'} />
            <SBox label={tr('btTotalReturn', lang)} value={`${result.totalPnlPct >= 0 ? '+' : ''}${result.totalPnlPct}%`} color={result.totalPnlPct >= 0 ? '#00c853' : '#ff1744'} />
            <SBox label={tr('btProfitFactor', lang)} value={result.profitFactor.toString()} color={result.profitFactor >= 1.5 ? '#00c853' : '#ff9800'} tooltip={tr('btPFTip', lang)} />
            <SBox label={tr('btMaxDD', lang)} value={`-${fmtHKD(result.maxDrawdown)}`} color="#ff9800" tooltip={tr('btMaxDDTip', lang)} />
            <SBox label={tr('btWins', lang)} value={result.wins.toString()} color="#00c853" />
            <SBox label={tr('btLosses', lang)} value={result.losses.toString()} color="#ff1744" />
          </div>

          {interp && (
            <div style={styles.interpWrapper}>
              <div style={styles.interpHeader}>
                <span style={{ fontSize: '1.1rem' }}>{interp.verdictIcon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: interp.verdictColor }}>
                  {isEN
                    ? interp.isProfitable && interp.isViable
                      ? 'Strategy looks profitable — here\'s what the numbers mean:'
                      : 'Results need attention — here\'s what the numbers mean:'
                    : interp.isProfitable && interp.isViable
                      ? '策略看起來有獲利潛力 — 以下是數字的含義：'
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
                  ? '⚠️ Past performance does not guarantee future results. Always use stop loss.'
                  : '⚠️ 過去表現不代表未來結果。每次交易必須設置止蝕。'}
              </div>
            </div>
          )}

          {cumData.length > 1 && (
            <>
              <div style={styles.sectionTitle}>{tr('btCumChart', lang)}</div>
              <div style={styles.chartBox}>
                <svg width="100%" height="100" viewBox={`0 0 ${Math.max(cumData.length * 36, 400)} 100`} preserveAspectRatio="none">
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
                    const area  = `M0,${toY(cumData[0].cum)} ` + cumData.slice(1).map((d, i) => `L${(i + 1) * step},${toY(d.cum)}`).join(' ') + ` L${(cumData.length - 1) * step},${zeroY} L0,${zeroY} Z`;
                    return (
                      <>
                        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
                        <path d={area} fill={lastVal >= 0 ? '#00c85320' : '#ff174420'} />
                        <polyline points={pts} fill="none" stroke={lastVal >= 0 ? '#00c853' : '#ff1744'} strokeWidth="2" />
                        {cumData.map((d, i) => <circle key={i} cx={i * step} cy={toY(d.cum)} r="3" fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />)}
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
                    {['#', tr('btDir', lang), tr('btEntryTime', lang), tr('btEntryPrice', lang), tr('btExitPrice', lang), tr('btPnl', lang), tr('btReturn', lang), tr('btExitReason', lang)].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={{ ...styles.td, color: t.type === 'LONG' ? '#00c853' : '#ff1744' }}>{t.type === 'LONG' ? '🟢 L' : '🔴 S'}</td>
                        <td style={styles.td}>{fmtTime(t.entryTime)}</td>
                        <td style={styles.td}>{t.entryPrice.toFixed(0)} pts</td>
                        <td style={styles.td}>{t.exitPrice.toFixed(0)} pts</td>
                        <td style={{ ...styles.td, color: t.pnl >= 0 ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>{t.pnl >= 0 ? '+' : ''}{fmtHKD(t.pnl)}</td>
                        <td style={{ ...styles.td, color: t.pnlPct >= 0 ? '#00c853' : '#ff1744' }}>{t.pnlPct >= 0 ? '+' : ''}{t.pnlPct}%</td>
                        <td style={{ ...styles.td, color: t.exitReason === 'TP' ? '#00c853' : t.exitReason === 'SL' ? '#ff1744' : '#888' }}>
                          {t.exitReason === 'TP' ? tr('btTP', lang) : t.exitReason === 'SL' ? tr('btSL', lang) : tr('btIncomplete', lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {result.totalSignals === 0 && <div style={{ color: '#555', fontFamily: 'monospace', fontSize: '0.82rem' }}>{tr('btNoSignal', lang)}</div>}
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
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 },
  input:         { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  runBtn:        { background: '#2a0a3e', border: '1px solid #ab47bc', color: '#ab47bc', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' },
  sectionTitle:  { fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  summaryGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
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
