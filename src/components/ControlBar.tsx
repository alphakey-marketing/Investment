import React, { useState } from 'react';
import { Interval } from '../types/binance';
import { FutuSymbol } from '../types/futu';
import { Lang } from '../i18n';

// ─── Symbol definitions ────────────────────────────────────────────────────
const HK_SYMBOLS: {
  value: FutuSymbol;
  icon: string;
  labelEN: string;
  labelZH: string;
  descEN: string;
  descZH: string;
  tag?: string;
}[] = [
  {
    value: 'HK.03081',
    icon: '🥇',
    labelEN: 'Value Gold ETF',
    labelZH: '黃金ETF (03081)',
    descEN: 'Value Gold ETF — HKEX-listed physical gold ETF priced in HKD. 1 board lot = 100 units. No margin required.',
    descZH: '價値黃金ETF — 在港交所上市的实黃金ETF，以港元計價。每手100個单位，无須保證金。',
    tag: 'ETF',
  },
];

const INTERVALS: {
  label: string;
  labelEN: string;
  value: Interval;
  tip: string;
  tipEN: string;
  rec?: boolean;
}[] = [
  { label: '5分鐘',  labelEN: '5 min',   value: '5m',  tip: '每格5分鐘，適合短線日內交易，訊號多但雜訊也多',         tipEN: 'Each bar = 5 min. Short-term scalping. High noise.' },
  { label: '15分鐘', labelEN: '15 min',  value: '15m', tip: '每格15分鐘，適合日內波段交易',                                 tipEN: 'Each bar = 15 min. Good for intraday swing.' },
  { label: '1小時',  labelEN: '1 Hour',  value: '1h',  tip: '每格1小時，適合ETF波段操作，推薦使用',                         tipEN: 'Each bar = 1 hour. Best for ETF swing trading — recommended.', rec: true },
  { label: '4小時',  labelEN: '4 Hours', value: '4h',  tip: '每格4小時，適合短線波段，訊號較少但質量較高',                   tipEN: 'Each bar = 4 hours. Fewer but higher-quality signals.' },
  { label: '1日',    labelEN: '1 Day',   value: '1d',  tip: '每格1天，適合長線持有，每個訊號可能持倉數天',                     tipEN: 'Each bar = 1 day. Long-term trend following.' },
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

export default function ControlBar({
  symbol, interval, ma1Period, ma2Period, lang,
  onSymbolChange, onIntervalChange, onMa1Change, onMa2Change,
}: Props) {
  const isEN = lang === 'EN';
  const [showSymbolGuide, setShowSymbolGuide] = useState(false);
  const [showTFGuide, setShowTFGuide]         = useState(false);

  const currentSymbol = HK_SYMBOLS.find((s) => s.value === symbol);
  const currentIV     = INTERVALS.find((iv) => iv.value === interval);

  return (
    <div style={styles.bar}>

      {/* ── Asset ── */}
      <Group
        label={isEN ? 'HK ETF' : '港股ETF'}
        tip={isEN ? 'Select an ETF to analyse' : '選擇要分析的ETF'}
        onHelp={() => setShowSymbolGuide(!showSymbolGuide)}
        helpOpen={showSymbolGuide}
      >
        {HK_SYMBOLS.map((s) => (
          <BarBtn
            key={s.value}
            active={symbol === s.value}
            color="#f0b90b"
            onClick={() => onSymbolChange(s.value)}
            tip={isEN ? s.descEN : s.descZH}
          >
            {s.icon} {isEN ? s.labelEN : s.labelZH}
            <span style={{ marginLeft: 5, fontSize: '0.55rem', background: '#f0b90b33', color: '#f0b90b', borderRadius: 3, padding: '1px 4px' }}>
              ETF
            </span>
          </BarBtn>
        ))}
      </Group>

      {/* ── Symbol context guide ── */}
      {showSymbolGuide && currentSymbol && (
        <ContextGuide color="#f0b90b">
          <strong style={{ color: '#f0b90b' }}>
            {currentSymbol.icon} {isEN ? currentSymbol.labelEN : currentSymbol.labelZH}
          </strong>{' — '}
          {isEN ? currentSymbol.descEN : currentSymbol.descZH}
          <br />
          <span style={{ color: '#444', fontSize: '0.72rem' }}>
            {isEN
              ? '💡 Value Gold ETF (03081) tracks physical gold prices in HKD. Suitable for swing trading with 1h or 4h timeframes.'
              : '💡 價値黃金ETF (03081) 追蹤實物黃金價格，以港元計價。適合以1小時扨1日線進行波段交易。'}
          </span>
        </ContextGuide>
      )}

      {/* ── Timeframe ── */}
      <Group
        label={isEN ? 'Timeframe' : '時間框'}
        tip={isEN ? 'Each candle represents this period. 1h recommended for ETF swing trading.' : '每根K線代表的時間段。ETF波段交易建譆1小時。'}
        onHelp={() => setShowTFGuide(!showTFGuide)}
        helpOpen={showTFGuide}
      >
        {INTERVALS.map((iv) => (
          <BarBtn
            key={iv.value}
            active={interval === iv.value}
            color="#29b6f6"
            onClick={() => onIntervalChange(iv.value)}
            tip={isEN ? iv.tipEN : iv.tip}
          >
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
              ? '💡 For Gold ETF: 1h gives the best signal/noise balance. Use 1d to confirm the overall trend before entering.'
              : '💡 黃金ETF：1小時訊護1雜訊比例最佳。入場前先看1日線確認主要趨勢。'}
          </span>
        </ContextGuide>
      )}

      {/* ── MA Settings ── */}
      <Group
        label={isEN ? 'MA Periods' : 'MA 期數'}
        tip={isEN
          ? 'MA1 (short) & MA2 (long). For Gold ETF on 1h, try MA20/MA60.'
          : 'MA1（短線）與 MA2（長線）。黃金ETF 1小時建譆試用 MA20/MA60。'}
      >
        <div style={styles.maRow}>
          <MaInput
            label={isEN ? 'Short (MA1)' : '短線 MA1'}
            value={ma1Period}
            color="#29b6f6"
            tip={isEN ? `Averages last ${ma1Period} candles — short-term trend` : `計算最近 ${ma1Period} 根K線均値，短期趨勢`}
            onChange={(v) => onMa1Change(v)}
          />
          <span style={{ color: '#333', fontSize: '1rem', paddingTop: 14 }}>/</span>
          <MaInput
            label={isEN ? 'Long (MA2)' : '長線 MA2'}
            value={ma2Period}
            color="#ab47bc"
            tip={isEN ? `Averages last ${ma2Period} candles — long-term trend` : `計算最近 ${ma2Period} 根K線均値，長期趨勢`}
            onChange={(v) => onMa2Change(v)}
          />
        </div>
        <span style={{ fontSize: '0.65rem', color: '#2a2a3e', fontFamily: 'monospace' }}>
          {isEN ? '💡 For Gold ETF try MA20/MA60 on 1h charts' : '💡 黃金ETF建譆1小時圖試用MA20/MA60'}
        </span>
      </Group>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function Group({
  label, tip, onHelp, helpOpen, children,
}: {
  label: string; tip?: string; onHelp?: () => void; helpOpen?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}
          title={tip}
        >
          {label}{tip ? ' ⓘ' : ''}
        </span>
        {onHelp && (
          <button
            onClick={onHelp}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: helpOpen ? '#f0b90b' : '#333', fontSize: '0.68rem', padding: '0 4px', fontFamily: 'monospace' }}
          >
            {helpOpen ? '▲ hide' : "\u25bc what's this?"}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function ContextGuide({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{ background: color + '0d', border: `1px solid ${color}33`, borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#888', lineHeight: 1.7, fontFamily: 'monospace' }}
    >
      {children}
    </div>
  );
}

function BarBtn({
  active, color, onClick, tip, children,
}: {
  active: boolean; color: string; onClick: () => void; tip?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={tip}
      style={{
        background: active ? color + '22' : '#0f0f1a',
        border: `1px solid ${active ? color : '#2a2a3e'}`,
        color: active ? color : '#666',
        padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
        fontFamily: 'monospace', fontSize: '0.78rem',
        fontWeight: active ? 'bold' : 'normal',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

function MaInput({
  label, value, color, tip, onChange,
}: {
  label: string; value: number; color: string; tip?: string; onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} title={tip}>
      <span style={{ fontSize: '0.62rem', color, fontFamily: 'monospace' }}>{label}</span>
      <input
        type="number" value={value} min={5} max={200}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: '#0f0f1a', border: `1px solid ${color}66`, color, padding: '4px 7px',
          borderRadius: 5, fontFamily: 'monospace', fontSize: '0.82rem', width: 58, outline: 'none' }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 12, padding: '14px 18px',
    display: 'flex', gap: 20, flexWrap: 'wrap', maxWidth: 700, width: '100%', alignItems: 'flex-start',
  },
  maRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
};
