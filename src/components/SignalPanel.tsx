import React, { useState } from 'react';
import { SignalEvent, MAPoint } from '../types/binance';

interface Props {
  signal: SignalEvent | null;
  ma20: MAPoint[];
  ma60: MAPoint[];
  lastPrice: number | null;
}

// Tooltip component
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#333',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 6,
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          zIndex: 100,
          border: '1px solid #555',
          lineHeight: 1.5,
          maxWidth: 220,
          whiteSpace: 'normal',
          textAlign: 'center',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// Collapsible guide section
function GuideSection() {
  const [open, setOpen] = useState(false);
  return (
    <div style={guideStyles.wrapper}>
      <button onClick={() => setOpen(!open)} style={guideStyles.btn}>
        {open ? '▼' : '▶'} 📖 使用指南 — 點擊看如何使用此App
      </button>
      {open && (
        <div style={guideStyles.body}>
          <div style={guideStyles.section}>
            <div style={guideStyles.sectionTitle}>📊 面板數據說明</div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>現價</span>
              XAUUSDT黃金當前即時市場價格（USDT計於），每10秒自動更新。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>MA20</span>
              近20根K線收盤價平均線（短期趨勢參考）。價在MA20上 = 短期即多頭偏好。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>MA60</span>
              近60根K線平均線（長期趨勢參考）。價在MA60下 = 長期即空頭偏好。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>趨勢</span>
              現價跟MA20比較：多頭 = 價在線上，空頭 = 價在線下。根據《K均交易法》「線上多線下空」原則。
            </div>
          </div>

          <div style={guideStyles.section}>
            <div style={guideStyles.sectionTitle}>🚦 訊號說明</div>
            <div style={guideStyles.item}>
              <span style={{ ...guideStyles.tag, background: '#0d3d1f', color: '#00c853' }}>🟢 LONG入場</span>
              價格在MA20上方，且K線創新高近MA結構→考慮做多（買入）。
            </div>
            <div style={guideStyles.item}>
              <span style={{ ...guideStyles.tag, background: '#3d0d0d', color: '#ff1744' }}>🔴 SHORT入場</span>
              價格在MA60下方，且K線創新低近MA結構→考慮做空（賣出）。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>⏳ 等待中</span>
              現時價格未淡到MA位置，根據K均規則「到位就動，不到位不動」，等待即可。
            </div>
          </div>

          <div style={guideStyles.section}>
            <div style={guideStyles.sectionTitle}>💰 止蝕 / 止盈說明</div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>🛑 止蝕</span>
              建議入場價-1%（LONG）/ +1%（SHORT）止蝕，限制單次賠失。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>🎯 止盈</span>
              建議入場價+3%（LONG）/ -3%（SHORT）止盈，盤虧比3:1。
            </div>
            <div style={guideStyles.item}>
              <span style={guideStyles.tag}>📊盈虧比</span>
              3:1意即止盈是止蝕移動的3倍。即使只是50%勝率，長期也能盈利。
            </div>
          </div>

          <div style={guideStyles.section}>
            <div style={guideStyles.sectionTitle}>⚠️ 重要注意</div>
            <div style={guideStyles.item}>此App僅供參考，非投資建議。正式入場前請自行分析市場情況。</div>
            <div style={guideStyles.item}>訊號基於1小時K線，適合短至中期波段操作。</div>
            <div style={guideStyles.item}>正式操作前，建議先在Binance模擬帳戶（Testnet）練習。</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignalPanel({ signal, ma20, ma60, lastPrice }: Props) {
  const latestMA20 = ma20[ma20.length - 1]?.value ?? null;
  const latestMA60 = ma60[ma60.length - 1]?.value ?? null;

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>📊 XAUUSDT 黃金 K均訊號面板</h2>

      {/* Stats Row with Tooltips */}
      <div style={styles.row}>
        <div style={styles.stat}>
          <Tooltip text="XAUUSDT黃金即時價，每10秒更新">
            <span style={styles.label}>現價 (USDT) ℹ️</span>
          </Tooltip>
          <span style={{ ...styles.value, color: '#f0b90b' }}>
            ${lastPrice?.toFixed(2) ?? '---'}
          </span>
        </div>
        <div style={styles.stat}>
          <Tooltip text="20根K線收盤平均線。短期趨勢指標。價在MA20上=多頭">
            <span style={styles.label}>MA20 ℹ️</span>
          </Tooltip>
          <span style={styles.value}>${latestMA20?.toFixed(2) ?? '---'}</span>
        </div>
        <div style={styles.stat}>
          <Tooltip text="60根K線收盤平均線。長期趨勢指標。價在MA60下=空頭">
            <span style={styles.label}>MA60 ℹ️</span>
          </Tooltip>
          <span style={styles.value}>${latestMA60?.toFixed(2) ?? '---'}</span>
        </div>
        <div style={styles.stat}>
          <Tooltip text="跟據K均規則：價在MA20上=多頭，價在MA20下=空頭">
            <span style={styles.label}>趨勢 ℹ️</span>
          </Tooltip>
          <span style={{
            ...styles.value,
            color: lastPrice && latestMA20
              ? lastPrice > latestMA20 ? '#00c853' : '#ff1744'
              : '#888'
          }}>
            {lastPrice && latestMA20
              ? lastPrice > latestMA20 ? '⬆ 多頭' : '⬇ 空頭'
              : '---'}
          </span>
        </div>
      </div>

      {/* Signal Box */}
      <div style={styles.signalBox}>
        <div style={styles.signalHeader}>🚦 即時訊號</div>
        {signal ? (
          <div style={{
            ...styles.signal,
            background: signal.type === 'LONG' ? '#0d3d1f' : '#3d0d0d',
            borderColor: signal.type === 'LONG' ? '#00c853' : '#ff1744',
          }}>
            <span style={{ fontSize: '1.8rem' }}>
              {signal.type === 'LONG' ? '🟢' : '🔴'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                {signal.type === 'LONG' ? '做多（買入）入場訊號' : '做空（賣出）入場訊號'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ddd', marginTop: 4 }}>
                {signal.message}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Tooltip text="建議价格，跟价破位就將肧部仓位。限制賤失在入場價1%">
                  <span style={styles.badge}>🛑 止蝕: ${(signal.type === 'LONG'
                    ? signal.price * 0.99
                    : signal.price * 1.01).toFixed(2)} ℹ️</span>
                </Tooltip>
                <Tooltip text="建議目標價格，盈利為止蝕移動3倍，達到就可考慮平仓">
                  <span style={styles.badge}>🎯 止盈: ${(signal.type === 'LONG'
                    ? signal.price * 1.03
                    : signal.price * 0.97).toFixed(2)} ℹ️</span>
                </Tooltip>
                <Tooltip text="盈虧比3:1意即盈利為賤失移動3倍。每费0.33第就可主導盈利">
                  <span style={styles.badge}>📊 盈虧比 3:1 ℹ️</span>
                </Tooltip>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.noSignal}>
            <div>⏳ 等待K均訊號中...</div>
            <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 6 }}>
              條件: 價格近MA園 (0.5%內) + 創新高/低結構才觸發。請驼持等待。
            </div>
          </div>
        )}
      </div>

      {/* Guide Section */}
      <GuideSection />

      {/* K均 Rules Footer */}
      <div style={styles.rule}>
        📖 K均三大原則: 「線上多、線下空」 「到位就動、不到位不動」 「盈虧比3:1」
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: '#1a1a2e', borderRadius: 12, padding: '20px 24px', color: '#fff', fontFamily: 'monospace', maxWidth: 700, width: '100%' },
  title: { margin: '0 0 16px', fontSize: '1.1rem', borderBottom: '1px solid #333', paddingBottom: 10 },
  row: { display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' },
  stat: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 },
  label: { fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: '1.05rem', fontWeight: 'bold', color: '#fff' },
  signalHeader: { fontSize: '0.75rem', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  signalBox: { marginBottom: 16 },
  signal: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 8, border: '1px solid' },
  noSignal: { padding: '14px 16px', background: '#16161e', borderRadius: 8, color: '#666', fontSize: '0.9rem', border: '1px solid #222' },
  badge: { background: '#2a2a3e', padding: '3px 8px', borderRadius: 4, fontSize: '0.78rem', cursor: 'help' },
  rule: { fontSize: '0.72rem', color: '#444', borderTop: '1px solid #222', paddingTop: 10, lineHeight: 1.8 },
};

const guideStyles: Record<string, React.CSSProperties> = {
  wrapper: { marginBottom: 16 },
  btn: {
    background: '#16161e',
    border: '1px solid #333',
    color: '#888',
    padding: '8px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    width: '100%',
    textAlign: 'left',
  },
  body: {
    background: '#13131f',
    border: '1px solid #2a2a3e',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionTitle: { fontSize: '0.8rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 4 },
  item: { fontSize: '0.8rem', color: '#aaa', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' },
  tag: {
    background: '#2a2a3e',
    color: '#ccc',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: '0.72rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
