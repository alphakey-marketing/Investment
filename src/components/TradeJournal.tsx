import React, { useState } from 'react';
import { TradeRecord } from '../types/trade';
import { calcPerformance } from '../hooks/useTradeJournal';

interface Props {
  trades: TradeRecord[];
  onClose: (id: string, exitPrice: number) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString('zh-HK', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function TradeJournal({ trades, onClose, onDelete, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitInput, setExitInput] = useState('');

  const perf = calcPerformance(trades);

  const handleClose = (id: string) => {
    const price = parseFloat(exitInput);
    if (!price) return;
    onClose(id, price);
    setClosingId(null);
    setExitInput('');
  };

  const cumPnlData = trades
    .filter((t) => t.result !== 'OPEN')
    .slice()
    .reverse()
    .reduce<{ label: string; cum: number }[]>((acc, t, i) => {
      const prev = acc[i - 1]?.cum ?? 0;
      acc.push({ label: `#${i + 1}`, cum: parseFloat((prev + (t.pnl ?? 0)).toFixed(2)) });
      return acc;
    }, []);

  if (trades.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        📒 交易記錄 &amp; 績效追蹤
        <span style={{
          marginLeft: 8,
          color: perf.totalPnl >= 0 ? '#00c853' : '#ff1744',
          fontWeight: 'bold',
        }}>
          {perf.totalPnl >= 0 ? '+' : ''}{fmt(perf.totalPnl)} USDT
        </span>
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {/* ── Performance Summary ── */}
          <div style={styles.sectionTitle}>📊 績效總覽</div>
          <div style={styles.summaryGrid}>
            <SummaryCard label="總交易" value={perf.totalTrades.toString()} />
            <SummaryCard label="勝率" value={`${perf.winRate}%`}
              color={perf.winRate >= 50 ? '#00c853' : '#ff9800'} />
            <SummaryCard label="總盈虧" value={`${perf.totalPnl >= 0 ? '+' : ''}$${fmt(perf.totalPnl)}`}
              color={perf.totalPnl >= 0 ? '#00c853' : '#ff1744'} />
            <SummaryCard label="獲利因子" value={perf.profitFactor.toString()}
              color={perf.profitFactor >= 1.5 ? '#00c853' : '#ff9800'}
              tooltip="總盈利 ÷ 總虧損。>1.5 = 優秀" />
            <SummaryCard label="平均獲利" value={`+$${fmt(perf.avgWin)}`} color="#00c853" />
            <SummaryCard label="平均虧損" value={`-$${fmt(perf.avgLoss)}`} color="#ff1744" />
            <SummaryCard label="最佳交易" value={`+$${fmt(perf.bestTrade)}`} color="#00c853" />
            <SummaryCard label="最差交易" value={`$${fmt(perf.worstTrade)}`} color="#ff1744" />
          </div>

          {/* ── Cumulative P&L mini chart ── */}
          {cumPnlData.length > 1 && (
            <>
              <div style={styles.sectionTitle}>📈 累計盈虧曲線</div>
              <div style={styles.miniChart}>
                <svg width="100%" height="80" viewBox={`0 0 ${cumPnlData.length * 40} 80`} preserveAspectRatio="none">
                  {(() => {
                    const vals = cumPnlData.map((d) => d.cum);
                    const minV = Math.min(...vals, 0);
                    const maxV = Math.max(...vals, 0);
                    const range = maxV - minV || 1;
                    const toY = (v: number) => 70 - ((v - minV) / range) * 60;
                    const zeroY = toY(0);
                    const pts = cumPnlData.map((d, i) => `${i * 40 + 20},${toY(d.cum)}`).join(' ');
                    const area = `M20,${toY(cumPnlData[0].cum)} ` +
                      cumPnlData.slice(1).map((d, i) => `L${(i + 1) * 40 + 20},${toY(d.cum)}`).join(' ') +
                      ` L${(cumPnlData.length - 1) * 40 + 20},${zeroY} L20,${zeroY} Z`;
                    const lastVal = vals[vals.length - 1];
                    return (
                      <>
                        <line x1="0" y1={zeroY} x2={cumPnlData.length * 40} y2={zeroY}
                          stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
                        <path d={area} fill={lastVal >= 0 ? '#00c85322' : '#ff174422'} />
                        <polyline points={pts} fill="none"
                          stroke={lastVal >= 0 ? '#00c853' : '#ff1744'} strokeWidth="2" />
                        {cumPnlData.map((d, i) => (
                          <circle key={i} cx={i * 40 + 20} cy={toY(d.cum)} r="3"
                            fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />
                        ))}
                      </>
                    );
                  })()}
                </svg>
                <div style={styles.chartLabels}>
                  {cumPnlData.map((d, i) => (
                    <span key={i} style={{ color: d.cum >= 0 ? '#00c853' : '#ff1744', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                      {d.cum >= 0 ? '+' : ''}{d.cum}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Trade Table ── */}
          <div style={styles.sectionTitle}>📋 交易明細</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['資產','方向','入場','出場','止蝕','止盈','盈虧 (USDT)','回報 %','狀態','操作'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>{t.symbol.replace('USDT', '')}</td>
                    <td style={{ ...styles.td, color: t.type === 'LONG' ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>
                      {t.type === 'LONG' ? '🟢 多' : '🔴 空'}
                    </td>
                    <td style={styles.td}>${fmt(t.entryPrice)}</td>
                    <td style={styles.td}>{t.exitPrice ? `$${fmt(t.exitPrice)}` : '—'}</td>
                    <td style={{ ...styles.td, color: '#ff174488' }}>${fmt(t.stopLoss)}</td>
                    <td style={{ ...styles.td, color: '#00c85388' }}>${fmt(t.takeProfit)}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold', color: t.pnl === null ? '#555' : t.pnl >= 0 ? '#00c853' : '#ff1744' }}>
                      {t.pnl === null ? '進行中' : `${t.pnl >= 0 ? '+' : ''}$${fmt(t.pnl)}`}
                    </td>
                    <td style={{ ...styles.td, color: t.pnlPct === null ? '#555' : t.pnlPct >= 0 ? '#00c853' : '#ff1744' }}>
                      {t.pnlPct === null ? '—' : `${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct}%`}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        background: t.result === 'WIN' ? '#0d3d1f' : t.result === 'LOSS' ? '#3d0d0d' : t.result === 'OPEN' ? '#1a1a2e' : '#2a2a1a',
                        color: t.result === 'WIN' ? '#00c853' : t.result === 'LOSS' ? '#ff1744' : t.result === 'OPEN' ? '#f0b90b' : '#888',
                        padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontFamily: 'monospace',
                      }}>
                        {t.result === 'WIN' ? '✅ 盈' : t.result === 'LOSS' ? '❌ 虧' : t.result === 'OPEN' ? '⏳ 開倉' : '➖ 平手'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {t.result === 'OPEN' ? (
                        closingId === t.id ? (
                          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              style={{ ...styles.closeInput }}
                              type="number"
                              placeholder="出場價"
                              value={exitInput}
                              onChange={(e) => setExitInput(e.target.value)}
                            />
                            <button onClick={() => handleClose(t.id)} style={styles.confirmBtn}>✓</button>
                            <button onClick={() => setClosingId(null)} style={styles.cancelBtn}>✕</button>
                          </span>
                        ) : (
                          <button onClick={() => { setClosingId(t.id); setExitInput(''); }} style={styles.closeBtn}>平倉</button>
                        )
                      ) : (
                        <button onClick={() => onDelete(t.id)} style={styles.deleteBtn}>🗑</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={onClear} style={styles.clearBtn}>🗑 清除所有記錄</button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a1a2e' }} title={tooltip}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}{tooltip ? ' ℹ️' : ''}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: {
    width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e',
    color: '#ccc', padding: '10px 16px', borderRadius: 10,
    cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', textAlign: 'left', gap: 8,
  },
  body: {
    background: '#13131f', border: '1px solid #2a2a3e', borderTop: 'none',
    borderRadius: '0 0 10px 10px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  sectionTitle: { fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 },
  miniChart: { background: '#0f0f1a', borderRadius: 8, padding: '10px', border: '1px solid #1a1a2e', overflowX: 'auto' },
  chartLabels: { display: 'flex', justifyContent: 'space-around', marginTop: 4, gap: 4, flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.78rem', minWidth: 600 },
  thead: { background: '#0f0f1a' },
  th: { padding: '8px 10px', color: '#444', fontWeight: 'normal', textAlign: 'left', borderBottom: '1px solid #1a1a2e', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #1a1a2e' },
  td: { padding: '8px 10px', color: '#aaa', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  closeInput: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff',
    padding: '3px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', width: 80, outline: 'none',
  },
  closeBtn: { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' },
  confirmBtn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' },
  cancelBtn: { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' },
  deleteBtn: { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem' },
  clearBtn: { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', alignSelf: 'flex-start' },
};
