import React, { useState, useMemo } from 'react';
import { SignalEvent } from '../types/binance';
import { TradeRecord } from '../types/trade';

interface Props {
  signal: SignalEvent | null;
  lastPrice: number | null;
  onAddTrade: (trade: Omit<TradeRecord, 'id'>) => void;
  symbol: string;
}

export default function PositionCalculator({ signal, lastPrice, onAddTrade, symbol }: Props) {
  const [open, setOpen] = useState(false);
  const [capital, setCapital] = useState('1000');
  const [riskPct, setRiskPct] = useState('2');       // % of capital to risk per trade
  const [customEntry, setCustomEntry] = useState('');
  const [customSL, setCustomSL] = useState('');
  const [customTP, setCustomTP] = useState('');
  const [tradeType, setTradeType] = useState<'LONG' | 'SHORT'>(signal?.type ?? 'LONG');
  const [added, setAdded] = useState(false);

  const entryPrice = parseFloat(customEntry) || signal?.price || lastPrice || 0;
  const capitalNum = parseFloat(capital) || 0;
  const riskPctNum = parseFloat(riskPct) || 2;

  const defaultSL = entryPrice > 0
    ? tradeType === 'LONG' ? entryPrice * 0.99 : entryPrice * 1.01
    : 0;
  const defaultTP = entryPrice > 0
    ? tradeType === 'LONG' ? entryPrice * 1.03 : entryPrice * 0.97
    : 0;

  const sl = parseFloat(customSL) || defaultSL;
  const tp = parseFloat(customTP) || defaultTP;

  const calc = useMemo(() => {
    if (!entryPrice || !sl || !tp || capitalNum <= 0) return null;
    const riskPerUnit = Math.abs(entryPrice - sl);
    const rewardPerUnit = Math.abs(tp - entryPrice);
    const rr = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;
    const riskAmount = capitalNum * (riskPctNum / 100);   // USDT at risk
    const quantity = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
    const positionSize = quantity * entryPrice;           // total USDT position
    const maxLoss = quantity * riskPerUnit;
    const maxGain = quantity * rewardPerUnit;
    return {
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      quantity: parseFloat(quantity.toFixed(6)),
      positionSize: parseFloat(positionSize.toFixed(2)),
      maxLoss: parseFloat(maxLoss.toFixed(2)),
      maxGain: parseFloat(maxGain.toFixed(2)),
      rr: parseFloat(rr.toFixed(2)),
      sl: parseFloat(sl.toFixed(2)),
      tp: parseFloat(tp.toFixed(2)),
    };
  }, [entryPrice, sl, tp, capitalNum, riskPctNum, tradeType]);

  const handleAddTrade = () => {
    if (!calc || !entryPrice) return;
    onAddTrade({
      symbol,
      type: tradeType,
      entryPrice,
      exitPrice: null,
      stopLoss: calc.sl,
      takeProfit: calc.tp,
      capitalUsed: calc.positionSize,
      quantity: calc.quantity,
      result: 'OPEN',
      pnl: null,
      pnlPct: null,
      openTime: Math.floor(Date.now() / 1000),
      closeTime: null,
      notes: signal ? `訊號觸發 @ MA${signal.ma.toFixed(0)}` : '手動入場',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        🧮 倉位計算器 &amp; 風險管理
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>
          {/* Inputs */}
          <div style={styles.grid}>
            <Field label="總資金 (USDT)" tooltip="你用於此幣種嘅總倉位資金">
              <input style={styles.input} type="number" value={capital}
                onChange={(e) => setCapital(e.target.value)} placeholder="1000" />
            </Field>
            <Field label="每次風險 %" tooltip="每次交易願意虧損嘅資金比例，建議1-3%">
              <input style={styles.input} type="number" value={riskPct} min="0.1" max="100" step="0.5"
                onChange={(e) => setRiskPct(e.target.value)} placeholder="2" />
            </Field>
            <Field label="方向">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['LONG', 'SHORT'] as const).map((t) => (
                  <button key={t} onClick={() => setTradeType(t)} style={{
                    ...styles.typeBtn,
                    ...(tradeType === t ? (t === 'LONG' ? styles.longActive : styles.shortActive) : {}),
                  }}>
                    {t === 'LONG' ? '🟢 做多' : '🔴 做空'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="入場價" tooltip="留空則用當前價格">
              <input style={styles.input} type="number" value={customEntry}
                onChange={(e) => setCustomEntry(e.target.value)}
                placeholder={entryPrice > 0 ? entryPrice.toFixed(2) : '自動'} />
            </Field>
            <Field label={`止蝕 (預設 ${tradeType === 'LONG' ? '-1%' : '+1%'})`} tooltip="建議不超過入場價2%">
              <input style={styles.input} type="number" value={customSL}
                onChange={(e) => setCustomSL(e.target.value)}
                placeholder={defaultSL > 0 ? defaultSL.toFixed(2) : '自動'} />
            </Field>
            <Field label={`止盈 (預設 ${tradeType === 'LONG' ? '+3%' : '-3%'})`} tooltip="盈虧比3:1目標">
              <input style={styles.input} type="number" value={customTP}
                onChange={(e) => setCustomTP(e.target.value)}
                placeholder={defaultTP > 0 ? defaultTP.toFixed(2) : '自動'} />
            </Field>
          </div>

          {/* Results */}
          {calc && (
            <>
              <div style={styles.divider} />
              <div style={styles.resultTitle}>📐 計算結果</div>
              <div style={styles.resultGrid}>
                <ResultCard label="投入金額" value={`$${calc.positionSize.toLocaleString()}`} sub="USDT 倉位大小" />
                <ResultCard label="最大虧損" value={`-$${calc.maxLoss}`} color="#ff1744" sub={`佔資金 ${riskPct}%`} />
                <ResultCard label="最大盈利" value={`+$${calc.maxGain}`} color="#00c853" sub={`佔資金 ${((calc.maxGain / capitalNum) * 100).toFixed(1)}%`} />
                <ResultCard label="盈虧比" value={`${calc.rr}:1`} color={calc.rr >= 2 ? '#00c853' : '#ff9800'} sub={calc.rr >= 2 ? '✅ 理想' : '⚠️ 偏低'} />
                <ResultCard label="數量" value={calc.quantity.toString()} sub={`${symbol.replace('USDT', '')} 單位`} />
                <ResultCard label="風險金額" value={`$${calc.riskAmount}`} sub="此單最多虧" />
              </div>

              {/* Visual RR bar */}
              <div style={styles.rrBar}>
                <div style={styles.rrLabel}>
                  <span style={{ color: '#ff1744' }}>虧 -${calc.maxLoss}</span>
                  <span style={{ color: '#888' }}>入場 ${entryPrice.toFixed(2)}</span>
                  <span style={{ color: '#00c853' }}>盈 +${calc.maxGain}</span>
                </div>
                <div style={styles.rrTrack}>
                  <div style={{ ...styles.rrLoss, width: `${(1 / (1 + calc.rr)) * 100}%` }} />
                  <div style={{ ...styles.rrWin, width: `${(calc.rr / (1 + calc.rr)) * 100}%` }} />
                </div>
                <div style={{ ...styles.rrLabel, justifyContent: 'center', marginTop: 4 }}>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>盈虧比視覺化 — 每虧$1 預期賺${calc.rr}</span>
                </div>
              </div>

              <button onClick={handleAddTrade} style={styles.addBtn} disabled={added}>
                {added ? '✅ 已加入交易記錄' : '➕ 加入交易記錄'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace', letterSpacing: 0.5 }}
        title={tooltip}>{label}{tooltip ? ' ℹ️' : ''}</span>
      {children}
    </div>
  );
}

function ResultCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{
      background: '#0f0f1a', borderRadius: 8, padding: '10px 12px',
      border: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</span>
      {sub && <span style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace' }}>{sub}</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: {
    width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e',
    color: '#f0b90b', padding: '10px 16px', borderRadius: 10,
    cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', textAlign: 'left',
  },
  body: {
    background: '#13131f', border: '1px solid #2a2a3e', borderTop: 'none',
    borderRadius: '0 0 10px 10px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 },
  input: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff',
    padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%',
  },
  typeBtn: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#666',
    padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem',
  },
  longActive: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853' },
  shortActive: { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744' },
  divider: { borderTop: '1px solid #1a1a2e' },
  resultTitle: { fontSize: '0.75rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 },
  rrBar: { background: '#0f0f1a', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a1a2e' },
  rrLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: 6 },
  rrTrack: { height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' },
  rrLoss: { background: '#ff1744', height: '100%' },
  rrWin: { background: '#00c853', height: '100%' },
  addBtn: {
    background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b',
    padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '0.82rem', width: '100%',
  },
};
