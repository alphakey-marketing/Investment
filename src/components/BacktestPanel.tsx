import React, { useState, useMemo } from 'react';
import { Candle } from '../types/binance';
import { BacktestResult } from '../types/mode';
import { runBacktest } from '../utils/backtest';

interface Props {
  candles: Candle[];
  ma1Period: number;
  ma2Period: number;
}

function fmt2(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString('zh-HK', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function BacktestPanel({ candles, ma1Period, ma2Period }: Props) {
  const [capital, setCapital] = useState('1000');
  const [riskPct, setRiskPct] = useState('2');
  const [slPct, setSlPct] = useState('1');
  const [tpPct, setTpPct] = useState('3');
  const [ran, setRan] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRun = () => {
    if (candles.length < Math.max(ma1Period, ma2Period) + 10) return;
    const r = runBacktest(
      candles, ma1Period, ma2Period,
      parseFloat(capital) || 1000,
      parseFloat(riskPct) || 2,
      parseFloat(slPct) / 100 || 0.01,
      parseFloat(tpPct) / 100 || 0.03,
    );
    setResult(r);
    setRan(true);
  };

  // Cumulative PnL for chart
  const cumData = useMemo(() => {
    if (!result) return [];
    return result.trades.reduce<{ label: string; cum: number }[]>((acc, t, i) => {
      const prev = acc[i - 1]?.cum ?? 0;
      acc.push({ label: `#${i + 1}`, cum: parseFloat((prev + t.pnl).toFixed(2)) });
      return acc;
    }, []);
  }, [result]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.title}>🔍 策略回湋測試</div>
      <div style={styles.desc}>
        基於現有 {candles.length} 根K線數據，模擬 K均交易法在歷史上的表現。
      </div>

      {/* Settings */}
      <div style={styles.grid}>
        <Field label="每次倉位資金 (USDT)">
          <input style={styles.input} type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />
        </Field>
        <Field label="風險 % (占資金)">
          <input style={styles.input} type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
        </Field>
        <Field label="止蝕 %">
          <input style={styles.input} type="number" value={slPct} onChange={(e) => setSlPct(e.target.value)} />
        </Field>
        <Field label="止盈 %">
          <input style={styles.input} type="number" value={tpPct} onChange={(e) => setTpPct(e.target.value)} />
        </Field>
      </div>
      <button onClick={handleRun} style={styles.runBtn} disabled={candles.length < 20}>
        ▶ 開始回湋 ({candles.length} 根K線)
      </button>

      {ran && result && (
        <>
          {/* Summary */}
          <div style={styles.sectionTitle}>📊 回湋結果</div>
          <div style={styles.summaryGrid}>
            <StatBox label="總交易" value={result.totalSignals.toString()} />
            <StatBox label="勝率" value={`${result.winRate}%`} color={result.winRate >= 50 ? '#00c853' : '#ff9800'} />
            <StatBox label="總盈虧" value={`${result.totalPnl >= 0 ? '+' : ''}$${fmt2(result.totalPnl)}`} color={result.totalPnl >= 0 ? '#00c853' : '#ff1744'} />
            <StatBox label="總回報%" value={`${result.totalPnlPct >= 0 ? '+' : ''}${result.totalPnlPct}%`} color={result.totalPnlPct >= 0 ? '#00c853' : '#ff1744'} />
            <StatBox label="獲利因子" value={result.profitFactor.toString()} color={result.profitFactor >= 1.5 ? '#00c853' : '#ff9800'} tooltip="總盈利÷總虧損，>1.5=優秀" />
            <StatBox label="最大回撤" value={`-$${fmt2(result.maxDrawdown)}`} color="#ff9800" tooltip="期間最大連續虧損" />
            <StatBox label="胜數" value={result.wins.toString()} color="#00c853" />
            <StatBox label="敗數" value={result.losses.toString()} color="#ff1744" />
          </div>

          {/* P&L Chart */}
          {cumData.length > 1 && (
            <>
              <div style={styles.sectionTitle}>📈 回湋累計盈虧曲線</div>
              <div style={styles.chartBox}>
                <svg width="100%" height="100" viewBox={`0 0 ${Math.max(cumData.length * 36, 400)} 100`} preserveAspectRatio="none">
                  {(() => {
                    const vals = cumData.map((d) => d.cum);
                    const minV = Math.min(...vals, 0);
                    const maxV = Math.max(...vals, 0);
                    const range = maxV - minV || 1;
                    const W = Math.max(cumData.length * 36, 400);
                    const step = W / (cumData.length - 1 || 1);
                    const toY = (v: number) => 88 - ((v - minV) / range) * 78;
                    const zeroY = toY(0);
                    const pts = cumData.map((d, i) => `${i * step},${toY(d.cum)}`).join(' ');
                    const lastVal = vals[vals.length - 1];
                    const area = `M0,${toY(cumData[0].cum)} ` +
                      cumData.slice(1).map((d, i) => `L${(i + 1) * step},${toY(d.cum)}`).join(' ') +
                      ` L${(cumData.length - 1) * step},${zeroY} L0,${zeroY} Z`;
                    return (
                      <>
                        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
                        <path d={area} fill={lastVal >= 0 ? '#00c85320' : '#ff174420'} />
                        <polyline points={pts} fill="none" stroke={lastVal >= 0 ? '#00c853' : '#ff1744'} strokeWidth="2" />
                        {cumData.map((d, i) => (
                          <circle key={i} cx={i * step} cy={toY(d.cum)} r="3"
                            fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </>
          )}

          {/* Trade list */}
          {result.trades.length > 0 && (
            <>
              <div style={styles.sectionTitle}>📋 回湋交易明細 ({result.trades.length}筆)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['#','方向','入場時間','入場價','出場價','盈虧 (USDT)','返回%','出場原因'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                        <td style={styles.td}>{i + 1}</td>
                        <td style={{ ...styles.td, color: t.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                          {t.type === 'LONG' ? '🟢 多' : '🔴 空'}
                        </td>
                        <td style={styles.td}>{fmtTime(t.entryTime)}</td>
                        <td style={styles.td}>${fmt2(t.entryPrice)}</td>
                        <td style={styles.td}>${fmt2(t.exitPrice)}</td>
                        <td style={{ ...styles.td, color: t.pnl >= 0 ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>
                          {t.pnl >= 0 ? '+' : ''}${fmt2(t.pnl)}
                        </td>
                        <td style={{ ...styles.td, color: t.pnlPct >= 0 ? '#00c853' : '#ff1744' }}>
                          {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct}%
                        </td>
                        <td style={{ ...styles.td, color: t.exitReason === 'TP' ? '#00c853' : t.exitReason === 'SL' ? '#ff1744' : '#888' }}>
                          {t.exitReason === 'TP' ? '🎯 止盈' : t.exitReason === 'SL' ? '🛑 止蝕' : '⏹ 歼未完成'}
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
              ⚠️ 現有K線未測到符合K均條件的訊號，試調整MA期數或切換到較長時間框。
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace' }}>{label}</span>
      {children}
    </div>
  );
}

function StatBox({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '9px 11px', border: '1px solid #1a1a2e' }} title={tooltip}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { background: '#1a1a2e', border: '1px solid #ab47bc', borderRadius: 10, padding: 16, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: '1rem', color: '#ab47bc', fontFamily: 'monospace', fontWeight: 'bold' },
  desc: { fontSize: '0.78rem', color: '#555', fontFamily: 'monospace' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 },
  input: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  runBtn: { background: '#2a0a3e', border: '1px solid #ab47bc', color: '#ab47bc', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' },
  sectionTitle: { fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
  chartBox: { background: '#0f0f1a', borderRadius: 8, padding: '10px 8px', border: '1px solid #1a1a2e', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.77rem', minWidth: 560 },
  th: { padding: '7px 10px', color: '#444', fontWeight: 'normal', textAlign: 'left', borderBottom: '1px solid #1a1a2e', whiteSpace: 'nowrap' },
  td: { padding: '7px 10px', color: '#aaa', verticalAlign: 'middle', whiteSpace: 'nowrap' },
};
