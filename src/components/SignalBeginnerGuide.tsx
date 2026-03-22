import React, { useState } from 'react';
import { Lang } from '../i18n';

export default function BeginnerGuide({ lang }: { lang: Lang }) {
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
          <Section color="#f0b90b" title={isEN ? '🗺️ What is this app?' : '🗺️ 這個 App 是什麼？'}>
            <p style={guide.p}>
              {isEN
                ? 'A traffic light for trading. It watches Gold / BTC / ETH around the clock and alerts you when rule-based conditions are met to BUY or SELL.'
                : '一個交易用的交通燈號系統。全天候監測黃金/BTC/ETH，在規則條件滿足時提示你買入或賣出。'}
            </p>
            <p style={guide.p}>{isEN ? '⚠️ It shows signals only — it does NOT place trades for you.' : '⚠️ 只顯示訊號，不會自動下單。'}</p>
          </Section>

          <Section color="#29b6f6" title={isEN ? '📊 Dashboard numbers explained' : '📊 面板數字說明'}>
            <GuideItem tag={isEN ? 'Current Price' : '現價'} tagColor="#f0b90b">
              {isEN ? 'The live price right now, updated every 10 seconds. Like the price tag on a shelf.' : '即時市場價格，每10秒更新。就像貨架上的標價貼，隨時在變。'}
            </GuideItem>
            <GuideItem tag="MA20" tagColor="#29b6f6">
              {isEN ? 'Average of last 20 candle closes — the market\'s "recent mood". Above it = bullish.' : '最近20根K線收盤均值——市場的「近期情緒」。現價在上 = 多頭。'}
            </GuideItem>
            <GuideItem tag="MA60" tagColor="#ab47bc">
              {isEN ? 'Average of last 60 candles — big-picture direction. Below it = bearish.' : '最近60根K線均值——大方向趨勢。現價在下 = 空頭。'}
            </GuideItem>
            <GuideItem tag={isEN ? 'Trend' : '趨勢'} tagColor="#888">
              {isEN ? 'Bullish = price above MA20 (boat on water). Bearish = price below (boat sinking).' : '多頭 = 價格浮在MA20上（船在水面）。空頭 = 價格沉在線下（船沉水底）。'}
            </GuideItem>
          </Section>

          <Section color="#00c853" title={isEN ? '🚦 What triggers a signal?' : '🚦 什麼情況會觸發訊號？'}>
            <GuideItem tag={isEN ? '🟢 BUY' : '🟢 買入'} tagColor="#00c853">
              {isEN ? 'Price is above MA20 + within 0.5% of MA20 + current candle makes a new high. All 3 together = green light.' : '現價在MA20上方 + 距MA20在0.5%以內 + 本根K線創新高。三個同時滿足 = 綠燈。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🔴 SELL' : '🔴 賣出'} tagColor="#ff1744">
              {isEN ? 'Price is below MA60 + within 0.5% of MA60 + current candle makes a new low. All 3 together = red light.' : '現價在MA60下方 + 距MA60在0.5%以內 + 本根K線創新低。三個同時滿足 = 紅燈。'}
            </GuideItem>
            <GuideItem tag={isEN ? '⏳ Waiting' : '⏳ 等待'} tagColor="#888">
              {isEN ? 'Not all 3 conditions are met yet. The checklist above shows exactly how far away each condition is in real dollars.' : '3個條件未同時滿足。上方的條件清單會實時顯示每個條件距離觸發還差多少美元。'}
            </GuideItem>
          </Section>

          <Section color="#ff9800" title={isEN ? '💰 Stop Loss & Take Profit' : '💰 止蝕 & 止盈'}>
            <GuideItem tag={isEN ? '🛑 Stop Loss' : '🛑 止蝕'} tagColor="#ff1744">
              {isEN ? 'Auto-exit if price moves against you by 1%. Like an insurance policy — small fixed cost to avoid a big disaster.' : '若價格反向移動1%自動離場。就像保險——付小額保費防大損失。'}
            </GuideItem>
            <GuideItem tag={isEN ? '🎯 Take Profit' : '🎯 止盈'} tagColor="#00c853">
              {isEN ? 'Target exit at +3% profit. You aim to earn 3× what you risk.' : '目標在+3%利潤離場。目標是賺取風險的3倍。'}
            </GuideItem>
            <GuideItem tag={isEN ? '⚖️ R:R 3:1' : '⚖️ 盈虧比 3:1'} tagColor="#f0b90b">
              {isEN ? 'For every $1 risked, target $3 profit. Even with only 40% wins, you\'re profitable long-term.' : '每冒$1風險，目標賺$3。即使只有40%勝率，長期仍盈利。'}
            </GuideItem>
          </Section>

          <div style={{ background: '#1a1500', border: '1px solid #f0b90b44', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#f0b90b', lineHeight: 1.7 }}>
            {isEN ? '⚠️ For educational reference only. Not financial advice. Always practice with Paper Trading before using real money.' : '⚠️ 僅供教學參考，非投資建議。使用真實資金前請先在模擬盤充分練習。'}
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

const guide: Record<string, React.CSSProperties> = {
  wrapper: {},
  toggle: { width: '100%', background: '#16161e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center', textAlign: 'left' },
  body: { background: '#0d0d1e', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 },
  p: { margin: '0 0 4px', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7 },
};
