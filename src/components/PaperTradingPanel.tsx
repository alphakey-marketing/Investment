import React, { useState } from 'react';
import { PaperAccount } from '../types/mode';
import { SignalEvent } from '../types/binance';
import { FutuSymbol, CONTRACT_SPECS, ContractSpec } from '../types/futu';
import { Lang, tr } from '../i18n';

interface Props {
  account:  PaperAccount;
  signal:   SignalEvent | null;
  lastPrice: number | null;
  symbol:   string;
  pnl:      number;
  pnlPct:   number;
  lang:     Lang;
  onOpen:   (symbol: string, type: 'LONG'|'SHORT', price: number, capital: number, sl: number, tp: number) => void;
  onClose:  (exitPrice: number) => void;
  onReset:  (balance?: number) => void;
}

export default function PaperTradingPanel({
  account, signal, lastPrice, symbol, pnl, pnlPct, lang,
  onOpen, onClose, onReset,
}: Props) {
  const [contractsInput, setContractsInput] = useState('1');
  const [manualType,     setManualType]     = useState<'LONG'|'SHORT'>('LONG');
  const [manualEntry,    setManualEntry]    = useState('');
  const [manualSL,       setManualSL]       = useState('');
  const [manualTP,       setManualTP]       = useState('');
  const [closePrice,     setClosePrice]     = useState('');
  const [resetInput,     setResetInput]     = useState('500000');  // HK$500k default
  const [confirmReset,   setConfirmReset]   = useState(false);
  const [showHowTo,      setShowHowTo]      = useState(false);

  const isEN  = lang === 'EN';
  const pos   = account.openPosition;
  const price = parseFloat(manualEntry) || lastPrice || 0;
  const numContracts = Math.max(1, parseInt(contractsInput) || 1);

  // Contract spec
  const spec: ContractSpec = CONTRACT_SPECS[symbol as FutuSymbol] ?? {
    multiplier: 1, tickSize: 0.1, currency: 'HKD', marginEstHKD: 0, isFutures: false,
  };
  const isFutures  = spec.isFutures;
  const multiplier = spec.multiplier;

  // SL / TP defaults (tighter for futures)
  const slPct = isFutures ? 0.005 : 0.01;
  const tpPct = isFutures ? 0.015 : 0.03;
  const sl = parseFloat(manualSL) || (manualType === 'LONG' ? price * (1 - slPct) : price * (1 + slPct));
  const tp = parseFloat(manualTP) || (manualType === 'LONG' ? price * (1 + tpPct) : price * (1 - tpPct));

  // Capital = contracts × margin (futures) or contracts × price (stocks)
  const capitalForOpen = isFutures
    ? numContracts * spec.marginEstHKD
    : numContracts * price;

  // Unrealised P&L in HKD
  const unrealisedPnl = pos && lastPrice
    ? isFutures
      ? (pos.type === 'LONG'
          ? (lastPrice - pos.entryPrice) * multiplier * pos.quantity
          : (pos.entryPrice - lastPrice) * multiplier * pos.quantity)
      : (pos.type === 'LONG'
          ? (lastPrice - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - lastPrice) * pos.quantity)
    : null;

  const handleOpenBySignal = () => {
    if (!signal) return;
    const sigSL = signal.type === 'LONG' ? signal.price * (1 - slPct) : signal.price * (1 + slPct);
    const sigTP = signal.type === 'LONG' ? signal.price * (1 + tpPct) : signal.price * (1 - tpPct);
    onOpen(symbol, signal.type, signal.price, capitalForOpen, sigSL, sigTP);
  };

  const handleOpenManual = () => {
    onOpen(symbol, manualType, price, capitalForOpen, sl, tp);
  };

  return (
    <div style={styles.wrapper}>
      {/* ── Account header ── */}
      <div style={styles.header}>
        <Item label={tr('paperCapital', lang)} value={`HK$${account.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Item label={tr('startCapital', lang)} value={`HK$${account.initialBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Item
          label={tr('totalPnlLabel', lang)}
          value={`${pnl >= 0 ? '+' : ''}HK$${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${pnlPct >= 0 ? '+' : ''}${pnlPct}%)`}
          color={pnl >= 0 ? '#00c853' : '#ff1744'} bold
        />
        {isFutures && (
          <Item
            label={isEN ? 'HKD/pt (per contract)' : '每點盈虧(每張)'}
            value={`HK$${multiplier}`}
            color="#f0b90b"
          />
        )}
      </div>

      <div style={styles.notice}>{tr('paperNotice', lang)}</div>

      {/* ── How-to guide ── */}
      <div style={styles.howToWrapper}>
        <button onClick={() => setShowHowTo(!showHowTo)} style={styles.howToToggle}>
          <span>💡 {isEN ? 'New to HK Futures Paper Trading? Read this first' : '第一次做港股期貨模擬？先看這裡'}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#888' }}>{showHowTo ? '▲' : '▼'}</span>
        </button>
        {showHowTo && (
          <div style={styles.howToBody}>
            <div style={styles.howToTitle}>
              {isEN ? '🧸 How HK Futures Paper Trading works — 3 steps:' : '🧸 港股期貨模擬交易 — 3個步驟：'}
            </div>
            <div style={styles.stepsCol}>
              <HowToStep num="1" color="#f0b90b"
                title={isEN ? 'Go to Live mode and wait for a signal' : '切換到即時模式等待訊號'}
                desc={isEN ? 'Watch for a 🟢 LONG or 🔴 SHORT signal on the Signal Panel.' : '觀察訊號面板，等待出現 🟢 做多 或 🔴 做空 訊號。'}
              />
              <HowToStep num="2" color="#29b6f6"
                title={isEN ? 'Set how many contracts, then Open by Signal' : '設定合約數量，然後依訊號開倉'}
                desc={isEN
                  ? `1 MHI contract = HK$${multiplier}/pt. Start with 1 contract. You only need HK$${spec.marginEstHKD.toLocaleString()} margin per contract.`
                  : `1張小恒指合約 = 每點HK$${multiplier}。從1張開始。每張合約保證金約HK$${spec.marginEstHKD.toLocaleString()}。`}
              />
              <HowToStep num="3" color="#00c853"
                title={isEN ? 'Watch unrealised P&L — close at S/L or T/P' : '觀察浮動盈虧 — 在止蝕或止盈時平倉'}
                desc={isEN
                  ? 'The system warns you when price hits stop loss or take profit. Click Market Close to end the trade.'
                  : '價格觸及止蝕或止盈時系統會提醒你。點擊「市價平倉」結束交易。'}
              />
            </div>
            {/* MHI example */}
            <div style={styles.exampleBox}>
              <div style={{ fontSize: '0.78rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 6 }}>
                {isEN ? '📐 MHI Example:' : '📐 小恒指例子：'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: 1.8, fontFamily: 'monospace' }}>
                {isEN ? (
                  <>
                    Entry: <b style={{ color: '#fff' }}>20,000 pts</b> · S/L: <b style={{ color: '#ff5252' }}>19,900</b> · T/P: <b style={{ color: '#69f0ae' }}>20,300</b><br />
                    Risk:  <b style={{ color: '#ff5252' }}>100 pts × HK$10 = HK$1,000/contract</b><br />
                    Reward: <b style={{ color: '#69f0ae' }}>300 pts × HK$10 = HK$3,000/contract (3:1 R:R)</b><br />
                    Margin: <b style={{ color: '#f0b90b' }}>~HK$22,000 locked per contract</b>
                  </>
                ) : (
                  <>
                    入場：<b style={{ color: '#fff' }}>20,000點</b> · 止蝕：<b style={{ color: '#ff5252' }}>19,900</b> · 止盈：<b style={{ color: '#69f0ae' }}>20,300</b><br />
                    風險：<b style={{ color: '#ff5252' }}>100點 × HK$10 = 每張HK$1,000</b><br />
                    回報：<b style={{ color: '#69f0ae' }}>300點 × HK$10 = 每張HK$3,000（3:1風報比）</b><br />
                    保證金：<b style={{ color: '#f0b90b' }}>每張鎖定約HK$22,000</b>
                  </>
                )}
              </div>
            </div>
            {!signal && (
              <div style={styles.waitBanner}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#f0b90b', fontWeight: 'bold' }}>
                    {isEN ? "No signal right now — don't rush!" : '目前沒有訊號 — 不要急！'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 3 }}>
                    {isEN ? 'Switch to Live mode and wait for a signal. Signals only fire during HKEX trading hours.' : '切換到即時模式等待訊號。訊號只在交易時段內出現。'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── No open position: open form ── */}
      {!pos ? (
        <div style={styles.form}>
          <div style={styles.formTitle}>{tr('openPos', lang)}</div>
          {signal && <div style={styles.signalHint}>🚦 {tr('signalHint', lang)}</div>}
          <div style={styles.grid}>
            <Field label={tr('direction', lang)}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['LONG', 'SHORT'] as const).map((type) => (
                  <button key={type} onClick={() => setManualType(type)} style={{
                    ...styles.typeBtn,
                    ...(manualType === type ? (type === 'LONG' ? styles.longOn : styles.shortOn) : {}),
                  }}>
                    {type === 'LONG' ? tr('long', lang) : tr('short', lang)}
                  </button>
                ))}
              </div>
            </Field>

            {/* Contracts input (replaces capital input for futures) */}
            <Field label={isFutures
              ? (isEN ? `Contracts (1 = HK$${multiplier}/pt)` : `合約數 (1張 = 每點HK$${multiplier})`)
              : tr('capitalInput', lang)
            }>
              {isFutures ? (
                <>
                  <input style={styles.input} type="number" value={contractsInput} min="1"
                    onChange={(e) => setContractsInput(e.target.value)} placeholder="1" />
                  <span style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace' }}>
                    {isEN
                      ? `Margin locked: HK$${(numContracts * spec.marginEstHKD).toLocaleString()} · P&L: HK$${numContracts * multiplier}/pt`
                      : `鎖定保證金：HK$${(numContracts * spec.marginEstHKD).toLocaleString()} · 每點盈虧：HK$${numContracts * multiplier}`}
                  </span>
                </>
              ) : (
                <input style={styles.input} type="number" value={contractsInput}
                  onChange={(e) => setContractsInput(e.target.value)} placeholder="100000" />
              )}
            </Field>

            <Field label={isFutures ? (isEN ? 'Entry Level (pts)' : '入場指數點位') : `${tr('entryPrice', lang)} (${lastPrice?.toFixed(2) ?? '---'})`}>
              <input style={styles.input} type="number" value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder={price > 0 ? price.toFixed(isFutures ? 0 : 2) : tr('autoEntry', lang)} />
            </Field>

            <Field label={tr('stopLoss', lang)}>
              <input style={styles.input} type="number" value={manualSL}
                onChange={(e) => setManualSL(e.target.value)}
                placeholder={sl > 0 ? sl.toFixed(isFutures ? 0 : 2) : '---'} />
            </Field>

            <Field label={tr('takeProfit', lang)}>
              <input style={styles.input} type="number" value={manualTP}
                onChange={(e) => setManualTP(e.target.value)}
                placeholder={tp > 0 ? tp.toFixed(isFutures ? 0 : 2) : '---'} />
            </Field>
          </div>

          <div style={styles.btnRow}>
            {signal && (
              <button onClick={handleOpenBySignal} style={styles.signalBtn}>
                {signal.type === 'LONG' ? '🟢' : '🔴'} {tr('openBySignal', lang)} {signal.type}
                {isFutures && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#f0b90b88' }}>{numContracts} {isEN ? 'contracts' : '張'}</span>}
              </button>
            )}
            <button
              onClick={handleOpenManual}
              disabled={price <= 0 || capitalForOpen > account.balance}
              style={{ ...styles.openBtn, opacity: price <= 0 ? 0.4 : 1 }}
            >
              {tr('openManual', lang)}
            </button>
          </div>

          {capitalForOpen > account.balance && (
            <div style={{ color: '#ff1744', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              {tr('insufficientBal', lang)}{account.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          )}
        </div>
      ) : (
        // ── Open position display ──────────────────────────────────────────
        <div style={styles.form}>
          <div style={styles.formTitle}>
            <span style={{ color: pos.type === 'LONG' ? '#00c853' : '#ff1744' }}>
              {pos.type === 'LONG' ? tr('longOpen', lang) : tr('shortOpen', lang)}
            </span>
            {isFutures && (
              <span style={{ color: '#f0b90b', marginLeft: 8, fontSize: '0.75rem' }}>
                {pos.quantity} {isEN ? 'contracts' : '張'} · HK${multiplier * pos.quantity}/pt
              </span>
            )}
          </div>
          <div style={styles.posGrid}>
            <PosItem label={isFutures ? (isEN ? 'Entry Level' : '入場點位') : tr('entryPrice', lang)}
              value={isFutures ? `${pos.entryPrice.toFixed(0)} pts` : `HK$${pos.entryPrice.toFixed(2)}`} />
            <PosItem label={isFutures ? (isEN ? 'Current Level' : '當前點位') : tr('currentPrice', lang)}
              value={lastPrice != null ? (isFutures ? `${lastPrice.toFixed(0)} pts` : `HK$${lastPrice.toFixed(2)}`) : '---'} />
            <PosItem label={tr('stopLoss', lang)}
              value={isFutures ? `${pos.stopLoss.toFixed(0)} pts` : `HK$${pos.stopLoss.toFixed(2)}`}
              color="#ff174488" />
            <PosItem label={tr('takeProfit', lang)}
              value={isFutures ? `${pos.takeProfit.toFixed(0)} pts` : `HK$${pos.takeProfit.toFixed(2)}`}
              color="#00c85388" />
            <PosItem
              label={isFutures ? (isEN ? 'Contracts' : '合約數') : (isEN ? 'Shares' : '股數')}
              value={isFutures ? `${pos.quantity} ${isEN ? 'contracts' : '張'}` : pos.quantity.toLocaleString()}
            />
            <PosItem
              label={tr('unrealisedPnl', lang)}
              value={unrealisedPnl !== null
                ? `${unrealisedPnl >= 0 ? '+' : ''}HK$${unrealisedPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '---'}
              color={unrealisedPnl !== null ? (unrealisedPnl >= 0 ? '#00c853' : '#ff1744') : '#888'}
            />
          </div>

          {isFutures && lastPrice != null && (
            <div style={styles.pplRow}>
              ⚡ {isEN ? '1 pt move = ' : '每移動1點 = '}
              <span style={{ color: '#f0b90b', fontWeight: 'bold', marginLeft: 4 }}>
                HK${multiplier * pos.quantity}
              </span>
              <span style={{ color: '#444', fontSize: '0.72rem', marginLeft: 6 }}>
                ({pos.quantity} {isEN ? 'contracts' : '張'} × HK${multiplier})
              </span>
            </div>
          )}

          {lastPrice && lastPrice <= pos.stopLoss && pos.type === 'LONG' && (
            <div style={styles.warnHit}>{tr('slHitWarn', lang)}</div>
          )}
          {lastPrice && lastPrice >= pos.takeProfit && pos.type === 'LONG' && (
            <div style={{ ...styles.warnHit, color: '#00c853' }}>{tr('tpHitHint', lang)}</div>
          )}
          {lastPrice && lastPrice >= pos.stopLoss && pos.type === 'SHORT' && (
            <div style={styles.warnHit}>{tr('slHitWarn', lang)}</div>
          )}
          {lastPrice && lastPrice <= pos.takeProfit && pos.type === 'SHORT' && (
            <div style={{ ...styles.warnHit, color: '#00c853' }}>{tr('tpHitHint', lang)}</div>
          )}

          <div style={styles.closeRow}>
            <input style={styles.input} type="number" value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              placeholder={`${tr('exitPricePH', lang)} (${lastPrice?.toFixed(isFutures ? 0 : 2) ?? '---'})`} />
            <button
              onClick={() => onClose(parseFloat(closePrice) || lastPrice || pos.entryPrice)}
              style={styles.closeBtn}
            >
              {tr('closeConfirm', lang)}
            </button>
            {lastPrice && (
              <button onClick={() => onClose(lastPrice)} style={styles.mktBtn}>
                {tr('marketClose', lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Reset ── */}
      <div style={styles.resetRow}>
        {confirmReset ? (
          <>
            <span style={{ fontSize: '0.72rem', color: '#555', fontFamily: 'monospace' }}>HK$</span>
            <input style={{ ...styles.input, width: 110 }} type="number" value={resetInput}
              onChange={(e) => setResetInput(e.target.value)} />
            <button onClick={() => { onReset(parseFloat(resetInput)); setConfirmReset(false); }} style={styles.confirmResetBtn}>
              {tr('confirmReset', lang)}
            </button>
            <button onClick={() => setConfirmReset(false)} style={styles.cancelBtn}>
              {tr('cancel', lang)}
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmReset(true)} style={styles.resetBtn}>
            {tr('resetPaper', lang)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.68rem', color: '#555', fontFamily: 'monospace' }}>{label}</span>
      {children}
    </div>
  );
}

function Item({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: color ?? '#ccc', fontWeight: bold ? 'bold' : 'normal' }}>{value}</span>
    </div>
  );
}

function PosItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 6, padding: '8px 10px', border: '1px solid #1a1a2e' }}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', fontWeight: 'bold', color: color ?? '#fff', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper:          { background: '#1a1a2e', border: '1px solid #29b6f6', borderRadius: 10, padding: 16, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  header:           { display: 'flex', gap: 16, flexWrap: 'wrap', background: '#0f0f1a', borderRadius: 8, padding: '10px 14px' },
  notice:           { fontSize: '0.75rem', color: '#29b6f6', fontFamily: 'monospace', background: '#0d2a3e', padding: '6px 10px', borderRadius: 6, border: '1px solid #29b6f630' },
  howToWrapper:     { background: '#0d0d1e', border: '1px solid #2a2a3e', borderRadius: 8, overflow: 'hidden' },
  howToToggle:      { width: '100%', background: 'none', border: 'none', color: '#f0b90b', padding: '10px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', textAlign: 'left', gap: 8 },
  howToBody:        { padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 },
  howToTitle:       { fontSize: '0.8rem', color: '#888', fontWeight: 'bold', fontFamily: 'monospace' },
  stepsCol:         { display: 'flex', flexDirection: 'column', gap: 12 },
  exampleBox:       { background: '#0d1a00', border: '1px solid #f0b90b33', borderRadius: 8, padding: '10px 14px' },
  waitBanner:       { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#1a1200', border: '1px solid #f0b90b33', borderRadius: 8, padding: '10px 12px' },
  form:             { display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle:        { fontSize: '0.8rem', color: '#888', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  signalHint:       { fontSize: '0.78rem', color: '#f0b90b', fontFamily: 'monospace', background: '#1a1500', padding: '6px 10px', borderRadius: 6 },
  grid:             { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 },
  posGrid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 },
  pplRow:           { fontSize: '0.78rem', color: '#888', fontFamily: 'monospace', background: '#0d1a0d', border: '1px solid #f0b90b22', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center' },
  input:            { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  typeBtn:          { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#666', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem' },
  longOn:           { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853' },
  shortOn:          { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744' },
  btnRow:           { display: 'flex', gap: 8, flexWrap: 'wrap' },
  signalBtn:        { background: '#1a1500', border: '1px solid #f0b90b', color: '#f0b90b', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  openBtn:          { background: '#16213e', border: '1px solid #29b6f6', color: '#29b6f6', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', flex: 1 },
  closeRow:         { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  closeBtn:         { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  mktBtn:           { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  warnHit:          { fontSize: '0.78rem', color: '#ff9800', fontFamily: 'monospace', padding: '4px 8px', background: '#2a1800', borderRadius: 4 },
  resetRow:         { display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #1a1a2e', paddingTop: 10 },
  resetBtn:         { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer' },
  confirmResetBtn:  { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' },
  cancelBtn:        { background: 'none', border: '1px solid #333', color: '#555', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' },
};
