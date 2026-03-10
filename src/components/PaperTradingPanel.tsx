import React, { useState } from 'react';
import { PaperAccount } from '../types/mode';
import { SignalEvent } from '../types/binance';

interface Props {
  account: PaperAccount;
  signal: SignalEvent | null;
  lastPrice: number | null;
  symbol: string;
  pnl: number;
  pnlPct: number;
  onOpen: (symbol: string, type: 'LONG'|'SHORT', price: number, capital: number, sl: number, tp: number) => void;
  onClose: (exitPrice: number) => void;
  onReset: (balance?: number) => void;
}

export default function PaperTradingPanel({
  account, signal, lastPrice, symbol, pnl, pnlPct,
  onOpen, onClose, onReset
}: Props) {
  const [capitalInput, setCapitalInput] = useState('1000');
  const [manualType, setManualType] = useState<'LONG'|'SHORT'>('LONG');
  const [manualEntry, setManualEntry] = useState('');
  const [manualSL, setManualSL] = useState('');
  const [manualTP, setManualTP] = useState('');
  const [closePrice, setClosePrice] = useState('');
  const [resetInput, setResetInput] = useState('10000');
  const [confirmReset, setConfirmReset] = useState(false);

  const pos = account.openPosition;
  const price = parseFloat(manualEntry) || lastPrice || 0;
  const capital = parseFloat(capitalInput) || 1000;
  const sl = parseFloat(manualSL) || (manualType === 'LONG' ? price * 0.99 : price * 1.01);
  const tp = parseFloat(manualTP) || (manualType === 'LONG' ? price * 1.03 : price * 0.97);
  const unrealisedPnl = pos && lastPrice
    ? pos.type === 'LONG'
      ? (lastPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - lastPrice) * pos.quantity
    : null;

  return (
    <div style={styles.wrapper}>
      {/* Account header */}
      <div style={styles.header}>
        <div style={styles.headerItem}>
          <span style={styles.lbl}>🧸 模擬資金</span>
          <span style={styles.val}>${account.balance.toFixed(2)}</span>
        </div>
        <div style={styles.headerItem}>
          <span style={styles.lbl}>起始資金</span>
          <span style={styles.val}>${account.initialBalance.toFixed(2)}</span>
        </div>
        <div style={styles.headerItem}>
          <span style={styles.lbl}>總盈虧</span>
          <span style={{ ...styles.val, color: pnl >= 0 ? '#00c853' : '#ff1744', fontWeight: 'bold' }}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct}%)
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={styles.notice}>
        🧸 模擬盤模式—所有交易均為號碼，不涉及真實資金。練習K均操作手法。
      </div>

      {!pos ? (
        // ── Open Position Form ──
        <div style={styles.form}>
          <div style={styles.formTitle}>➕ 開倉（模擬）</div>
          {signal && (
            <div style={styles.signalHint}>
              🚦 有即時{signal.type}訊號 @ ${signal.price.toFixed(2)}！可直接按訊號開倉。
            </div>
          )}
          <div style={styles.grid}>
            <Field label="方向">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['LONG','SHORT'] as const).map((t) => (
                  <button key={t} onClick={() => setManualType(t)} style={{
                    ...styles.typeBtn,
                    ...(manualType === t ? (t === 'LONG' ? styles.longOn : styles.shortOn) : {})
                  }}>{t === 'LONG' ? '🟢 做多' : '🔴 做空'}</button>
                ))}
              </div>
            </Field>
            <Field label="投入資金 (USDT)">
              <input style={styles.input} type="number" value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)} placeholder="1000" />
            </Field>
            <Field label={`入場價 (当前${lastPrice?.toFixed(2) ?? '---'})`}>
              <input style={styles.input} type="number" value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)} placeholder="自動用即時價" />
            </Field>
            <Field label="止蝕">
              <input style={styles.input} type="number" value={manualSL}
                onChange={(e) => setManualSL(e.target.value)} placeholder={sl.toFixed(2)} />
            </Field>
            <Field label="止盈">
              <input style={styles.input} type="number" value={manualTP}
                onChange={(e) => setManualTP(e.target.value)} placeholder={tp.toFixed(2)} />
            </Field>
          </div>
          <div style={styles.btnRow}>
            {signal && (
              <button
                onClick={() => onOpen(symbol, signal.type, signal.price, capital,
                  signal.type === 'LONG' ? signal.price * 0.99 : signal.price * 1.01,
                  signal.type === 'LONG' ? signal.price * 1.03 : signal.price * 0.97
                )}
                style={styles.signalBtn}
              >
                {signal.type === 'LONG' ? '🟢' : '🔴'} 按訊號開{signal.type}倉
              </button>
            )}
            <button
              onClick={() => onOpen(symbol, manualType, price, capital, sl, tp)}
              disabled={price <= 0 || capital <= 0 || capital > account.balance}
              style={{ ...styles.openBtn, opacity: price <= 0 ? 0.4 : 1 }}
            >
              手動開倉
            </button>
          </div>
          {capital > account.balance && (
            <div style={{ color: '#ff1744', fontSize: '0.78rem', fontFamily: 'monospace' }}>
              ❌ 資金不足，可用: ${account.balance.toFixed(2)}
            </div>
          )}
        </div>
      ) : (
        // ── Open Position Status ──
        <div style={styles.form}>
          <div style={styles.formTitle}>
            <span style={{ color: pos.type === 'LONG' ? '#00c853' : '#ff1744' }}>
              {pos.type === 'LONG' ? '🟢 已开多倉' : '🔴 已开空倉'}
            </span>
          </div>
          <div style={styles.posGrid}>
            <PosItem label="入場價" value={`$${pos.entryPrice.toFixed(2)}`} />
            <PosItem label="即時價" value={`$${lastPrice?.toFixed(2) ?? '---'}`} />
            <PosItem label="止蝕" value={`$${pos.stopLoss.toFixed(2)}`} color="#ff174488" />
            <PosItem label="止盈" value={`$${pos.takeProfit.toFixed(2)}`} color="#00c85388" />
            <PosItem label="數量" value={pos.quantity.toFixed(6)} />
            <PosItem
              label="浮動盈虧"
              value={unrealisedPnl !== null ? `${unrealisedPnl >= 0 ? '+' : ''}$${unrealisedPnl.toFixed(2)}` : '---'}
              color={unrealisedPnl !== null ? (unrealisedPnl >= 0 ? '#00c853' : '#ff1744') : '#888'}
            />
          </div>
          {/* SL/TP auto-hit check */}
          {lastPrice && lastPrice <= pos.stopLoss && pos.type === 'LONG' && (
            <div style={styles.autoHit}>⚠️ 價格已突破止蝕！建議平倉。</div>
          )}
          {lastPrice && lastPrice >= pos.takeProfit && pos.type === 'LONG' && (
            <div style={{ ...styles.autoHit, color: '#00c853' }}>🎯 價格已達止盈！可考慮平倉。</div>
          )}
          <div style={styles.closeRow}>
            <input style={styles.input} type="number" value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              placeholder={`出場價 (即時: ${lastPrice?.toFixed(2) ?? '---'})`} />
            <button
              onClick={() => onClose(parseFloat(closePrice) || lastPrice || pos.entryPrice)}
              style={styles.closeBtn}
            >
              平倉確認
            </button>
            {lastPrice && (
              <button onClick={() => onClose(lastPrice)} style={styles.mktBtn}>
                市價平倉
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reset */}
      <div style={styles.resetRow}>
        {confirmReset ? (
          <>
            <input style={{ ...styles.input, width: 100 }} type="number" value={resetInput}
              onChange={(e) => setResetInput(e.target.value)} placeholder="10000" />
            <button onClick={() => { onReset(parseFloat(resetInput)); setConfirmReset(false); }} style={styles.confirmResetBtn}>
              確定重置
            </button>
            <button onClick={() => setConfirmReset(false)} style={styles.cancelBtn}>取消</button>
          </>
        ) : (
          <button onClick={() => setConfirmReset(true)} style={styles.resetBtn}>
            🔄 重置模擬資金
          </button>
        )}
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

function PosItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 6, padding: '8px 10px', border: '1px solid #1a1a2e' }}>
      <div style={{ fontSize: '0.67rem', color: '#444', fontFamily: 'monospace' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', fontWeight: 'bold', color: color ?? '#fff', marginTop: 2 }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { background: '#1a1a2e', border: '1px solid #29b6f6', borderRadius: 10, padding: 16, maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
  header: { display: 'flex', gap: 16, flexWrap: 'wrap', background: '#0f0f1a', borderRadius: 8, padding: '10px 14px' },
  headerItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  lbl: { fontSize: '0.67rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase' },
  val: { fontSize: '0.9rem', fontFamily: 'monospace', color: '#ccc' },
  notice: { fontSize: '0.75rem', color: '#29b6f6', fontFamily: 'monospace', background: '#0d2a3e', padding: '6px 10px', borderRadius: 6, border: '1px solid #29b6f630' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle: { fontSize: '0.8rem', color: '#888', fontFamily: 'monospace', fontWeight: 'bold' },
  signalHint: { fontSize: '0.78rem', color: '#f0b90b', fontFamily: 'monospace', background: '#1a1500', padding: '6px 10px', borderRadius: 6 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 },
  posGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 },
  input: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none', width: '100%' },
  typeBtn: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#666', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem' },
  longOn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853' },
  shortOn: { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744' },
  btnRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  signalBtn: { background: '#1a1500', border: '1px solid #f0b90b', color: '#f0b90b', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', flex: 1 },
  openBtn: { background: '#16213e', border: '1px solid #29b6f6', color: '#29b6f6', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', flex: 1 },
  closeRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  closeBtn: { background: '#3d0d0d', border: '1px solid #ff1744', color: '#ff1744', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  mktBtn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  autoHit: { fontSize: '0.78rem', color: '#ff9800', fontFamily: 'monospace', padding: '4px 8px', background: '#2a1800', borderRadius: 4 },
  resetRow: { display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #1a1a2e', paddingTop: 10 },
  resetBtn: { background: 'none', border: 'none', color: '#333', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer' },
  confirmResetBtn: { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' },
  cancelBtn: { background: 'none', border: '1px solid #333', color: '#555', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' },
};
