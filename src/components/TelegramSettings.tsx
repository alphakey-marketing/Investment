import React, { useState } from 'react';
import { TelegramConfig } from '../hooks/useTelegram';
import { Lang } from '../i18n';

interface Props {
  config: TelegramConfig;
  onSave: (c: TelegramConfig) => void;
  onTest: () => Promise<boolean>;
  sending: boolean;
  lastStatus: 'ok' | 'error' | null;
  lang: Lang;
}

export default function TelegramSettings({ config, onSave, onTest, sending, lastStatus, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);
  const isEN = lang === 'EN';

  const handleSave = () => { onSave(draft); setOpen(false); };
  const handleTest = async () => { onSave(draft); setTesting(true); await onTest(); setTesting(false); };

  const t = {
    title:       isEN ? '📨 Telegram Alert Settings'           : '📨 Telegram警報設定',
    active:      isEN ? 'Active'                               : '開啟中',
    guideTitle:  isEN ? '📖 How to set up your Telegram Bot'  : '📖 如何設定 Telegram Bot?',
    step1:       isEN ? <>Search <C>@BotFather</C> on Telegram, send <C>/newbot</C></> : <>在Telegram搜尋 <C>@BotFather</C>，發送 <C>/newbot</C></>,
    step2:       isEN ? <>Name your bot, you'll receive a <C>Bot Token</C> (format: <C>123456:ABC-xyz</C>)</> : <>輸入Bot名稱，獲得 <C>Bot Token</C>（格式如 <C>123456:ABC-xyz</C>）</>,
    step3:       isEN ? <>Send ANY message to your bot first, then visit <C>@userinfobot</C> to get your <C>Chat ID</C></> : <>先對你的Bot發送任意訊息，再到 <C>@userinfobot</C> 獲得你的 <C>Chat ID</C></>,
    step4:       isEN ? 'Fill in the form below, click Save, then Test Send to verify' : '填入下方表格，點「儲存」後按「測試發送」驗證',
    tokenLabel:  isEN ? 'Bot Token'        : 'Bot Token',
    chatLabel:   isEN ? 'Chat ID'          : 'Chat ID',
    chatPH:      isEN ? 'Your User ID or Group ID (e.g. -100123456789)' : '-100123456789 或你的User ID',
    enableLabel: isEN ? 'Enable Telegram signal notifications'           : '啟用Telegram訊號通知',
    save:        isEN ? '💾 Save Settings'  : '💾 儲存設定',
    test:        isEN ? '📤 Test Send'       : '📤 測試發送',
    testing:     isEN ? 'Sending…'          : '發送中…',
    ok:          isEN ? '✅ Sent! Check your Telegram'              : '✅ 發送成功！檢查你的Telegram',
    err:         isEN ? '❌ Failed — check your Token and Chat ID'  : '❌ 發送失敗，檢查Token和Chat ID是否正確',
    // beginner tips
    whyTitle:    isEN ? '💡 Why set up Telegram alerts?'            : '💡 為什麼要設定Telegram警報？',
    why1:        isEN ? 'Markets move 24/7 — you can\'t stare at the screen all day. Telegram alerts let you live your life and only look when a real signal fires.' : '市場24小時不間斷——你不可能整天盯著螢幕。Telegram警報讓你正常生活，只在真實訊號觸發時才需要查看。',
    why2:        isEN ? 'FOMO (fear of missing out) makes beginners trade randomly. Alerts cure FOMO — you only act on rule-based signals, not emotions.' : '害怕錯過（FOMO）會讓新手隨意交易。警報解決了FOMO——你只在規則訊號觸發時行動，而非情緒衝動。',
    tipTitle:    isEN ? '⚡ Pro tip: Silence your Telegram notifications'  : '⚡ 進階技巧：將Telegram通知設為靜音',
    tipBody:     isEN ? 'Mute this bot channel — let alerts accumulate and check them once or twice a day at a set time. Trading consistently at fixed times beats reactive trading.' : '將此Bot頻道設為靜音——讓警報累積，每天固定1-2次查看。按固定時間交易比即時反應交易更穩定。',
  };

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        <span style={{ color: config.enabled ? '#00c853' : '#555' }}>{config.enabled ? '🟢' : '⚪'}</span>
        {t.title}
        {config.enabled && <span style={styles.onBadge}>{t.active}</span>}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {/* ── Why use alerts — beginner education ── */}
          <div style={styles.whyBox}>
            <div style={styles.whyTitle}>{t.whyTitle}</div>
            <p style={styles.whyText}>{t.why1}</p>
            <p style={styles.whyText}>{t.why2}</p>
            <div style={styles.tipRow}>
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <span style={{ fontSize: '0.76rem', color: '#888', lineHeight: 1.6 }}><strong style={{ color: '#f0b90b' }}>{t.tipTitle}</strong><br />{t.tipBody}</span>
            </div>
          </div>

          {/* Guide */}
          <div style={styles.guide}>
            <div style={styles.guideTitle}>{t.guideTitle}</div>
            {([t.step1, t.step2, t.step3, t.step4] as React.ReactNode[]).map((step, i) => (
              <div key={i} style={styles.step}>
                <span style={styles.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div style={styles.form}>
            <label style={styles.label}>
              {t.tokenLabel}
              <input style={styles.input} type="password" placeholder="123456789:ABCdefGhI..." value={draft.botToken}
                onChange={(e) => setDraft({ ...draft, botToken: e.target.value })} />
            </label>
            <label style={styles.label}>
              {t.chatLabel}
              <input style={styles.input} type="text" placeholder={t.chatPH} value={draft.chatId}
                onChange={(e) => setDraft({ ...draft, chatId: e.target.value })} />
            </label>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
              <span style={{ color: '#ccc' }}>{t.enableLabel}</span>
            </label>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button onClick={handleSave} style={styles.saveBtn}>{t.save}</button>
            <button onClick={handleTest} disabled={!draft.botToken || !draft.chatId || testing}
              style={{ ...styles.testBtn, opacity: !draft.botToken || !draft.chatId ? 0.4 : 1 }}>
              {testing ? t.testing : t.test}
            </button>
          </div>

          {lastStatus && (
            <div style={{ ...styles.status, color: lastStatus === 'ok' ? '#00c853' : '#ff1744' }}>
              {lastStatus === 'ok' ? t.ok : t.err}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function C({ children }: { children: React.ReactNode }) {
  return <code style={{ background: '#2a2a3e', color: '#f0b90b', padding: '0 4px', borderRadius: 3, fontSize: '0.75rem' }}>{children}</code>;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: { width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e', color: '#888', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, textAlign: 'left' },
  onBadge: { background: '#0d3d1f', color: '#00c853', border: '1px solid #00c853', padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem', marginLeft: 8 },
  body: { background: '#13131f', border: '1px solid #2a2a3e', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  whyBox: { background: '#0d1a0d', border: '1px solid #00c85322', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  whyTitle: { fontSize: '0.8rem', color: '#00c853', fontWeight: 'bold', fontFamily: 'monospace' },
  whyText: { margin: 0, fontSize: '0.76rem', color: '#666', lineHeight: 1.6, fontFamily: 'monospace' },
  tipRow: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#1a1500', border: '1px solid #f0b90b22', borderRadius: 6, padding: '8px 10px', marginTop: 4 },
  guide: { display: 'flex', flexDirection: 'column', gap: 8, background: '#0f0f1a', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a1a2e' },
  guideTitle: { fontSize: '0.78rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 4 },
  step: { fontSize: '0.78rem', color: '#aaa', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.6 },
  stepNum: { background: '#2a2a3e', color: '#f0b90b', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' },
  input: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '7px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none' },
  toggleRow: { display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'monospace' },
  actions: { display: 'flex', gap: 10 },
  saveBtn: { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  testBtn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  status: { fontSize: '0.8rem', fontFamily: 'monospace', padding: '6px 0' },
};
