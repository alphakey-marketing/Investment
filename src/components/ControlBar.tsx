import React from 'react';
import { Interval } from '../types/binance';
import { Lang } from '../i18n';

const SYMBOLS = ['XAUUSDT', 'BTCUSDT', 'ETHUSDT'];
const INTERVALS: { label: string; labelEN: string; value: Interval; tip: string; tipEN: string }[] = [
  { label: '15分鐘', labelEN: '15 min', value: '15m', tip: '每格代表15分鐘，適合短線', tipEN: 'Each bar = 15 min. Short-term.' },
  { label: '1小時', labelEN: '1 Hour', value: '1h', tip: '每格代表1小時，預設推薦', tipEN: 'Each bar = 1 hour. Recommended.' },
  { label: '4小時', labelEN: '4 Hours', value: '4h', tip: '每格代表4小時，適合波段', tipEN: 'Each bar = 4 hours. Swing trading.' },
  { label: '1日', labelEN: '1 Day', value: '1d', tip: '每格代表1天，適合長線', tipEN: 'Each bar = 1 day. Long-term.' },
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
  return (
    <div style={styles.bar}>

      {/* Asset */}
      <Group label={isEN ? 'Asset' : '資產'} tip={isEN ? 'Choose which market to analyse' : '選擇要分析的市場'}>
        {SYMBOLS.map((s) => (
          <BarBtn key={s} active={symbol === s} color="#f0b90b" onClick={() => onSymbolChange(s)}>
            {s === 'XAUUSDT' ? '💥 ' + (isEN ? 'Gold' : '黃金')
              : s === 'BTCUSDT' ? '₿ BTC'
              : 'Ξ ETH'}
          </BarBtn>
        ))}
      </Group>

      {/* Interval */}
      <Group label={isEN ? 'Timeframe' : '時間框'} tip={isEN ? 'Each bar on the chart represents this time period. 1H is recommended for beginners.' : '圖表每根K線代表的時間段。新手建議使用1小時。'}>
        {INTERVALS.map((iv) => (
          <BarBtn key={iv.value} active={interval === iv.value} color="#29b6f6" onClick={() => onIntervalChange(iv.value)}
            tip={isEN ? iv.tipEN : iv.tip}>
            {isEN ? iv.labelEN : iv.label}
            {iv.value === '1h' && <span style={{ marginLeft: 4, fontSize: '0.6rem', color: '#f0b90b' }}>{isEN ? '★' : '★推薦'}</span>}
          </BarBtn>
        ))}
      </Group>

      {/* MA Settings */}
      <Group label={isEN ? 'MA Periods' : 'MA 期數'} tip={isEN
        ? 'MA1 (short) & MA2 (long) — the number of candles used to calculate each average line. Default 20/60 is recommended.'
        : 'MA1（短線）和 MA2（長線）的計算根數。預設20/60為推薦值。'}>
        <div style={styles.maRow}>
          <MaInput label={isEN ? 'Short (MA1)' : '短線 MA1'} value={ma1Period} color="#29b6f6"
            tip={isEN ? `Averages last ${ma1Period} candles — short-term trend` : `計算最近 ${ma1Period} 根K線均值，短期趨勢`}
            onChange={(v) => onMa1Change(v)} />
          <span style={{ color: '#333', fontSize: '1rem', paddingTop: 14 }}>/</span>
          <MaInput label={isEN ? 'Long (MA2)' : '長線 MA2'} value={ma2Period} color="#ab47bc"
            tip={isEN ? `Averages last ${ma2Period} candles — long-term trend` : `計算最近 ${ma2Period} 根K線均值，長期趨勢`}
            onChange={(v) => onMa2Change(v)} />
        </div>
      </Group>
    </div>
  );
}

function Group({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.65rem', color: '#555', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}
        title={tip}>{label}{tip ? ' ⓘ' : ''}</span>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
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
