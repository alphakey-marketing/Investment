import React, { useState } from 'react';
import { PaperAccount } from '../types/mode';
import { SignalEvent } from '../types/binance';
import { Lang, tr } from '../i18n';

interface Props {
  account: PaperAccount;
  signal: SignalEvent | null;
  lastPrice: number | null;
  symbol: string;
  pnl: number;
  pnlPct: number;
  lang: Lang;
  onOpen: (symbol: string, type: 'LONG'|'SHORT', price: number, capital: number, sl: number, tp: number) => void;
  onClose: (exitPrice: number) => void;
  onReset: (balance?: number) => void;
}

export default function PaperTradingPanel({ account, signal, lastPrice, symbol, pnl, pnlPct, lang, onOpen, onClose, onReset }: Props) {
  const [capitalInput, setCapitalInput] = useState('1000');
  const [manualType, setManualType] = useState<'LONG'|'SHORT'>('LONG');
  const [manualEntry, setManualEntry] = useState('');
  const [manualSL, setManualSL] = useState('');
  const [manualTP, setManualTP] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [resetInput, setResetInput] = useState('10000');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  const isEN = lang === 'EN';
  const pos = account.openPosition;
  const price = parseFloat(manualEntry) || lastPrice || 0;
  const capital = parseFloat(capitalInput) || 1000;
  const sl = parseFloat(manualSL) || (manualType === 'LONG' ? price * 0.99 : price * 1.01);
  const tp = parseFloat(manualTP) || (manualType === 'LONG' ? price * 1.03 : price * 0.97);
  const unrealisedPnl = pos && lastPrice
    ? pos.type === 'LONG' ? (lastPrice - pos.entryPrice) * pos.quantity : (pos.entryPrice - lastPrice) * pos.quantity
    : null;

  return (
    <div style={styles.wrapper}>
      {/* Account header */}
      <div style={styles.header}>
        <Item label={tr('paperCapital', lang)} value={`$${account.balance.toFixed(2)}`} />
        <Item label={tr('startCapital', lang)} value={`$${account.initialBalance.toFixed(2)}`} />
        <Item label={tr('totalPnlLabel', lang)}
          value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct >= 0 ? '+' : ''}${pnlPct}%)`}
          color={pnl >= 0 ? '#00c853' : '#ff1744'} bold />
      </div>
      <div style={styles.notice}>{tr('paperNotice', lang)}</div>

      {/* ── Beginner: How-to tip (always visible, collapsible) ── */}
      <div style={styles.howToWrapper}>
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          style={styles.howToToggle}
        >
          <span>💡 {isEN ? 'New to Paper Trading? Read this first' : '第一次模擬交易？先看這裡'}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#888' }}>{showHowTo ? '▲' : '▼'}</span>
        </button>

        {showHowTo && (
          <div style={styles.howToBody}>
            {/* Step-by-step */}
            <div style={styles.howToTitle}>{isEN ? '🧸 How Paper Trading works — 3 easy steps:' : '🧸 模擬交易怎麼玩 — 3個簡單步驟：'}</div>
            <div style={styles.stepsCol}>
              <HowToStep
                num="1"
                color="#f0b90b"
                title={isEN ? 'Go back to Live mode and wait for a signal' : '切換回即時模式等待訊號'}
                desc={isEN
                  ? 'Watch the Signal Panel. When you see a 🟢 BUY or 🔴 SELL signal appear, come back here.'
                  : '觀察訊號面板。當出現 🟢 買入 或 🔴 賣出 訊號時，返回此頁面。'}
              />
              <HowToStep
                num="2"
                color="#29b6f6"
                title={isEN ? 'Click "Open by Signal" — all values auto-fill' : '點擊「依訊號開倉」— 所有數值自動填入'}
                desc={isEN
                  ? 'The yellow button below will appear when a signal is active. It auto-fills entry price, stop loss, and take profit for you. You only need to set how much capital to use.'
                  : '當訊號出現時，下方黃色按鈕會自動出現。它會自動填入入場價、止蝕和止盈，你只需設定投入金額。'}
              />
              <HowToStep
                num="3"
                color="#00c853"
                title={isEN ? 'Watch the trade — close at Stop Loss or Take Profit' : '觀察交易 — 在止蝕或止盈時平倉'}
                desc={isEN
                  ? 'The system will warn you when price hits your stop loss or take profit. Click "Market Close" to end the trade. No real money is involved — this is all practice!'
                  : '當價格觸及止蝕或止盈時，系統會提醒你。點擊「市價平倉」結束交易。全程沒有真實資金——純粹練習！'}
              />
            </div>

            {/* Starter capital tip */}
            <div style={styles.capitalTip}>
              <span style={{ fontSize: '1rem' }}>💰</span>
              <span style={{ fontSize: '0.78rem', color: '#aaa', lineHeight: 1.6 }}>
                {isEN
                  ? <><b style={{ color: '#f0b90b' }}>Beginner tip:</b> Start with <b style={{ color: '#f0b90b' }}>$1,000</b> per trade in the capital field below. This keeps your practice realistic — you"ll feel the wins and losses without it being overwhelming.<br/>Never use more than 10% of your total balance on a single trade.</>
                  : <><b style={{ color: '#f0b90b' }}>新手提示：</b>在下方資金欄位中，建議每次交易輸入 <b style={{ color: '#f0b90b' }}>$1,000</b>。這樣練習更貼近真實，感受盈虧但不會壓力過大。<br/>每次交易不要超過總資金的10%。</>}
              </span>
            </div>

            {/* Signal waiting banner */}
            {!signal && (
              <div style={styles.waitBanner}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#f0b90b', fontWeight: 'bold' }}>
                    {isEN ? 'No signal right now — don\'t rush!' : '目前沒有訊號 — 不要急！'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 3, lineHeight: 1.5 }}>
                    {isEN
                      ? 'Switch to Live mode, open the Signal Panel, and wait for a 🟢 or 🔴 signal. Then come back here and use "Open by Signal" — all values will auto-fill.'
                      : '切換至即時模式，打開訊號面板，等待 🟢 或 🔴 訊號出現。然後回到這裡點擊「依訊號開倉」，所有數值將自動填入。'}
                  </div>
                </div>
              </div>
            )}

            {signal && (
              <div style={{ ...styles.waitBanner, background: '#0d2a0d', borderColor: '#00c85355' }}>
                <span style={{ fontSize: '1.2rem' }}>{signal.type === 'LONG' ? '🟢' : '🔴'}</span>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#00c853', fontWeight: 'bold' }}>
                    {isEN ? `Active ${signal.type} signal at $${signal.price.toFixed(2)}` : `活躍 ${signal.type} 訊號 @ $${signal.price.toFixed(2)}`}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 3 }}>
                    {isEN ? '👇 Scroll down and click the yellow "Open by Signal" button!' : '👇 向下滾動，點擊黃色「依訊號開倉」按鈕！'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!pos ? (
        <div style={styles.form}>
          <div style={styles.formTitle}>{tr('openPos', lang)}</div>
          {signal && <div style={styles.signalHint}>🚦 {tr('signalHint', lang)}</div>}
          <div style={styles.grid}>
            <Field label={tr('direction', lang)}>
              <div style={{ display:'flex', gap:6 }}>
                {(['LONG','SHORT'] as const).map((type) => (
                  <button key={type} onClick={() => setManualType(type)} style={{
                    ...styles.typeBtn,
                    ...(manualType === type ? (type === 'LONG' ? styles.longOn : styles.shortOn) : {})
                  }}>{type === 'LONG' ? tr('long', lang) : tr('short', lang)}</button>
                ))}
              </div>
            </Field>
            <Field label={`${tr('capitalInput', lang)} — ${isEN ? 'try $1,000 to start' : '建議從 $1,000 開始'}`}>
              <input style={styles.input} type="number" value={capitalInput} onChange={(e) => setCapitalInput(e.target.value)} placeholder="1000" />
            </Field>
            <Field label={`${tr('entryPrice', lang)} (${lastPrice?.toFixed(2) ?? '---'})`}>
              <input style={styles.input} type="number" value={manualEntry} onChange={(e) => setManualEntry(e.target.value)} placeholder={tr('autoEntry', lang)} />
            </Field>
            <Field label={tr('stopLoss', lang)}>
              <input style={styles.input} type="number" value={manualSL} onChange={(e) => setManualSL(e.target.value)} placeholder={sl.toFixed(2)} />
            </Field>
            <Field label={tr('takeProfit', lang)}>
              <input style={styles.input} type="number" value={manualTP} onChange={(e) => setManualTP(e.target.value)} placeholder={tp.toFixed(2)} />
            </Field>
          </div>
          <div style={styles.btnRow}>
            {signal && (
              <button onClick={() => onOpen(symbol, signal.type, signal.price, capital,
                signal.type === 'LONG' ? signal.price*0.99 : signal.price*1.01,
                signal.type === 'LONG' ? signal.price*1.03 : signal.price*0.97
              )} style={styles.signalBtn}>
                {signal.type === 'LONG' ? '🟢' : '🔴'} {tr('openBySignal', lang)} {signal.type}
              </button>
            )}
            <button onClick={() => onOpen(symbol, manualType, price, capital, sl, tp)}
              disabled={price <= 0 || capital <= 0 || capital > account.balance}
              style={{ ...styles.openBtn, opacity: price <= 0 ? 0.4 : 1 }}>
              {tr('openManual', lang)}
            </button>
          </div>
          {capital > account.balance && (
            <div style={{ color:'#ff1744', fontSize:'0.78rem', fontFamily:'monospace' }}>
              {tr('insufficientBal', lang)}{account.balance.toFixed(2)}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.form}>
          <div style={styles.formTitle}>
            <span style={{ color: pos.type==='LONG'?'#00c853':'#ff1744' }}>
              {pos.type==='LONG' ? tr('longOpen', lang) : tr('shortOpen', lang)}
            </span>
          </div>
          <div style={styles.posGrid}>
            <PosItem label={tr('entryPrice', lang)} value={`$${pos.entryPrice.toFixed(2)}`} />
            <PosItem label={tr('currentPrice', lang)} value={`$${lastPrice?.toFixed(2) ?? '---'}`} />
            <PosItem label={tr('stopLoss', lang)} value={`$${pos.stopLoss.toFixed(2)}`} color="#ff174488" />
            <PosItem label={tr('takeProfit', lang)} value={`$${pos.takeProfit.toFixed(2)}`} color="#00c85388" />
            <PosItem label={tr('quantity', lang)} value={pos.quantity.toFixed(6)} />
            <PosItem label={tr('unrealisedPnl', lang)}
              value={unrealisedPnl !== null ? `${unrealisedPnl>=0?'+':''}$${unrealisedPnl.toFixed(2)}` : '---'}
              color={unrealisedPnl !== null ? (unrealisedPnl >= 0 ? '#00c853' : '#ff1744') : '#888'} />
          </div>
          {lastPrice && lastPrice <= pos.stopLoss && pos.type === 'LONG' && <div style={styles.warnHit}>{tr('slHitWarn', lang)}</div>}
          {lastPrice && lastPrice >= pos.takeProfit && pos.type === 'LONG' && <div style={{ ...styles.warnHit, color:'#00c853' }}>{tr('tpHitHint', lang)}</div>}
          <div style={styles.closeRow}>
            <input style={styles.input} type="number" value={closePrice} onChange={(e) => setClosePrice(e.target.value)}
              placeholder={`${tr('exitPricePH', lang)} (${lastPrice?.toFixed(2) ?? '---'})`} />
            <button onClick={() => onClose(parseFloat(closePrice) || lastPrice || pos.entryPrice)} style={styles.closeBtn}>{tr('closeConfirm', lang)}</button>
            {lastPrice && <button onClick={() => onClose(lastPrice)} style={styles.mktBtn}>{tr('marketClose', lang)}</button>}
          </div>
        </div>
      )}

      <div style={styles.resetRow}>
        {confirmReset ? (
          <>
            <input style={{ ...styles.input, width:100 }} type="number" value={resetInput} onChange={(e) => setResetInput(e.target.value)} />
            <button onClick={() => { onReset(parseFloat(resetInput)); setConfirmReset(false); }} style={styles.confirmResetBtn}>{tr('confirmReset', lang)}</button>
            <button onClick={() => setConfirmReset(false)} style={styles.cancelBtn}>{tr('cancel', lang)}</button>
          </>
        ) : (
          <button onClick={() => setConfirmReset(true)} style={styles.resetBtn}>{tr('resetPaper', lang)}</button>
        )}
      </div>
    </div>
  );
}

function HowToStep({ num, color, title, desc }: { num: string; color: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ background: color, color: '#000', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 'bold', flexShrink: 0, marginTop: 2 }}>{num}</span>
      <div>
        <div style={{ fontSize: '0.8rem', color, fontWeight: 'bold', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: '0.74rem', color: '#777', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:'0.68rem', color:'#555', fontFamily:'monospace' }}>{label}</span>
      {children}
    </div>
  );
}
function Item({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:'0.67rem', color:'#444', fontFamily:'monospace', textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontSize:'0.9rem', fontFamily:'monospace', color: color??'#ccc', fontWeight: bold?'bold':'normal' }}>{value}</span>
    </div>
  );
}
function PosItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background:'#0f0f1a', borderRadius:6, padding:'8px 10px', border:'1px solid #1a1a2e' }}>
      <div style={{ fontSize:'0.67rem', color:'#444', fontFamily:'monospace' }}>{label}</div>
      <div style={{ fontSize:'0.88rem', fontFamily:'monospace', fontWeight:'bold', color: color??'#fff', marginTop:2 }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { background:'#1a1a2e', border:'1px solid #29b6f6', borderRadius:10, padding:16, maxWidth:700, width:'100%', display:'flex', flexDirection:'column', gap:12 },
  header: { display:'flex', gap:16, flexWrap:'wrap', background:'#0f0f1a', borderRadius:8, padding:'10px 14px' },
  notice: { fontSize:'0.75rem', color:'#29b6f6', fontFamily:'monospace', background:'#0d2a3e', padding:'6px 10px', borderRadius:6, border:'1px solid #29b6f630' },
  howToWrapper: { background: '#0d0d1e', border: '1px solid #2a2a3e', borderRadius: 8, overflow: 'hidden' },
  howToToggle: { width: '100%', background: 'none', border: 'none', color: '#f0b90b', padding: '10px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', textAlign: 'left', gap: 8 },
  howToBody: { padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 },
  howToTitle: { fontSize: '0.8rem', color: '#888', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 2 },
  stepsCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  capitalTip: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#1a1500', border: '1px solid #f0b90b33', borderRadius: 8, padding: '10px 12px' },
  waitBanner: { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#1a1200', border: '1px solid #f0b90b33', borderRadius: 8, padding: '10px 12px' },
  form: { display:'flex', flexDirection:'column', gap:10 },
  formTitle: { fontSize:'0.8rem', color:'#888', fontFamily:'monospace', fontWeight:'bold' },
  signalHint: { fontSize:'0.78rem', color:'#f0b90b', fontFamily:'monospace', background:'#1a1500', padding:'6px 10px', borderRadius:6 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8 },
  posGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:6 },
  input: { background:'#0f0f1a', border:'1px solid #2a2a3e', color:'#fff', padding:'6px 10px', borderRadius:6, fontFamily:'monospace', fontSize:'0.82rem', outline:'none', width:'100%' },
  typeBtn: { background:'#0f0f1a', border:'1px solid #2a2a3e', color:'#666', padding:'5px 12px', borderRadius:6, cursor:'pointer', fontFamily:'monospace', fontSize:'0.78rem' },
  longOn: { background:'#0d3d1f', border:'1px solid #00c853', color:'#00c853' },
  shortOn: { background:'#3d0d0d', border:'1px solid #ff1744', color:'#ff1744' },
  btnRow: { display:'flex', gap:8, flexWrap:'wrap' },
  signalBtn: { background:'#1a1500', border:'1px solid #f0b90b', color:'#f0b90b', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontFamily:'monospace', fontSize:'0.82rem', flex:1 },
  openBtn: { background:'#16213e', border:'1px solid #29b6f6', color:'#29b6f6', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontFamily:'monospace', fontSize:'0.82rem', flex:1 },
  closeRow: { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  closeBtn: { background:'#3d0d0d', border:'1px solid #ff1744', color:'#ff1744', padding:'7px 14px', borderRadius:6, cursor:'pointer', fontFamily:'monospace', fontSize:'0.8rem', whiteSpace:'nowrap' },
  mktBtn: { background:'#0d3d1f', border:'1px solid #00c853', color:'#00c853', padding:'7px 14px', borderRadius:6, cursor:'pointer', fontFamily:'monospace', fontSize:'0.8rem', whiteSpace:'nowrap' },
  warnHit: { fontSize:'0.78rem', color:'#ff9800', fontFamily:'monospace', padding:'4px 8px', background:'#2a1800', borderRadius:4 },
  resetRow: { display:'flex', gap:8, alignItems:'center', borderTop:'1px solid #1a1a2e', paddingTop:10 },
  resetBtn: { background:'none', border:'none', color:'#333', fontFamily:'monospace', fontSize:'0.72rem', cursor:'pointer' },
  confirmResetBtn: { background:'#16213e', border:'1px solid #f0b90b', color:'#f0b90b', padding:'4px 12px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', fontSize:'0.75rem' },
  cancelBtn: { background:'none', border:'1px solid #333', color:'#555', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontFamily:'monospace', fontSize:'0.75rem' },
};
