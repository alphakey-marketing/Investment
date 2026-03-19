import React, { useState } from 'react';
import { TradeRecord } from '../types/trade';
import { calcPerformance } from '../hooks/useTradeJournal';
import { Lang, tr } from '../i18n';

interface Props {
  trades: TradeRecord[];
  onClose: (id: string, exitPrice: number) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  lang: Lang;
}

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

// Reflection prompts pool — randomly selected per trade
const PROMPTS_EN = [
  'Did I follow the signal, or did I override it? What did I learn?',
  'Was my stop loss placed correctly? Did I stick to it?',
  'Did I enter at the right time? Was I patient enough?',
  'How did this trade make me feel? Did emotions affect my decision?',
  'If I could redo this trade, what would I do differently?',
  'Did I respect my R:R ratio on this trade?',
];
const PROMPTS_ZH = [
  '我是否跟隨訊號交易？還是自行判斷覆蓋了訊號？學到了什麼？',
  '我的止蝕位置設定是否正確？是否嚴格執行了止蝕？',
  '我的進場時機是否準確？我是否足夠有耐心？',
  '這筆交易讓我有什麼感受？情緒是否影響了我的判斷？',
  '如果重來一次，我會做什麼不同的決定？',
  '這次交易是否遵守了我的風報比設定？',
];

function getPrompt(tradeId: string, isEN: boolean): string {
  // Deterministic pick based on trade ID so it doesn't change on re-render
  const pool = isEN ? PROMPTS_EN : PROMPTS_ZH;
  const idx = tradeId.charCodeAt(0) % pool.length;
  return pool[idx];
}

export default function TradeJournal({ trades, onClose, onDelete, onClear, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitInput, setExitInput] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});
  const isEN = lang === 'EN';
  const perf = calcPerformance(trades);

  const handleClose = (id: string) => {
    const price = parseFloat(exitInput);
    if (!price) return;
    onClose(id, price);
    setClosingId(null);
    setExitInput('');
  };

  const handleSaveNote = (id: string) => {
    setSavedNotes((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedNotes((prev) => ({ ...prev, [id]: false })), 2000);
  };

  const cumPnlData = trades
    .filter((t) => t.result !== 'OPEN')
    .slice().reverse()
    .reduce<{ label: string; cum: number }[]>((acc, t, i) => {
      const prev = acc[i - 1]?.cum ?? 0;
      acc.push({ label: `#${i + 1}`, cum: parseFloat((prev + (t.pnl ?? 0)).toFixed(2)) });
      return acc;
    }, []);

  if (trades.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        {tr('journalTitle', lang)}
        <span style={{ marginLeft: 8, color: perf.totalPnl >= 0 ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>
          {perf.totalPnl >= 0 ? '+' : ''}{fmt(perf.totalPnl)} USDT
        </span>
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {/* ── Reflection tip banner ───────────────────────────────── */}
          <div style={styles.reflectionBanner}>
            <span style={{ fontSize: '1rem' }}>📓</span>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#29b6f6', fontWeight: 'bold', marginBottom: 3 }}>
                {isEN ? 'Your Trading Journal — the most powerful tool a beginner has' : '交易日誌 — 新手最強大的進步工具'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#666', lineHeight: 1.6 }}>
                {isEN
                  ? 'Top traders review every trade and ask: "What did I do right? What can I improve?" Use the Notes field on each trade below to build this habit. Traders who journal improve 3× faster.'
                  : '頂級交易者會覆盤每一筆交易：「我做對了什麼？哪裡可以改善？」請利用下方每筆交易的備注欄養成這個習慣。有記錄日誌的交易者進步速度是普通人的 3 倍。'}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div style={styles.sectionTitle}>{tr('perfSummary', lang)}</div>
          <div style={styles.summaryGrid}>
            <SCard label={tr('totalTrades', lang)} value={perf.totalTrades.toString()} />
            <SCard label={tr('winRate', lang)} value={`${perf.winRate}%`} color={perf.winRate >= 50 ? '#00c853' : '#ff9800'} />
            <SCard label={tr('totalPnl', lang)} value={`${perf.totalPnl >= 0 ? '+' : ''}$${fmt(perf.totalPnl)}`} color={perf.totalPnl >= 0 ? '#00c853' : '#ff1744'} />
            <SCard label={tr('profitFactor', lang)} value={perf.profitFactor.toString()} color={perf.profitFactor >= 1.5 ? '#00c853' : '#ff9800'} tooltip={tr('profitFactorTip', lang)} />
            <SCard label={tr('avgWin', lang)} value={`+$${fmt(perf.avgWin)}`} color="#00c853" />
            <SCard label={tr('avgLoss', lang)} value={`-$${fmt(perf.avgLoss)}`} color="#ff1744" />
            <SCard label={tr('bestTrade', lang)} value={`+$${fmt(perf.bestTrade)}`} color="#00c853" />
            <SCard label={tr('worstTrade', lang)} value={`$${fmt(perf.worstTrade)}`} color="#ff1744" />
          </div>

          {/* Cumulative P&L Chart */}
          {cumPnlData.length > 1 && (
            <>
              <div style={styles.sectionTitle}>{tr('cumPnlChart', lang)}</div>
              <div style={styles.miniChart}>
                <svg width="100%" height="80" viewBox={`0 0 ${cumPnlData.length * 40} 80`} preserveAspectRatio="none">
                  {(() => {
                    const vals = cumPnlData.map((d) => d.cum);
                    const minV = Math.min(...vals, 0); const maxV = Math.max(...vals, 0);
                    const range = maxV - minV || 1;
                    const toY = (v: number) => 70 - ((v - minV) / range) * 60;
                    const zeroY = toY(0);
                    const pts = cumPnlData.map((d, i) => `${i * 40 + 20},${toY(d.cum)}`).join(' ');
                    const area = `M20,${toY(cumPnlData[0].cum)} ` + cumPnlData.slice(1).map((d, i) => `L${(i+1)*40+20},${toY(d.cum)}`).join(' ') + ` L${(cumPnlData.length-1)*40+20},${zeroY} L20,${zeroY} Z`;
                    const lastVal = vals[vals.length - 1];
                    return (
                      <>
                        <line x1="0" y1={zeroY} x2={cumPnlData.length*40} y2={zeroY} stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
                        <path d={area} fill={lastVal >= 0 ? '#00c85322' : '#ff174422'} />
                        <polyline points={pts} fill="none" stroke={lastVal >= 0 ? '#00c853' : '#ff1744'} strokeWidth="2" />
                        {cumPnlData.map((d, i) => <circle key={i} cx={i*40+20} cy={toY(d.cum)} r="3" fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />)}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </>
          )}

          {/* Trade Table */}
          <div style={styles.sectionTitle}>{tr('tradeDetails', lang)}</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {[tr('colAsset',lang),tr('colDir',lang),tr('colEntry',lang),tr('colExit',lang),tr('colSL',lang),tr('colTP',lang),tr('colPnl',lang),tr('colPct',lang),tr('colStatus',lang),tr('colAction',lang)].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr style={styles.tr}>
                      <td style={styles.td}>{t.symbol.replace('USDT','')}</td>
                      <td style={{ ...styles.td, color: t.type==='LONG'?'#00c853':'#ff1744', fontWeight:'bold' }}>
                        {t.type==='LONG' ? '🟢 L' : '🔴 S'}
                      </td>
                      <td style={styles.td}>${fmt(t.entryPrice)}</td>
                      <td style={styles.td}>{t.exitPrice ? `$${fmt(t.exitPrice)}` : '—'}</td>
                      <td style={{ ...styles.td, color:'#ff174488' }}>${fmt(t.stopLoss)}</td>
                      <td style={{ ...styles.td, color:'#00c85388' }}>${fmt(t.takeProfit)}</td>
                      <td style={{ ...styles.td, fontWeight:'bold', color: t.pnl===null?'#555':t.pnl>=0?'#00c853':'#ff1744' }}>
                        {t.pnl===null ? tr('inProgress',lang) : `${t.pnl>=0?'+':''}$${fmt(t.pnl)}`}
                      </td>
                      <td style={{ ...styles.td, color: t.pnlPct===null?'#555':t.pnlPct>=0?'#00c853':'#ff1744' }}>
                        {t.pnlPct===null ? '—' : `${t.pnlPct>=0?'+':''}${t.pnlPct}%`}
                      </td>
                      <td style={styles.td}>
                        <span style={{ background: t.result==='WIN'?'#0d3d1f':t.result==='LOSS'?'#3d0d0d':t.result==='OPEN'?'#1a1a2e':'#2a2a1a', color: t.result==='WIN'?'#00c853':t.result==='LOSS'?'#ff1744':t.result==='OPEN'?'#f0b90b':'#888', padding:'2px 7px', borderRadius:4, fontSize:'0.72rem', fontFamily:'monospace' }}>
                          {t.result==='WIN'?tr('statusWin',lang):t.result==='LOSS'?tr('statusLoss',lang):t.result==='OPEN'?tr('statusOpen',lang):tr('statusBreak',lang)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {t.result === 'OPEN' ? (
                          closingId === t.id ? (
                            <span style={{ display:'flex', gap:4, alignItems:'center' }}>
                              <input style={styles.closeInput} type="number" placeholder={tr('exitPricePH',lang)} value={exitInput} onChange={(e)=>setExitInput(e.target.value)} />
                              <button onClick={()=>handleClose(t.id)} style={styles.confirmBtn}>✓</button>
                              <button onClick={()=>setClosingId(null)} style={styles.cancelBtn}>✕</button>
                            </span>
                          ) : (
                            <button onClick={()=>{setClosingId(t.id);setExitInput('');}} style={styles.closeBtn}>{tr('closePos',lang)}</button>
                          )
                        ) : (
                          <button onClick={()=>onDelete(t.id)} style={styles.deleteBtn}>{tr('deleteBtn',lang)}</button>
                        )}
                      </td>
                    </tr>
                    {/* ── Reflection Notes Row ─────────────────────── */}
                    <tr style={{ borderBottom: '1px solid #1a1a2e', background: '#0d0d1a' }}>
                      <td colSpan={10} style={{ padding: '6px 10px 10px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', marginBottom: 4 }}>
                          📓 {isEN ? 'Reflection' : '反思筆記'}
                          <span style={{ color: '#2a2a3e', marginLeft: 6 }}>
                            {isEN ? '(builds good trading habits)' : '（培養良好交易習慣）'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <textarea
                            style={styles.noteInput}
                            value={notes[t.id] ?? t.notes ?? ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder={getPrompt(t.id, isEN)}
                            rows={2}
                          />
                          <button
                            onClick={() => handleSaveNote(t.id)}
                            style={{ ...styles.confirmBtn, padding: '4px 10px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                          >
                            {savedNotes[t.id] ? '✅' : (isEN ? 'Save' : '儲存')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={onClear} style={styles.clearBtn}>{tr('clearAll',lang)}</button>
        </div>
      )}
    </div>
  );
}

function SCard({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ background:'#0f0f1a', borderRadius:8, padding:'10px 12px', border:'1px solid #1a1a2e' }} title={tooltip}>
      <div style={{ fontSize:'0.67rem', color:'#444', fontFamily:'monospace', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:'0.95rem', fontWeight:'bold', fontFamily:'monospace', color: color??'#fff' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: { width:'100%', background:'#1a1a2e', border:'1px solid #2a2a3e', color:'#ccc', padding:'10px 16px', borderRadius:10, cursor:'pointer', fontFamily:'monospace', fontSize:'0.85rem', display:'flex', alignItems:'center', textAlign:'left', gap:8 },
  body: { background:'#13131f', border:'1px solid #2a2a3e', borderTop:'none', borderRadius:'0 0 10px 10px', padding:'16px', display:'flex', flexDirection:'column', gap:14 },
  reflectionBanner: { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0d1a2e', border: '1px solid #29b6f633', borderRadius: 8, padding: '10px 14px' },
  sectionTitle: { fontSize:'0.72rem', color:'#555', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:1 },
  summaryGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:8 },
  miniChart: { background:'#0f0f1a', borderRadius:8, padding:'10px', border:'1px solid #1a1a2e', overflowX:'auto' },
  table: { width:'100%', borderCollapse:'collapse', fontFamily:'monospace', fontSize:'0.78rem', minWidth:600 },
  thead: { background:'#0f0f1a' },
  th: { padding:'8px 10px', color:'#444', fontWeight:'normal', textAlign:'left', borderBottom:'1px solid #1a1a2e', whiteSpace:'nowrap' },
  tr: { borderBottom: 'none' },
  td: { padding:'8px 10px', color:'#aaa', verticalAlign:'middle', whiteSpace:'nowrap' },
  noteInput: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#888', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.74rem', outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.5 },
  closeInput: { background:'#0f0f1a', border:'1px solid #2a2a3e', color:'#fff', padding:'3px 6px', borderRadius:4, fontFamily:'monospace', fontSize:'0.75rem', width:80, outline:'none' },
  closeBtn: { background:'#16213e', border:'1px solid #f0b90b', color:'#f0b90b', padding:'3px 10px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', fontSize:'0.75rem' },
  confirmBtn: { background:'#0d3d1f', border:'1px solid #00c853', color:'#00c853', padding:'3px 8px', borderRadius:4, cursor:'pointer', fontFamily:'monospace' },
  cancelBtn: { background:'#3d0d0d', border:'1px solid #ff1744', color:'#ff1744', padding:'3px 8px', borderRadius:4, cursor:'pointer', fontFamily:'monospace' },
  deleteBtn: { background:'none', border:'none', color:'#333', cursor:'pointer', fontFamily:'monospace', fontSize:'0.85rem' },
  clearBtn: { background:'none', border:'none', color:'#333', fontFamily:'monospace', fontSize:'0.72rem', cursor:'pointer', alignSelf:'flex-start' },
};
