import React, { useState } from 'react';
import { Lang } from '../i18n';

interface Props { lang: Lang; }

const RISKS_EN = [
  {
    icon: '📉', color: '#ff9800',
    title: 'Signals are NOT always right',
    desc: 'Moving average signals work on average — even the best strategy loses 40-50% of individual trades. No signal is a guarantee. The edge comes from consistency over 100+ trades, not any single trade.',
    myth: 'Myth: "This signal says BUY so it will definitely go up"',
    reality: 'Reality: It has a higher probability of going up, but it could still go down. That\'s why stop loss exists.',
  },
  {
    icon: '💸', color: '#ff1744',
    title: 'You WILL have losing trades — plan for them',
    desc: 'A 3:1 R:R strategy with 45% win rate is still profitable. But you must accept that 55 out of every 100 trades will be losses. Beginners who can\'t accept this quit after 3 losses and never see the strategy work.',
    myth: 'Myth: "I lost 3 trades in a row — the strategy is broken"',
    reality: 'Reality: 3 consecutive losses is completely normal. Keep a journal, stick to position sizing, and let statistics play out.',
  },
  {
    icon: '🎲', color: '#ab47bc',
    title: 'Past backtest ≠ future results',
    desc: 'The backtest shows historical performance. Markets change — a strategy that worked perfectly in trending markets may underperform in choppy, sideways markets. Always test with real money using small position sizes first.',
    myth: 'Myth: "The backtest showed +45% return so I should go all-in"',
    reality: 'Reality: Start with 1-2% risk per trade. Prove the strategy works for YOU before increasing size.',
  },
  {
    icon: '😱', color: '#29b6f6',
    title: 'Emotions are your biggest risk',
    desc: 'The strategy is rule-based and unemotional. You are not. Fear makes you exit winning trades too early. Greed makes you ignore stop losses. FOMO makes you chase signals. The moment you deviate from the rules, you\'re no longer trading the strategy.',
    myth: 'Myth: "I\'ll just hold a little longer — it\'ll come back"',
    reality: 'Reality: Moving stop losses or ignoring exit rules is how small losses become account-destroying losses.',
  },
  {
    icon: '⚡', color: '#f0b90b',
    title: 'Leverage amplifies BOTH gains AND losses',
    desc: 'If you\'re trading with leverage (e.g. on Binance Futures), a 1% move against you becomes 10% with 10x leverage. The position calculator on this app assumes NO leverage. If you use leverage, your stop loss hit will be 10x larger than shown.',
    myth: 'Myth: "I\'ll use 10x leverage to make 10x more money"',
    reality: 'Reality: 10x leverage means a 1% adverse move wipes 10% of your capital. Beginners should never use leverage.',
  },
];
const RISKS_ZH = [
  {
    icon: '📉', color: '#ff9800',
    title: '訊號並非總是正確的',
    desc: '移動平均線訊號在平均水準上有效——即使最好的策略，40-50% 的單筆交易仍會虧損。沒有訊號能保證獲利。優勢來自於 100+ 筆交易的一致性，而非任何單筆交易。',
    myth: '迷思：「這個訊號顯示買入，所以一定會漲」',
    reality: '現實：它上漲的概率更高，但仍可能下跌。這就是止蝕存在的原因。',
  },
  {
    icon: '💸', color: '#ff1744',
    title: '你「必定」會有虧損交易——預先計劃好',
    desc: '45% 勝率、3:1 盈虧比的策略仍然是盈利的。但你必須接受每 100 筆交易中有 55 筆是虧損。無法接受這一點的新手在虧損 3 次後就放棄了，永遠看不到策略發揮效果。',
    myth: '迷思：「我連輸了 3 次——策略壞了」',
    reality: '現實：連續 3 次虧損完全正常。保持日誌記錄，堅持倉位管理，讓統計學發揮作用。',
  },
  {
    icon: '🎲', color: '#ab47bc',
    title: '過去的回測 ≠ 未來的結果',
    desc: '回測顯示的是歷史表現。市場會變化——在趨勢市場中表現完美的策略，在震盪橫盤市場中可能表現不佳。請先用小倉位的真實資金進行測試。',
    myth: '迷思：「回測顯示 +45% 回報，所以我應該重倉投入」',
    reality: '現實：從每筆交易 1-2% 風險開始。在加大倉位之前，先證明這個策略對「你」有效。',
  },
  {
    icon: '😱', color: '#29b6f6',
    title: '情緒是你最大的風險',
    desc: '策略是基於規則且無情緒的，但你不是。恐懼讓你過早退出盈利交易。貪婪讓你忽視止蝕。FOMO 讓你追逐訊號。一旦偏離規則，你就不再是在執行策略。',
    myth: '迷思：「我再持倉一下——它會回來的」',
    reality: '現實：移動止蝕或忽視退場規則，是小虧損變成毀滅性虧損的根本原因。',
  },
  {
    icon: '⚡', color: '#f0b90b',
    title: '槓桿同時放大「盈利」和「虧損」',
    desc: '如果你使用槓桿交易（例如幣安合約），1% 的反向走勢在 10 倍槓桿下變成 10%。本 App 的倉位計算器假設「無槓桿」。如果你使用槓桿，實際止蝕損失將是顯示數字的 10 倍。',
    myth: '迷思：「我用 10 倍槓桿可以賺 10 倍的錢」',
    reality: '現實：10 倍槓桿意味著 1% 的反向走勢就會損失 10% 的本金。新手絕對不應使用槓桿。',
  },
];

export default function RiskRealityCheck({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const isEN = lang === 'EN';
  const risks = isEN ? RISKS_EN : RISKS_ZH;

  return (
    <div style={s.wrapper}>
      <button onClick={() => setOpen(!open)} style={s.toggleBtn}>
        <span>⚠️</span>
        <span style={{ color: '#ff9800' }}>
          {isEN ? 'Risk Reality Check — Read Before Trading Real Money' : '風險現實檢視——使用真實資金前請閱讀'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#444' }}>{open ? '▲ hide' : '▼ ' + (isEN ? 'expand' : '展開')}</span>
      </button>

      {open && (
        <div style={s.body}>
          <div style={s.intro}>
            {isEN
              ? 'This section tells you what can go wrong — not to scare you, but to prepare you. Every professional trader knows and accepts these realities. Beginners who skip this section are the ones who blow their accounts.'
              : '本節告訴你可能出現的問題——不是為了嚇你，而是為了讓你有所準備。每個專業交易者都了解並接受這些現實。跳過本節的新手往往是那些爆倉的人。'}
          </div>

          <div style={s.grid}>
            {risks.map((r, i) => (
              <div key={i} style={{ ...s.card, borderColor: expanded === i ? r.color + '77' : '#1a1a2e' }}>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}
                >
                  <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 2 }}>{r.icon}</span>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: r.color, fontWeight: 'bold', fontFamily: 'monospace', lineHeight: 1.5 }}>{r.title}</span>
                  <span style={{ color: '#444', fontSize: '0.7rem', flexShrink: 0, marginTop: 4 }}>{expanded === i ? '▲' : '▼'}</span>
                </button>

                {expanded === i && (
                  <div style={s.detail}>
                    <p style={s.desc}>{r.desc}</p>
                    <div style={s.mythBox}>
                      <div style={{ fontSize: '0.72rem', color: '#ff1744', fontFamily: 'monospace', marginBottom: 4 }}>{r.myth}</div>
                      <div style={{ fontSize: '0.72rem', color: '#00c853', fontFamily: 'monospace' }}>{r.reality}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={s.footer}>
            {isEN
              ? '✅ If you\'ve read and understood all 5 risks above, you\'re better prepared than most retail traders. Now use the backtest to paper trade for at least 2 weeks before risking real money.'
              : '✅ 如果你已閱讀並理解以上 5 個風險，你的準備程度已超過大多數散戶交易者。現在請先使用回測進行模擬交易至少 2 週，再用真實資金交易。'}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: { width: '100%', background: '#1a1200', border: '1px solid #ff980044', color: '#888', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' },
  body: { background: '#130f00', border: '1px solid #ff980033', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  intro: { fontSize: '0.78rem', color: '#888', lineHeight: 1.7, fontFamily: 'monospace', background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 8, padding: '10px 12px' },
  grid: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.2s' },
  detail: { display: 'flex', flexDirection: 'column', gap: 8 },
  desc: { margin: 0, fontSize: '0.78rem', color: '#aaa', lineHeight: 1.7, fontFamily: 'monospace' },
  mythBox: { background: '#0d0d1a', border: '1px solid #2a2a3e', borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 },
  footer: { fontSize: '0.76rem', color: '#555', lineHeight: 1.7, fontFamily: 'monospace', borderTop: '1px solid #1a1a2e', paddingTop: 10 },
};
