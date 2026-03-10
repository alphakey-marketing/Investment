import React, { useState } from 'react';
import { SignalEvent, MAPoint } from '../types/binance';
import { Lang, tr } from '../i18n';

interface Props {
  signal: SignalEvent | null;
  ma20: MAPoint[];
  ma60: MAPoint[];
  lastPrice: number | null;
  lang: Lang;
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: 3 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e35', color: '#ddd', padding: '8px 12px', borderRadius: 8,
          fontSize: '0.78rem', whiteSpace: 'normal', zIndex: 200, border: '1px solid #444',
          lineHeight: 1.6, maxWidth: 240, textAlign: 'center', boxShadow: '0 4px 16px #0008',
        }}>{text}</span>
      )}
    </span>
  );
}

function StatCard({ label, value, color, tip, sub }: { label: string; value: string; color?: string; tip?: string; sub?: string }) {
  return (
    <div style={statStyles.card}>
      <div style={statStyles.label}>
        {tip ? <Tip text={tip}><span>{label} <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>ⓘ</span></span></Tip> : label}
      </div>
      <div style={{ ...statStyles.value, color: color ?? '#fff' }}>{value}</div>
      {sub && <div style={statStyles.sub}>{sub}</div>}
    </div>
  );
}

function BeginnerGuide({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isEN = lang === 'EN';
  return (
    <div style={guide.wrapper}>
      <button onClick={() => setOpen(!open)} style={guide.toggle}>
        <span>{open ? '▼' : '▶'}</span>
        <span>{isEN ? '📖 Beginner Guide — What does everything mean?' : '📖 新手指南 — 每個數字代表什麼？'}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#444' }}>{open ? (isEN ? 'hide' : '收起') : (isEN ? 'show' : '展開')}</span>
      </button>
      {open && (
        <div style={guide.body}>

          {/* What is this app */}
          <Section color="#f0b90b" title={isEN ? '🗺️ What is this app?' : '🗺️ 這個 App 是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'Think of this as a traffic light for trading. It watches the price of Gold (or BTC/ETH) around the clock and tells you when conditions look good to BUY or SELL — based on a rule-based method called MA Crossover.'
                : '把這個 App 想像成一個交通燈號系統。它全天候監測黃金（或BTC/ETH）的價格，在條件成熟時告訴你「適合買入」或「適合賣出」——基於一套叫做「K均交易法」的規則系統。'}
            </p>
            <p style={guide.p}>
              {isEN
                ? '⚠️ It does NOT place trades for you. It only shows signals. Always do your own research.'
                : '⚠️ 它不會自動下單，只顯示訊號供參考。請自行判斷是否入場。'}
            </p>
          </Section>

          {/* Price / MA */}
          <Section color="#29b6f6" title={isEN ? '📊 What are the numbers on the dashboard?' : '📊 面板上的數字是什麼意思？'}>
            <GuideItem tag={isEN ? 'Current Price' : '現價'} tagColor="#f0b90b">
              {isEN
                ? 'The live market price of the asset right now. Updates every 10 seconds. Like the price tag on a shelf — it changes constantly.'
                : '資產當前的即時市場價格，每10秒更新一次。就像超市貨架上的價格標籤，隨時在變動。'}
            </GuideItem>
            <GuideItem tag="MA20" tagColor="#29b6f6">
              {isEN
                ? 'The average closing price of the last 20 candles (bars on the chart). Think of it as the "recent mood" of the market. Price above MA20 = market is in a bullish (upward) mood.'
                : '最近 20 根 K 線收盤價的平均值。想像它是市場的「近期情緒」。價格在 MA20 之上 = 市場處於上升情緒（多頭）。'}
            </GuideItem>
            <GuideItem tag="MA60" tagColor="#ab47bc">
              {isEN
                ? 'The average of the last 60 candles — the "big picture" trend. Price below MA60 = the longer-term direction is downward (bearish).'
                : '最近 60 根 K 線的平均值，代表「大方向」趨勢。價格在 MA60 之下 = 長期方向向下（空頭）。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Trend' : '趨勢'} tagColor="#888">
              {isEN
                ? 'Compares current price with MA20. "Bullish" = price is above the line (like a boat riding above water). "Bearish" = price is below the line (boat sinking below water).'
                : '比較現價與 MA20。「多頭」= 價格在線之上（像船浮在水面上）。「空頭」= 價格在線之下（船沉在水面下）。'}
            </GuideItem>
          </Section>

          {/* Signals */}
          <Section color="#00c853" title={isEN ? '🚦 What do signals mean?' : '🚦 訊號是什麼意思？'}>
            <GuideItem tag={isEN ? '🟢 BUY Signal' : '🟢 買入訊號'} tagColor="#00c853">
              {isEN
                ? 'Price crossed above MA20 and hit a new recent high. The rule says: "When above the line, go long (buy)." Like a green traffic light — conditions look good to enter a long trade.'
                : '價格突破 MA20 並創近期新高。規則說：「線上做多（買入）。」就像綠燈亮起——條件符合，可考慮做多入場。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🔴 SELL Signal' : '🔴 賣出訊號'} tagColor="#ff1744">
              {isEN
                ? 'Price dropped below MA60 and hit a new recent low. The rule says: "When below the line, go short (sell)." Like a red traffic light — conditions suggest a downward move.'
                : '價格跌破 MA60 並創近期新低。規則說：「線下做空（賣出）。」就像紅燈亮起——條件顯示市場向下。'}
            </GuideItem>
            <GuideItem tag={isEN ? '⏳ Waiting' : '⏳ 等待中'} tagColor="#888">
              {isEN
                ? 'No signal yet. Price hasn\'t reached the MA level. The rule is: "Only act when price reaches the line — don\'t chase." Like waiting at an amber light.'
                : '暫時無訊號。價格尚未到達 MA 的位置。規則說：「到位才動，不到位不追。」就像黃燈——繼續等待。'}
            </GuideItem>
          </Section>

          {/* SL / TP */}
          <Section color="#ff9800" title={isEN ? '💰 Stop Loss & Take Profit — why do they matter?' : '💰 止蝕 & 止盈 — 為什麼重要？'}>
            <GuideItem tag={isEN ? '🛑 Stop Loss (S/L)' : '🛑 止蝕'} tagColor="#ff1744">
              {isEN
                ? 'A pre-set exit price that limits your loss if the trade goes wrong. Set at entry −1% (buy) or +1% (sell). Think of it as an insurance policy: you pay a small premium (the 1% loss) to protect against a bigger disaster.'
                : '預設的離場價格，限制交易出錯時的虧損。設於入場價 -1%（買入）或 +1%（賣出）。想像它是保險：付出小額保費（1% 虧損）來防範更大的損失。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🎯 Take Profit (T/P)' : '🎯 止盈'} tagColor="#00c853">
              {isEN
                ? 'A pre-set exit price that locks in your profit. Set at entry +3% (buy) or −3% (sell). You aim to earn 3× what you risk.'
                : '預設的目標離場價格，鎖定利潤。設於入場價 +3%（買入）或 -3%（賣出）。目標是賺取風險的3倍。'}
            </GuideItem>
            <GuideItem tag={isEN ? '📊 R:R Ratio 3:1' : '📊 盈虧比 3:1'} tagColor="#f0b90b">
              {isEN
                ? 'For every $1 you risk, you aim to make $3. This means even if only 4 trades out of 10 win, you still make an overall profit. It\'s the math that makes the system work long-term.'
                : '每冒險 $1，目標賺取 $3。這意味著即使10次交易只有4次勝出，整體仍然盈利。這就是系統長期有效的數學基礎。'}
            </GuideItem>
          </Section>

          <div style={{ background: '#1a1500', border: '1px solid #f0b90b44', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#f0b90b', lineHeight: 1.7 }}>
            {isEN
              ? '⚠️ This app is for educational reference only. Signals do not guarantee profit. Always practice with Paper Trading first before using real money.'
              : '⚠️ 本 App 僅供教學參考。訊號不保證盈利。在使用真實資金前，請先在「模擬盤」模式中充分練習。'}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.82rem', color, fontWeight: 'bold', borderBottom: `1px solid ${color}33`, paddingBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function GuideItem({ tag, tagColor, children }: { tag: string; tagColor: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 }}>
      <span style={{ background: tagColor + '22', color: tagColor, border: `1px solid ${tagColor}55`, padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>{tag}</span>
      <span>{children}</span>
    </div>
  );
}

export default function SignalPanel({ signal, ma20, ma60, lastPrice, lang }: Props) {
  const latestMA20 = ma20[ma20.length - 1]?.value ?? null;
  const latestMA60 = ma60[ma60.length - 1]?.value ?? null;
  const isEN = lang === 'EN';
  const isBull = lastPrice && latestMA20 ? lastPrice > latestMA20 : null;

  const ma20Tip = isEN
    ? 'Average of last 20 candles. Think of it as the short-term mood of the market. Price above = bullish.'
    : '最近20根K線平均值，代表市場「近期情緒」。現價在線上 = 多頭（上升）。';
  const ma60Tip = isEN
    ? 'Average of last 60 candles — the big-picture trend indicator. Price below = bearish.'
    : '最近60根K線平均值，代表「大方向」趨勢。現價在線下 = 空頭（下跌）。';
  const trendTip = isEN
    ? 'Compares price vs MA20. Bullish = price floating above the line like a boat on water.'
    : '比較現價與MA20：多頭 = 價格浮在線上如船在水面；空頭 = 價格沉在線下。';
  const priceTip = isEN ? 'Live market price, updates every 10 seconds.' : '即時市場價格，每10秒自動更新。';

  return (
    <div style={styles.panel}>
      {/* Title */}
      <div style={styles.titleRow}>
        <div>
          <div style={styles.title}>{isEN ? '📊 MA Signal Dashboard' : '📊 K均訊號面板'}</div>
          <div style={styles.subtitle}>{isEN ? 'Real-time buy/sell signals based on Moving Average rules' : '基於移動平均線規則的即時買賣訊號'}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsRow}>
        <StatCard
          label={isEN ? 'Current Price' : '現價 (USDT)'}
          value={`$${lastPrice?.toFixed(2) ?? '---'}`}
          color="#f0b90b"
          tip={priceTip}
          sub={isEN ? 'Updates every 10s' : '每10秒更新'}
        />
        <StatCard
          label="MA20"
          value={`$${latestMA20?.toFixed(2) ?? '---'}`}
          color="#29b6f6"
          tip={ma20Tip}
          sub={isEN ? 'Short-term avg' : '短期均線'}
        />
        <StatCard
          label="MA60"
          value={`$${latestMA60?.toFixed(2) ?? '---'}`}
          color="#ab47bc"
          tip={ma60Tip}
          sub={isEN ? 'Long-term avg' : '長期均線'}
        />
        <StatCard
          label={isEN ? 'Trend' : '趨勢'}
          value={
            isBull === null ? '---'
            : isBull ? (isEN ? '⬆ Bullish' : '⬆ 多頭')
            : (isEN ? '⬇ Bearish' : '⬇ 空頭')
          }
          color={isBull === null ? '#888' : isBull ? '#00c853' : '#ff1744'}
          tip={trendTip}
          sub={isEN ? 'Price vs MA20' : '現價 vs MA20'}
        />
      </div>

      {/* Signal Box */}
      <div style={styles.signalSection}>
        <div style={styles.sectionLabel}>{isEN ? '🚦 LIVE SIGNAL' : '🚦 即時訊號'}</div>
        {signal ? (
          <div style={{
            ...styles.signalCard,
            background: signal.type === 'LONG' ? '#0a2e18' : '#2e0a0a',
            borderColor: signal.type === 'LONG' ? '#00c853' : '#ff1744',
            boxShadow: `0 0 20px ${signal.type === 'LONG' ? '#00c85330' : '#ff174430'}`,
          }}>
            <div style={styles.signalTop}>
              <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{signal.type === 'LONG' ? '🟢' : '🔴'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                  {signal.type === 'LONG'
                    ? (isEN ? 'BUY / Long Entry Signal' : '買入（做多）入場訊號')
                    : (isEN ? 'SELL / Short Entry Signal' : '賣出（做空）入場訊號')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#bbb', marginTop: 4, lineHeight: 1.5 }}>{signal.message}</div>
              </div>
            </div>
            {/* Entry levels */}
            <div style={styles.levelsRow}>
              <LevelBadge
                icon="📍"
                label={isEN ? 'Entry' : '入場'}
                value={`$${signal.price.toFixed(2)}`}
                color="#f0b90b"
                tip={isEN ? 'Suggested entry price when signal triggered' : '訊號觸發時的建議入場價格'}
              />
              <LevelBadge
                icon="🛑"
                label={isEN ? 'Stop Loss' : '止蝕'}
                value={`$${(signal.type === 'LONG' ? signal.price * 0.99 : signal.price * 1.01).toFixed(2)}`}
                color="#ff5252"
                tip={isEN ? 'Exit here if trade goes wrong. Limits your loss to ~1%.'
                  : '若交易出錯，在此價格離場，損失限制在約1%。'}
              />
              <LevelBadge
                icon="🎯"
                label={isEN ? 'Take Profit' : '止盈'}
                value={`$${(signal.type === 'LONG' ? signal.price * 1.03 : signal.price * 0.97).toFixed(2)}`}
                color="#00c853"
                tip={isEN ? 'Target exit to lock in profit. Profit is 3× the stop loss distance.'
                  : '目標離場價格，利潤為止蝕距離的3倍。'}
              />
              <LevelBadge
                icon="⚖️"
                label={isEN ? 'R:R Ratio' : '盈虧比'}
                value="3 : 1"
                color="#f0b90b"
                tip={isEN ? 'For every $1 risked, you aim to make $3. Even with a 40% win rate, this strategy stays profitable long-term.'
                  : '每冒 $1 風險，目標賺取 $3。即使只有40%勝率，長期仍然盈利。'}
              />
            </div>
          </div>
        ) : (
          <div style={styles.waitCard}>
            <div style={styles.waitIcon}>⏳</div>
            <div>
              <div style={styles.waitTitle}>{isEN ? 'Waiting for signal...' : '等待訊號中...'}</div>
              <div style={styles.waitDesc}>
                {isEN
                  ? 'Price needs to approach the MA level (within 0.5%) and form a new high/low. Rule: "Only act when price reaches the line — never chase."'
                  : '需要價格接近 MA 位置（0.5%內）並創新高/新低才觸發。規則：「到位才動，不到位不追。」'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Beginner Guide */}
      <BeginnerGuide lang={lang} />

      {/* 3 Rules Footer */}
      <div style={styles.rulesFooter}>
        <div style={styles.rulesTitle}>{isEN ? '📖 The 3 MA Rules' : '📖 K均三大原則'}</div>
        <div style={styles.rulesRow}>
          <RulePill num="1" text={isEN ? 'Above line → Buy' : '線上做多'} color="#00c853" />
          <RulePill num="2" text={isEN ? 'Wait for the line' : '到位才動'} color="#f0b90b" />
          <RulePill num="3" text={isEN ? 'R:R = 3:1' : '盈虧比3:1'} color="#ab47bc" />
        </div>
      </div>
    </div>
  );
}

function LevelBadge({ icon, label, value, color, tip }: { icon: string; label: string; value: string; color: string; tip: string }) {
  return (
    <Tip text={tip}>
      <div style={{ background: color + '18', border: `1px solid ${color}55`, borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, cursor: 'help', minWidth: 90, flex: 1 }}>
        <div style={{ fontSize: '0.67rem', color: color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{icon} {label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color, fontFamily: 'monospace' }}>{value}</div>
      </div>
    </Tip>
  );
}

function RulePill({ num, text, color }: { num: string; color: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: color + '15', border: `1px solid ${color}44`, borderRadius: 20, padding: '5px 12px' }}>
      <span style={{ background: color, color: '#000', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0 }}>{num}</span>
      <span style={{ fontSize: '0.78rem', color, fontFamily: 'monospace' }}>{text}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: '#12122a', border: '1px solid #2a2a3e', borderRadius: 14, padding: '20px', color: '#fff', fontFamily: 'monospace', maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 18 },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: 0 },
  subtitle: { fontSize: '0.72rem', color: '#555', marginTop: 3 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 },
  sectionLabel: { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  signalSection: {},
  signalCard: { border: '1px solid', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  signalTop: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  levelsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 },
  waitCard: { display: 'flex', gap: 14, alignItems: 'flex-start', background: '#16161e', border: '1px dashed #333', borderRadius: 12, padding: '16px' },
  waitIcon: { fontSize: '1.8rem', lineHeight: 1 },
  waitTitle: { fontSize: '0.95rem', color: '#666', fontWeight: 'bold' },
  waitDesc: { fontSize: '0.78rem', color: '#444', marginTop: 6, lineHeight: 1.6 },
  rulesFooter: { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 10, padding: '12px 14px' },
  rulesTitle: { fontSize: '0.68rem', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  rulesRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
};

const statStyles: Record<string, React.CSSProperties> = {
  card: { background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { fontSize: '1rem', fontWeight: 'bold' },
  sub: { fontSize: '0.65rem', color: '#444', marginTop: 1 },
};

const guide: Record<string, React.CSSProperties> = {
  wrapper: {},
  toggle: { width: '100%', background: '#16161e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' },
  body: { background: '#0d0d1e', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 },
  p: { margin: '0 0 4px', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 },
};
