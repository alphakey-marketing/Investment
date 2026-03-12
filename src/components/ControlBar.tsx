import React, { useState } from 'react';
import { Interval } from '../types/binance';
import { FutuSymbol } from '../types/futu';
import { Lang } from '../i18n';

// ─── Symbol definitions ────────────────────────────────────────────────────────
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
    value: 'HK.MHImain',
    icon: '🇭🇰',
    labelEN: 'Mini HSI',
    labelZH: '恒指期貨(小)',
    descEN: 'Mini Hang Seng Index Futures — HK$10 per point. Lower margin (~HK$22k). Best for retail futures traders.',
    descZH: '小型恒生指數期貨 — 每點HK$10，所需保證金較低（約HK$22,000），最適合散戶入門期貨交易。',
    tag: 'FUTURES',
  },
  {
    value: 'HK.HSImain',
    icon: '📊',
    labelEN: 'Full HSI',
    labelZH: '恒指期貨(大)',
    descEN: 'Full Hang Seng Index Futures — HK$50 per point. Higher margin (~HK$110k). For experienced traders.',
    descZH: '大型恒生指數期貨 — 每點HK$50，保證金較高（約HK$110,000），適合有經驗交易者。',
    tag: 'FUTURES',
  },
  {
    value: 'HK.HHImain',
    icon: '🇨🇳',
    labelEN: 'Mini H-Share',
    labelZH: '國指期貨',
    descEN: 'Mini H-Shares Index Futures (HSCEI) — tracks mainland China stocks listed in HK.',
    descZH: '小型國企指數期貨 — 追蹤在港上市的中國內地企業股票走勢。',
    tag: 'FUTURES',
  },
  {
    value: 'HK.00700',
    icon: '🎮',
    labelEN: 'Tencent',
    labelZH: '騰訊',
    descEN: 'Tencent Holdings (0700.HK) — largest HK-listed tech stock.',
    descZH: '騰訊控股（0700.HK）——港股最大市值科技股。',
  },
  {
    value: 'HK.00005',
    icon: '🏦',
    labelEN: 'HSBC',
    labelZH: '匯豐控股',
    descEN: 'HSBC Holdings (0005.HK) — largest HK blue-chip bank stock.',
    descZH: '匯豐控股（0005.HK）——香港最大藍籌銀行股。',
  },
  {
    value: 'HK.09988',
    icon: '🛒',
    labelEN: 'Alibaba',
    labelZH: '阿里巴巴',
    descEN: 'Alibaba Group (9988.HK) — major China tech / e-commerce.',
    descZH: '阿里巴巴集團（9988.HK）——中國電商及科技巨頭。',
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
  { label: '5分鐘',  labelEN: '5 min',   value: '5m',  tip: '每格5分鐘，適合短線日內交易，訊號多但雜訊也多', tipEN: 'Each bar = 5 min. Short-term scalping. High noise — not recommended for beginners.' },
  { label: '15分鐘', labelEN: '15 min',  value: '15m', tip: '每格15分鐘，適合HSI期貨日內交易，為港股期貨推薦時間框', tipEN: 'Each bar = 15 min. Recommended for intraday HSI futures — good signal/noise balance.', rec: true },
  { label: '1小時',  labelEN: '1 Hour',  value: '1h',  tip: '每格1小時，適合波段操作，每個訊號持倉數小時至一日', tipEN: 'Each bar = 1 hour. Swing trading. Signals last hours to a day.' },
  { label: '4小時',  labelEN: '4 Hours', value: '4h',  tip: '每格4小時，適合短線波段，需較多耐心等待',            tipEN: 'Each bar = 4 hours. Fewer but higher-quality signals. Needs patience.' },
  { label: '1日',    labelEN: '1 Day',   value: '1d',  tip: '每格1天，適合長線持有，每個訊號可能持倉數天',         tipEN: 'Each bar = 1 day. Long-term trend following. Each signal may mean holding for days.' },
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
        label={isEN ? 'HK Futures / Stocks' : 'HK 期貨／股票'}
        tip={isEN ? 'Choose a HK futures contract or stock to analyse' : '選擇港股期貨合約或個股進行分析'}
        onHelp={() => setShowSymbolGuide(!showSymbolGuide)}
        helpOpen={showSymbolGuide}
      >
        {HK_SYMBOLS.map((s) => (
          <BarBtn
            key={s.value}
            active={symbol === s.value}
            color={s.tag === 'FUTURES' ? '#f0b90b' : '#29b6f6'}
            onClick={() => onSymbolChange(s.value)}
            tip={isEN ? s.descEN : s.descZH}
          >
            {s.icon} {isEN ? s.labelEN : s.labelZH}
            {s.tag === 'FUTURES' && (
              <span style={{ marginLeft: 5, fontSize: '0.55rem', background: '#f0b90b33', color: '#f0b90b', borderRadius: 3, padding: '1px 4px' }}>
                FUT
              </span>
            )}
          </BarBtn>
        ))}
      </Group>

      {/* ── Symbol context guide ── */}
      {showSymbolGuide && currentSymbol && (
        <ContextGuide color={currentSymbol.tag === 'FUTURES' ? '#f0b90b' : '#29b6f6'}>
          <strong style={{ color: currentSymbol.tag === 'FUTURES' ? '#f0b90b' : '#29b6f6' }}>
            {currentSymbol.icon} {isEN ? currentSymbol.labelEN : currentSymbol.labelZH}
          </strong>{' — '}
          {isEN ? currentSymbol.descEN : currentSymbol.descZH}
          <br />
          <span style={{ color: '#444', fontSize: '0.72rem' }}>
            {isEN
              ? '💡 Start with Mini HSI (MHI) — lowest margin requirement for futures. Use 15m timeframe for intraday signals.'
              : '💡 建議從小型恒指（MHI）開始——期貨中保證金要求最低。日內交易建議使用15分鐘時間框。'}
          </span>
        </ContextGuide>
      )}

      {/* ── Timeframe ── */}
      <Group
        label={isEN ? 'Timeframe' : '時間框'}
        tip={isEN ? 'Each candle represents this period. 15m recommended for HSI futures intraday.' : '每根K線代表的時間段。HSI期貨日內交易建議15分鐘。'}
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
              ? '💡 For HSI futures: 15m gives best entry timing. Use 1h to confirm trend direction before trading.'
              : '💡 恒指期貨：15分鐘最佳入場時機。交易前先用1小時確認趨勢方向。'}
          </span>
        </ContextGuide>
      )}

      {/* ── MA Settings ── */}
      <Group
        label={isEN ? 'MA Periods' : 'MA 期數'}
        tip={isEN
          ? 'MA1 (short) & MA2 (long). For HSI futures on 15m, try MA10/MA20.'
          : 'MA1（短線）與 MA2（長線）。HSI期貨15分鐘建議試用MA10/MA20。'}
      >
        <div style={styles.maRow}>
          <MaInput
            label={isEN ? 'Short (MA1)' : '短線 MA1'}
            value={ma1Period}
            color="#29b6f6"
            tip={isEN ? `Averages last ${ma1Period} candles — short-term trend` : `計算最近 ${ma1Period} 根K線均值，短期趨勢`}
            onChange={(v) => onMa1Change(v)}
          />
          <span style={{ color: '#333', fontSize: '1rem', paddingTop: 14 }}>/</span>
          <MaInput
            label={isEN ? 'Long (MA2)' : '長線 MA2'}
            value={ma2Period}
            color="#ab47bc"
            tip={isEN ? `Averages last ${ma2Period} candles — long-term trend` : `計算最近 ${ma2Period} 根K線均值，長期趨勢`}
            onChange={(v) => onMa2Change(v)}
          />
        </div>
        <span style={{ fontSize: '0.65rem', color: '#2a2a3e', fontFamily: 'monospace' }}>
          {isEN ? '💡 For HSI futures try MA10/MA20 on 15m charts' : '💡 HSI期貨建議在15分鐘圖試用MA10/MA20'}
        </span>
      </Group>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
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
