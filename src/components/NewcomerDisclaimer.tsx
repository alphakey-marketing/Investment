import React, { useState, useEffect } from 'react';
import { Lang } from '../i18n';

interface Props { lang: Lang; }

const STORAGE_KEY = 'alphakey_disclaimer_v1';

export default function NewcomerDisclaimer({ lang }: Props) {
  const [visible, setVisible] = useState(false);
  const isEN = lang === 'EN';

  useEffect(() => {
    // Show only if user hasn't dismissed before
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <span style={{ fontSize: '2rem' }}>👋</span>
          <div>
            <div style={s.title}>
              {isEN ? 'Welcome to AlphaKey — Read this first' : '歡迎使用 AlphaKey — 請先閱讀'}
            </div>
            <div style={s.subtitle}>
              {isEN ? 'This takes 60 seconds. It could save you from costly beginner mistakes.' : '只需60秒。這可能幫你避免代價高昂的新手錯誤。'}
            </div>
          </div>
        </div>

        {/* Checklist of key facts */}
        <div style={s.list}>
          {(isEN ? [
            { icon: '📊', text: 'This app shows rule-based MA signals — it does NOT place trades for you automatically.' },
            { icon: '⚠️', text: 'No signal is 100% correct. Even profitable strategies lose on 40-50% of individual trades.' },
            { icon: '🛑', text: 'ALWAYS set a stop loss before entering any trade. Skipping stop loss is the #1 cause of beginner account blow-ups.' },
            { icon: '📝', text: 'Paper trade (simulate) using the Backtest for at least 2 weeks before using real money.' },
            { icon: '💰', text: 'Recommended: Start with 1-2% risk per trade. Never risk more than 5% of your capital on a single trade.' },
            { icon: '🚫', text: 'This is NOT financial advice. This is an educational tool. You are responsible for your own trading decisions.' },
          ] : [
            { icon: '📊', text: '本 App 顯示基於規則的 MA 訊號——不會自動幫你下單交易。' },
            { icon: '⚠️', text: '訊號並非100%正確。即使是盈利策略，也有40-50%的單筆交易是虧損的。' },
            { icon: '🛑', text: '進入任何交易前「必須」設置止蝕。不設止蝕是新手爆倉的首要原因。' },
            { icon: '📝', text: '在使用真實資金前，至少用回測進行2週的模擬交易。' },
            { icon: '💰', text: '建議：每筆交易從1-2%風險開始。單筆交易絕不超過本金的5%。' },
            { icon: '🚫', text: '本工具僅供教育參考，不構成投資建議。交易決策由你自行負責。' },
          ]).map((item, i) => (
            <div key={i} style={s.item}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={s.quote}>
          {isEN
            ? '"The goal of a beginner is not to make money. The goal is to survive long enough to learn how to make money." — Every experienced trader'
            : '「新手的目標不是賺錢，而是存活足夠長的時間來學習如何賺錢。」——每一位有經驗的交易者'}
        </div>

        {/* Dismiss */}
        <button onClick={handleDismiss} style={s.btn}>
          {isEN ? '✅ I understand — take me to the app' : '✅ 我已了解——帶我進入 App'}
        </button>
        <div style={s.note}>
          {isEN ? '(This message won\'t appear again)' : '（此訊息不會再次出現）'}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' },
  modal: { background: '#13131f', border: '1px solid #f0b90b55', borderRadius: 16, padding: '24px', maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  title: { fontSize: '1rem', color: '#f0b90b', fontWeight: 'bold', fontFamily: 'monospace' },
  subtitle: { fontSize: '0.74rem', color: '#555', fontFamily: 'monospace', marginTop: 4 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 8, padding: '10px 12px' },
  quote: { background: '#1a1500', border: '1px solid #f0b90b22', borderRadius: 8, padding: '10px 14px', fontSize: '0.76rem', color: '#666', fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'monospace' },
  btn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 'bold', width: '100%' },
  note: { textAlign: 'center', fontSize: '0.68rem', color: '#333', fontFamily: 'monospace' },
};
