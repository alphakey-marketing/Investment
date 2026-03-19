import React, { useState } from 'react';
import { Interval } from '../types/binance';
import { Lang } from '../i18n';

const SYMBOLS: { value: string; icon: string; labelEN: string; labelZH: string; descEN: string; descZH: string }[] = [
  { value: 'XAUUSDT', icon: '🥇', labelEN: 'Gold',    labelZH: '黃金',     descEN: 'Gold / USD — safe-haven asset, moves on macro news',           descZH: '黃金/美元——避險資產，對宏觀新聞敏感' },
  { value: 'BTCUSDT', icon: '₿',  labelEN: 'Bitcoin', labelZH: '比特幣',   descEN: 'Bitcoin / USD — highest volume crypto, volatile & liquid',    descZH: '比特幣/美元——最大成交量加密貨幣，波動大且流動性高' },
  { value: 'ETHUSDT', icon: 'Ξ',  labelEN: 'Ethereum',labelZH: '以太坊',   descEN: 'Ethereum / USD — second largest crypto, follows BTC trend',   descZH: '以太坊/美元——第二大加密貨幣，走勢跟隨比特幣' },
  { value: 'SOLUSDT', icon: '◎',  labelEN: 'Solana',  labelZH: '索拉納',   descEN: 'Solana / USD — fast L1 blockchain, higher risk/reward',       descZH: '索拉納/美元——快速L1鏈，風險/報酬較高' },
  { value: 'BNBUSDT', icon: '🔶', labelEN: 'BNB',     labelZH: 'BNB',      descEN: 'BNB / USD — Binance exchange token, relatively stable',      descZH: 'BNB/美元——幣安交易所代幣，相對穩定' },
];

const INTERVALS: { label: string; labelEN: string; value: Interval; tip: string; tipEN: string; rec?: boolean }[] = [
  { label: '5分鐘',  labelEN: '5 min',   value: '5m',  tip: '每格5分鐘，適合短線日內交易，訊號多但雜訊也多',          tipEN: 'Each bar = 5 min. Very short-term. Lots of signals, lots of noise — not recommended for beginners.' },
  { label: '15分鐘', labelEN: '15 min',  value: '15m', tip: '每格15分鐘，適合短線交易，雜訊比5分鐘少',              tipEN: 'Each bar = 15 min. Short-term scalping. Less noisy than 5m.' },
  { label: '1小時',  labelEN: '1 Hour',  value: '1h',  tip: '每格1小時，預設推薦，訊號質量與頻率平衡最佳',          tipEN: 'Each bar = 1 hour. Best balance of signal quality and frequency. Recommended for beginners.', rec: true },
  { label: '4小時',  labelEN: '4 Hours', value: '4h',  tip: '每格4小時，適合波段交易，需要較多耐心等待',            tipEN: 'Each bar = 4 hours. Swing trading. Fewer signals, higher quality. Needs patience.' },
  { label: '1日',    labelEN: '1 Day',   value: '1d',  tip: '每格1天，適合長線持有，每個訊號可能持倉數天',          tipEN: 'Each bar = 1 day. Long-term. Each signal may mean holding for days or weeks.' },
];

interface Props {
  symbol: string;
  interval: Interval;
  ma1Period: number;
  ma2Period: number;
  lang: Lang;
  onSymbolChange: (s: string) => void;
  onIntervalChange: (i: Interval) => void;
  onMa1Change: (n: number) => void;
  onMa2Change: (n: number) => void;
}

export default function ControlBar({ symbol, interval, ma1Period, ma2Period, lang,
  onSymbolChange, onIntervalChange, onMa1Change, onMa2Change }: Props) {
  const isEN = lang === 'EN';
  const [showSymbolGuide, setShowSymbolGuide] = useState(false);
  const [showTFGuide, setShowTFGuide]         = useState(false);

  const currentSymbol = SYMBOLS.find((s) => s.value === symbol);
  const currentIV     = INTERVALS.find((iv) => iv.value === interval);

  return (
    <div style={styles.bar}>

      {/* ── Asset ── */}
      <Group
        label={isEN ? 'Asset' : '資產'}
        tip={isEN ? 'Choose which market to analyse' : '選擇要分析的市場'}
        onHelp={() => setShowSymbolGuide(!showSymbolGuide)}
        helpOpen={showSymbolGuide}
      >
        {SYMBOLS.map((s) => (
          <BarBtn key={s.value} active={symbol === s.value} color="#f0b90b"
            onClick={() => onSymbolChange(s.value)}
            tip={isEN ? s.descEN : s.descZH}>
            {s.icon} {isEN ? s.labelEN : s.labelZH}
          </BarBtn>
        ))}
      </Group>

      {/* ── Symbol context guide ── */}
      {showSymbolGuide && currentSymbol && (
        <ContextGuide color="#f0b90b">
          <strong style={{ color: '#f0b90b' }}>{currentSymbol.icon} {isEN ? currentSymbol.labelEN : currentSymbol.labelZH}</strong>{' — '}
          {isEN ? currentSymbol.descEN : currentSymbol.descZH}
          <br />
          <span style={{ color: '#444', fontSize: '0.72rem' }}>
            {isEN
              ? '💡 All assets use the same MA rules. Start with BTC or Gold — they have the most reliable signals.'
              : '💡 所有資產使用相同的 MA 規則。建議從 BTC 或黃金開始——它們的訊號最為可靠。'}
          </span>
        </ContextGuide>
      )}

      {/* ── Timeframe ── */}
      <Group
        label={isEN ? 'Timeframe' : '時間框'}
        tip={isEN ? 'Each bar on the chart represents this time period. 1H is recommended for beginners.' : '圖表每根K線代表的時間段。新手建議1小時。'}
        onHelp={() => setShowTFGuide(!showTFGuide)}
        helpOpen={showTFGuide}
      >
        {INTERVALS.map((iv) => (
          <BarBtn key={iv.value} active={interval === iv.value} color="#29b6f6"
            onClick={() => onIntervalChange(iv.value)}
            tip={isEN ? iv.tipEN : iv.tip}>
            {isEN ? iv.labelEN : iv.label}
            {iv.rec && <span style={{ marginLeft: 4, fontSize: '0.6rem', color: '#f0b90b' }}>★</span>}
          </BarBtn>
        ))}
      </Group>

      {/* ── Timeframe context guide ── */}
      {showTFGuide && currentIV && (
        <ContextGuide color="#29b6f6">
          <strong style={{ color: '#29b6f6' }}>{isEN ? currentIV.labelEN : currentIV.label}</strong>{' — '}
          {isEN ? currentIV.tipEN : currentIV.tip}
          <br />
          <span style={{ color: '#444', fontSize: '0.72rem' }}>
            {isEN
              ? '💡 Longer timeframes = fewer signals but each one is more reliable. Shorter = more action but more false signals.'
              : '💡 時間框越長 = 訊號越少但更可靠。越短 = 信號頻繁但假訊號也多。'}
          </span>
        </ContextGuide>
      )}

      {/* ── MA Settings ── */}
      <Group
        label={isEN ? 'MA Periods' : 'MA 期數'}
        tip={isEN
          ? 'MA1 (short) & MA2 (long) — number of candles used. Default 20/60 recommended.'
          : 'MA1（短線）和 MA2（長線）的計算根數。預設20/60為推薦值。'}
      >
        <div style={styles.maRow}>
          <MaInput label={isEN ? 'Short (MA1)' : '短線 MA1'} value={ma1Period} color="#29b6f6"
            tip={isEN ? `Averages last ${ma1Period} candles — short-term trend` : `計算最近 ${ma1Period} 根K線均值，短期趨勢`}
            onChange={(v) => onMa1Change(v)} />
          <span style={{ color: '#333', fontSize: '1rem', paddingTop: 14 }}>/</span>
          <MaInput label={isEN ? 'Long (MA2)' : '長線 MA2'} value={ma2Period} color="#ab47bc"
            tip={isEN ? `Averages last ${ma2Period} candles — long-term trend` : `計算最近 ${ma2Period} 根K線均值，長期趨勢`}
            onChange={(v) => onMa2Change(v)} />
        </div>
        <span style={{ fontSize: '0.65rem', color: '#2a2a3e', fontFamily: 'monospace' }}>
          {isEN ? '💡 Leave at 20/60 until you understand why you would change them' : '💡 在理解為何需要更改之前，保持 20/60 即可'}
        </span>
      </Group>
    </div>
  );
}

function Group({ label, tip, onHelp, helpOpen, children }: { label: string; tip?: string; onHelp?: () => void; helpOpen?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }} title={tip}>
          {label}{tip ? ' ⓘ' : ''}
        </span>
        {onHelp && (
          <button onClick={onHelp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: helpOpen ? '#f0b90b' : '#333', fontSize: '0.68rem', padding: '0 4px', fontFamily: 'monospace' }}>
            {helpOpen ? '▲ hide' : '▼ what\'s this?'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function ContextGuide({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: color + '0d', border: `1px solid ${color}33`, borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#888', lineHeight: 1.7, fontFamily: 'monospace' }}>
      {children}
    </div>
  );
}

function BarBtn({ active, color, onClick, tip, children }: { active: boolean; color: string; onClick: () => void; tip?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={tip} style={{
      background: active ? color + '22' : '#0f0f1a',
      border: `1px solid ${active ? color : '#2a2a3e'}`,
      color: active ? color : '#666',
      padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
      fontFamily: 'monospace', fontSize: '0.78rem',
      fontWeight: active ? 'bold' : 'normal',
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center',
    }}>{children}</button>
  );
}

function MaInput({ label, value, color, tip, onChange }: { label: string; value: number; color: string; tip?: string; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} title={tip}>
      <span style={{ fontSize: '0.62rem', color, fontFamily: 'monospace' }}>{label}</span>
      <input type="number" value={value} min={5} max={200}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: '#0f0f1a', border: `1px solid ${color}66`, color, padding: '4px 7px',
          borderRadius: 5, fontFamily: 'monospace', fontSize: '0.82rem', width: 58, outline: 'none' }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: { background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 12, padding: '14px 18px',
    display: 'flex', gap: 20, flexWrap: 'wrap', maxWidth: 700, width: '100%', alignItems: 'flex-start' },
  maRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
};
