/**
 * PositionCalculator.tsx — Sprint 4: HK Futures contract-aware sizing
 *
 * Fix 2: handleAddTrade() now passes multiplier field into TradeRecord.
 * Without this, calcPnl() in useTradeJournal defaults to multiplier=1,
 * making live journal P&L 10× (MHI) or 50× (HSI) too small.
 */
import React, { useState, useMemo } from 'react';
import { SignalEvent } from '../types/binance';
import { TradeRecord } from '../types/trade';
import { HKTicker, CONTRACT_SPECS, ContractSpec } from '../types/hkmarket';
import { Lang, tr } from '../i18n';

interface Props {
  signal:      SignalEvent | null;
  lastPrice:   number | null;
  onAddTrade:  (trade: Omit<TradeRecord, 'id'>) => void;
  symbol:      string;
  lang:        Lang;
}

export default function PositionCalculator({ signal, lastPrice, onAddTrade, symbol, lang }: Props) {
  const [open,        setOpen]        = useState(false);
  const [capital,     setCapital]     = useState('200000');
  const [riskPct,     setRiskPct]     = useState('2');
  const [customEntry, setCustomEntry] = useState('');
  const [customSL,    setCustomSL]    = useState('');
  const [customTP,    setCustomTP]    = useState('');
  const [tradeType,   setTradeType]   = useState<'LONG' | 'SHORT'>(signal?.type ?? 'LONG');
  const [added,       setAdded]       = useState(false);

  const isEN = lang === 'EN';

  const spec: ContractSpec = CONTRACT_SPECS[symbol as HKTicker] ?? {
    multiplier: 1, tickSize: 0.1, currency: 'HKD', marginEstHKD: 0, isFutures: false,
  };
  const isFutures  = spec.isFutures;
  const multiplier = spec.multiplier;

  const entryPrice = parseFloat(customEntry) || signal?.price || lastPrice || 0;
  const capitalNum = parseFloat(capital) || 0;
  const riskPctNum = parseFloat(riskPct)  || 2;

  const slPct = isFutures ? 0.005 : 0.01;
  const tpPct = isFutures ? 0.015 : 0.03;
  const defaultSL = entryPrice > 0 ? (tradeType === 'LONG' ? entryPrice * (1 - slPct) : entryPrice * (1 + slPct)) : 0;
  const defaultTP = entryPrice > 0 ? (tradeType === 'LONG' ? entryPrice * (1 + tpPct) : entryPrice * (1 - tpPct)) : 0;
  const sl = parseFloat(customSL) || defaultSL;
  const tp = parseFloat(customTP) || defaultTP;

  const calc = useMemo(() => {
    if (!entryPrice || !sl || !tp || capitalNum <= 0) return null;

    const riskPerUnit   = Math.abs(entryPrice - sl);
    const rewardPerUnit = Math.abs(tp - entryPrice);
    const rr            = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;
    const riskAmount    = capitalNum * (riskPctNum / 100);

    if (isFutures) {
      const riskPerContract = riskPerUnit * multiplier;
      const contracts       = riskPerContract > 0 ? Math.max(1, Math.floor(riskAmount / riskPerContract)) : 0;
      const notional        = contracts * entryPrice * multiplier;
      const maxLoss         = contracts * riskPerUnit  * multiplier;
      const maxGain         = contracts * rewardPerUnit * multiplier;
      const marginRequired  = contracts * spec.marginEstHKD;
      const maxContracts    = riskPerContract > 0 ? Math.floor(capitalNum / riskPerContract) : 0;
      return {
        contracts, maxContracts,
        notional:        Math.round(notional),
        maxLoss:         Math.round(maxLoss),
        maxGain:         Math.round(maxGain),
        rr:              parseFloat(rr.toFixed(2)),
        marginRequired:  Math.round(marginRequired),
        riskAmount:      Math.round(riskAmount),
        riskPerContract: Math.round(riskPerContract),
        sl: parseFloat(sl.toFixed(0)),
        tp: parseFloat(tp.toFixed(0)),
        isFutures: true as const,
      };
    } else {
      const shares       = riskPerUnit > 0 ? Math.floor(riskAmount / riskPerUnit) : 0;
      const positionSize = shares * entryPrice;
      const maxLoss      = shares * riskPerUnit;
      const maxGain      = shares * rewardPerUnit;
      return {
        contracts:       shares,
        maxContracts:    Math.floor(capitalNum / entryPrice),
        notional:        parseFloat(positionSize.toFixed(2)),
        maxLoss:         parseFloat(maxLoss.toFixed(2)),
        maxGain:         parseFloat(maxGain.toFixed(2)),
        rr:              parseFloat(rr.toFixed(2)),
        marginRequired:  0,
        riskAmount:      parseFloat(riskAmount.toFixed(2)),
        riskPerContract: parseFloat(riskPerUnit.toFixed(2)),
        sl: parseFloat(sl.toFixed(2)),
        tp: parseFloat(tp.toFixed(2)),
        isFutures: false as const,
      };
    }
  }, [entryPrice, sl, tp, capitalNum, riskPctNum, tradeType, isFutures, multiplier]);

  // Fix 2: multiplier is now written into the TradeRecord so calcPnl() in
  // useTradeJournal uses futures-correct P&L: ptDiff × multiplier × quantity.
  const handleAddTrade = () => {
    if (!calc || !entryPrice) return;
    onAddTrade({
      symbol,
      type:        tradeType,
      entryPrice,
      exitPrice:   null,
      stopLoss:    calc.sl,
      takeProfit:  calc.tp,
      capitalUsed: calc.notional,
      quantity:    calc.contracts,
      multiplier,                  // ← Fix 2: was missing, caused 10×/50× wrong P&L
      result:      'OPEN',
      pnl:         null,
      pnlPct:      null,
      openTime:    Math.floor(Date.now() / 1000),
      closeTime:   null,
      notes: signal
        ? `Signal @ MA${signal.ma.toFixed(0)} · ${isFutures
            ? `${calc.contracts} contracts × HK$${multiplier}/pt`
            : `${calc.contracts} shares`}`
        : `Manual entry · ${isFutures ? `${calc.contracts} contracts × HK$${multiplier}/pt` : `${calc.contracts} shares`}`,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const slLabel = tr('stopLoss', lang) + (tradeType === 'LONG' ? ` (預設 -${(slPct*100).toFixed(1)}%)` : ` (預設 +${(slPct*100).toFixed(1)}%)`);
  const tpLabel = tr('takeProfit', lang) + (tradeType === 'LONG' ? ` (預設 +${(tpPct*100).toFixed(1)}%)` : ` (預設 -${(tpPct*100).toFixed(1)}%)`);

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        {tr('calcTitle', lang)}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {isFutures && (
            <div style={styles.specBanner}>
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#f0b90b', fontWeight: 'bold' }}>
                  {isEN ? 'Contract Specification:' : '合約規格：'} {symbol}
                </span>
                <div style={styles.specGrid}>
                  <SpecChip icon="💵" label={isEN ? 'HKD per point' : '每點金額'} value={`HK$${multiplier}`} desc={isEN ? `1 contract moves HK$${multiplier} per index point` : `每張合約每點移動HK$${multiplier}`} />
                  <SpecChip icon="🔒" label={isEN ? 'Est. Margin / contract' : '每張保證金(估)'} value={`HK$${spec.marginEstHKD.toLocaleString()}`} desc={isEN ? 'Required margin per contract (approx)' : '每張合約所需保證金（估算）'} />
                  <SpecChip icon="📏" label={isEN ? 'Tick size' : '最小波動'} value={`${spec.tickSize} pt = HK$${spec.tickSize * multiplier}`} desc={isEN ? 'Minimum price movement' : '最小價格變動'} />
                  <SpecChip icon="⚡" label={isEN ? 'Leverage' : '槓桿'} value={entryPrice > 0 ? `~${Math.round((entryPrice * multiplier) / spec.marginEstHKD)}×` : '---'} desc={isEN ? 'Approx leverage at current level' : '當前水平的估算槓桿倍數'} />
                </div>
                <div style={styles.futuresTip}>
                  {isEN
                    ? '⚠️ Futures are leveraged. A 1% market move = ~10×+ P&L impact. Always use stop-loss orders.'
                    : '⚠️ 期貨有槓桿。市場1%波動 = 約10倍以上盈虧影響。交易時必須設定止蝕單。'}
                </div>
              </div>
            </div>
          )}

          {!isFutures && (
            <div style={styles.starterTip}>
              <span style={{ fontSize: '1.1rem' }}>🌱</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.8rem', color: '#f0b90b', fontWeight: 'bold' }}>
                  {isEN ? 'Recommended settings:' : '建議設定：'}
                </span>
                <div style={styles.tipGrid}>
                  <TipChip icon="💰" label={isEN ? 'Capital' : '資本'} value="HK$100,000" desc={isEN ? 'Typical HK stock lot size sizing' : '港股典型手數規模'} />
                  <TipChip icon="⚠️" label={isEN ? 'Risk %' : '風險 %'} value="2%" desc={isEN ? 'Risk 2% per trade' : '每次交易風險2%'} />
                  <TipChip icon="🛑" label={isEN ? 'Stop Loss' : '止蝕'} value="1%" desc={isEN ? 'Exit if 1% against you' : '逆向1%時止蝕'} />
                  <TipChip icon="🎯" label={isEN ? 'Take Profit' : '止盈'} value={isEN ? '3% (3:1 R:R)' : '3%（3:1 風報比）'} desc={isEN ? 'Target 3× your risk' : '目標風險的3倍'} />
                </div>
              </div>
            </div>
          )}

          <div style={styles.grid}>
            <Field label={`${tr('totalCapital', lang)}`} tooltip={tr('totalCapTip', lang)}>
              <input style={styles.input} type="number" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder={isFutures ? '200000' : '100000'} />
              <span style={styles.fieldHint}>
                {isFutures
                  ? (isEN ? `💡 Your total trading capital in HKD. Est. margin per contract: HK$${spec.marginEstHKD.toLocaleString()}` : `💡 您的HKD總交易資金。每張合約估算保證金：HK$${spec.marginEstHKD.toLocaleString()}`)
                  : (isEN ? '💡 Total capital in HKD for this trade' : '💡 此次交易的港幣總資金')}
              </span>
            </Field>
            <Field label={tr('riskPct', lang)} tooltip={tr('riskPctTip', lang)}>
              <input style={styles.input} type="number" value={riskPct} min="0.1" max="100" step="0.5" onChange={(e) => setRiskPct(e.target.value)} placeholder="2" />
              <span style={styles.fieldHint}>
                {isEN
                  ? `💡 2% of HK$${Number(capital).toLocaleString()} = HK$${Math.round(Number(capital) * 0.02).toLocaleString()} at risk`
                  : `💡 總資金HK$${Number(capital).toLocaleString()}的2% = HK$${Math.round(Number(capital) * 0.02).toLocaleString()}風險金額`}
              </span>
            </Field>
            <Field label={tr('direction', lang)}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['LONG', 'SHORT'] as const).map((type) => (
                  <button key={type} onClick={() => setTradeType(type)} style={{ ...styles.typeBtn, ...(tradeType === type ? (type === 'LONG' ? styles.longActive : styles.shortActive) : {}) }}>
                    {type === 'LONG' ? tr('long', lang) : tr('short', lang)}
                  </button>
                ))}
              </div>
              <span style={styles.fieldHint}>
                {isFutures
                  ? (isEN ? 'Futures: Long = buy index rises, Short = sell index falls' : '期貨：做多 = 買漲，做空 = 賣跌')
                  : (isEN ? 'Match the signal direction above' : '請與上方訊號方向一致')}
              </span>
            </Field>
            <Field label={isFutures ? (isEN ? 'Entry Level (index pts)' : '入場指數點位') : tr('entryPrice', lang)} tooltip={tr('entryTip', lang)}>
              <input style={styles.input} type="number" value={customEntry} onChange={(e) => setCustomEntry(e.target.value)} placeholder={entryPrice > 0 ? entryPrice.toFixed(isFutures ? 0 : 2) : tr('autoPrice', lang)} />
            </Field>
            <Field label={slLabel} tooltip={tr('slTip', lang)}>
              <input style={styles.input} type="number" value={customSL} onChange={(e) => setCustomSL(e.target.value)} placeholder={defaultSL > 0 ? defaultSL.toFixed(isFutures ? 0 : 2) : tr('autoPrice', lang)} />
            </Field>
            <Field label={tpLabel} tooltip={tr('tpTip', lang)}>
              <input style={styles.input} type="number" value={customTP} onChange={(e) => setCustomTP(e.target.value)} placeholder={defaultTP > 0 ? defaultTP.toFixed(isFutures ? 0 : 2) : tr('autoPrice', lang)} />
            </Field>
          </div>

          {calc && (
            <>
              <div style={styles.divider} />
              <div style={styles.resultTitle}>{tr('calcResults', lang)}</div>

              {calc.isFutures ? (
                <>
                  <div style={styles.contractsHero}>
                    <div style={styles.contractsNum}>{calc.contracts}</div>
                    <div style={styles.contractsSub}>
                      <span style={{ color: '#f0b90b', fontWeight: 'bold' }}>{isEN ? 'contracts recommended' : '張合約（建議）'}</span>
                      <span style={{ color: '#555', fontSize: '0.72rem' }}>{isEN ? `(max ${calc.maxContracts} within 2% risk)` : `（2%風險內最多 ${calc.maxContracts} 張）`}</span>
                    </div>
                  </div>
                  <div style={styles.resultGrid}>
                    <ResultCard label={isEN ? 'Notional Value' : '名義價值'} value={`HK$${calc.notional.toLocaleString()}`} sub={isEN ? `${calc.contracts} × ${entryPrice.toFixed(0)} × HK$${multiplier}/pt` : `${calc.contracts}張 × ${entryPrice.toFixed(0)} × HK$${multiplier}/點`} />
                    <ResultCard label={isEN ? 'Margin Required' : '所需保證金'} value={`HK$${calc.marginRequired.toLocaleString()}`} sub={isEN ? `${calc.contracts} × HK$${spec.marginEstHKD.toLocaleString()}/contract` : `${calc.contracts}張 × HK$${spec.marginEstHKD.toLocaleString()}/張`} color="#f0b90b" />
                    <ResultCard label={tr('maxLoss', lang)} value={`-HK$${calc.maxLoss.toLocaleString()}`} color="#ff1744" sub={isEN ? `${Math.abs(entryPrice - calc.sl).toFixed(0)} pts × HK$${multiplier} × ${calc.contracts} contracts` : `${Math.abs(entryPrice - calc.sl).toFixed(0)}點 × HK$${multiplier} × ${calc.contracts}張`} />
                    <ResultCard label={tr('maxGain', lang)} value={`+HK$${calc.maxGain.toLocaleString()}`} color="#00c853" sub={isEN ? `${Math.abs(calc.tp - entryPrice).toFixed(0)} pts × HK$${multiplier} × ${calc.contracts} contracts` : `${Math.abs(calc.tp - entryPrice).toFixed(0)}點 × HK$${multiplier} × ${calc.contracts}張`} />
                    <ResultCard label={tr('rrRatio', lang)} value={`${calc.rr}:1`} color={calc.rr >= 2 ? '#00c853' : '#ff9800'} sub={calc.rr >= 2 ? tr('rrIdeal', lang) : tr('rrLow', lang)} />
                    <ResultCard label={isEN ? 'Risk per Contract' : '每張風險'} value={`HK$${calc.riskPerContract.toLocaleString()}`} sub={isEN ? `${Math.abs(entryPrice - calc.sl).toFixed(0)} pts × HK$${multiplier}` : `${Math.abs(entryPrice - calc.sl).toFixed(0)}點 × HK$${multiplier}`} />
                  </div>
                  <div style={styles.pplBox}>
                    <span style={{ fontSize: '1rem' }}>⚡</span>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      <span style={{ color: '#888' }}>{isEN ? '1 index point move = ' : '指數每移動1點 = '}</span>
                      <span style={{ color: '#f0b90b', fontWeight: 'bold' }}>{isEN ? `HK$${multiplier * calc.contracts} P&L` : `HK$${multiplier * calc.contracts} 盈虧`}</span>
                      <span style={{ color: '#444', fontSize: '0.72rem', marginLeft: 8 }}>({calc.contracts} {isEN ? 'contracts' : '張'} × HK${multiplier}/pt)</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.resultGrid}>
                  <ResultCard label={isEN ? 'Position Size' : '倉位大小'} value={`HK$${calc.notional.toLocaleString()}`} sub={isEN ? 'HKD position size' : 'HKD倉位大小'} />
                  <ResultCard label={tr('maxLoss', lang)} value={`-HK$${calc.maxLoss}`} color="#ff1744" sub={`${tr('capitalPct', lang)} ${riskPct}%`} />
                  <ResultCard label={tr('maxGain', lang)} value={`+HK$${calc.maxGain}`} color="#00c853" sub={`${tr('capitalPct', lang)} ${((calc.maxGain / capitalNum) * 100).toFixed(1)}%`} />
                  <ResultCard label={tr('rrRatio', lang)} value={`${calc.rr}:1`} color={calc.rr >= 2 ? '#00c853' : '#ff9800'} sub={calc.rr >= 2 ? tr('rrIdeal', lang) : tr('rrLow', lang)} />
                  <ResultCard label={isEN ? 'Shares' : '股數'} value={calc.contracts.toLocaleString()} sub={`${symbol} shares`} />
                  <ResultCard label={tr('riskAmt', lang)} value={`HK$${calc.riskAmount}`} sub={tr('maxRiskSub', lang)} />
                </div>
              )}

              <div style={styles.rrBar}>
                <div style={styles.rrLabel}>
                  <span style={{ color: '#ff1744' }}>-HK${calc.maxLoss.toLocaleString()}</span>
                  <span style={{ color: '#888' }}>@ {entryPrice.toFixed(isFutures ? 0 : 2)}</span>
                  <span style={{ color: '#00c853' }}>+HK${calc.maxGain.toLocaleString()}</span>
                </div>
                <div style={styles.rrTrack}>
                  <div style={{ ...styles.rrLoss, width: `${(1 / (1 + calc.rr)) * 100}%` }} />
                  <div style={{ ...styles.rrWin,  width: `${(calc.rr / (1 + calc.rr)) * 100}%` }} />
                </div>
                <div style={{ ...styles.rrLabel, justifyContent: 'center', marginTop: 4 }}>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>{tr('rrVisual', lang)} — {tr('rrVisualSub', lang)}{calc.rr}</span>
                </div>
              </div>

              <button onClick={handleAddTrade} style={styles.addBtn} disabled={added}>
                {added ? tr('addedToJournal', lang) : tr('addToJournal', lang)}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SpecChip({ icon, label, value, desc }: { icon: string; label: string; value: string; desc: string }) {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #f0b90b22', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: '0.72rem', color: '#888', fontFamily: 'monospace', marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: '0.82rem', color: '#f0b90b', fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}
function TipChip({ icon, label, value, desc }: { icon: string; label: string; value: string; desc: string }) {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #f0b90b22', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: '0.72rem', color: '#888', fontFamily: 'monospace', marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: '0.82rem', color: '#f0b90b', fontWeight: 'bold', fontFamily: 'monospace' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}
function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'monospace', letterSpacing: 0.5 }} title={tooltip}>
        {label}{tooltip ? ' ℹ️' : ''}
      </span>
      {children}
    </div>
  );
}
function ResultCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace', color: color ?? '#fff' }}>{value}</span>
      {sub && <span style={{ fontSize: '0.64rem', color: '#444', fontFamily: 'monospace', lineHeight: 1.4 }}>{sub}</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper:        { maxWidth: 700, width: '100%' },
  toggleBtn:      { width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e', color: '#f0b90b', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem', display: 'flex', alignItems: 'center', textAlign: 'left' },
  body:           { background: '#13131f', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  specBanner:     { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#1a1500', border: '1px solid #f0b90b33', borderRadius: 10, padding: '12px 14px' },
  specGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 4 },
  futuresTip:     { fontSize: '0.74rem', color: '#886600', fontFamily: 'monospace', background: '#0f0a00', border: '1px solid #f0b90b22', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6, marginTop: 4 },
  starterTip:     { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#1a1500', border: '1px solid #f0b90b33', borderRadius: 10, padding: '12px 14px' },
  tipGrid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 4 },
  fieldHint:      { fontSize: '0.65rem', color: '#3a3a2a', fontFamily: 'monospace', lineHeight: 1.4 },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 },
  input:          { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  typeBtn:        { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#666', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem' },
  longActive:     { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853' },
  shortActive:    { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744' },
  divider:        { borderTop: '1px solid #1a1a2e' },
  resultTitle:    { fontSize: '0.75rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 },
  contractsHero:  { display: 'flex', alignItems: 'center', gap: 12, background: '#0f0f1a', border: '1px solid #f0b90b44', borderRadius: 10, padding: '12px 16px' },
  contractsNum:   { fontSize: '3rem', fontWeight: 'bold', color: '#f0b90b', fontFamily: 'monospace', lineHeight: 1 },
  contractsSub:   { display: 'flex', flexDirection: 'column', gap: 4 },
  resultGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 },
  pplBox:         { display: 'flex', gap: 10, alignItems: 'center', background: '#0d1a0d', border: '1px solid #f0b90b22', borderRadius: 8, padding: '10px 14px' },
  rrBar:          { background: '#0f0f1a', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a1a2e' },
  rrLabel:        { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: 6 },
  rrTrack:        { height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' },
  rrLoss:         { background: '#ff1744', height: '100%' },
  rrWin:          { background: '#00c853', height: '100%' },
  addBtn:         { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', width: '100%' },
};
