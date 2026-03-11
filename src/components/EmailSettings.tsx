import React, { useState } from 'react';
import { EmailConfig } from '../hooks/useEmail';
import { Lang } from '../i18n';

interface Props {
  config: EmailConfig;
  onSave: (c: EmailConfig) => void;
  onTest: () => Promise<boolean>;
  sending: boolean;
  lastStatus: 'ok' | 'error' | null;
  lang: Lang;
}

export default function EmailSettings({ config, onSave, onTest, sending, lastStatus, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);
  const isEN = lang === 'EN';

  const handleSave = () => { onSave(draft); setOpen(false); };
  const handleTest = async () => { onSave(draft); setTesting(true); await onTest(); setTesting(false); };

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        <span style={{ color: config.enabled ? '#00c853' : '#555' }}>{config.enabled ? '🟢' : '⚪'}</span>
        {isEN ? '📧 Email Alert Settings' : '📧 電郵警報設定'}
        {config.enabled && <span style={styles.onBadge}>{isEN ? 'Active' : '開啟中'}</span>}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {/* ── Why use email alerts ── */}
          <div style={styles.whyBox}>
            <div style={styles.whyTitle}>{isEN ? '💡 Why set up Email alerts?' : '💡 為什麼要設定電郵警報？'}</div>
            <p style={styles.whyText}>
              {isEN
                ? 'Email alerts are a reliable backup to Telegram. They arrive in your inbox even if your phone has Telegram muted, and you can search/archive signal history easily.'
                : '電郵警報是 Telegram 的可靠備份。即使你的手機將 Telegram 靜音，電郵仍會送達收件箱，且訊號歷史容易搜尋存檔。'}
            </p>
          </div>

          {/* ── Setup guide ── */}
          <div style={styles.guide}>
            <div style={styles.guideTitle}>
              {isEN ? '📖 How to set up EmailJS (free, no backend needed)' : '📖 如何設定 EmailJS（免費，無需後端）'}
            </div>
            {(isEN ? [
              <><C>emailjs.com</C> → Sign up free → Dashboard → <C>Add New Service</C> → connect Gmail/Outlook</>,
              <>Go to <C>Email Templates</C> → <C>Create New Template</C> — use variables: <C>{'{{'} subject {'}}'}</C>, <C>{'{{'} signal_type {'}}'}</C>, <C>{'{{'} asset {'}}'}</C>, <C>{'{{'} price {'}}'}</C>, <C>{'{{'} stop_loss {'}}'}</C>, <C>{'{{'} take_profit {'}}'}</C>, <C>{'{{'} time {'}}'}</C>, <C>{'{{'} to_email {'}}'}</C></>,
              <>In template settings set <C>To Email</C> field to <C>{'{{'} to_email {'}}'}</C></>,
              <>Copy your <C>Service ID</C>, <C>Template ID</C>, and <C>Public Key</C> (under Account → API Keys) into the form below</>,
            ] : [
              <><C>emailjs.com</C> → 免費註冊 → Dashboard → <C>Add New Service</C> → 連接 Gmail/Outlook</>,
              <>前往 <C>Email Templates</C> → <C>Create New Template</C> — 使用變數：<C>{'{{'} subject {'}}'}</C>、<C>{'{{'} signal_type {'}}'}</C>、<C>{'{{'} asset {'}}'}</C>、<C>{'{{'} price {'}}'}</C>、<C>{'{{'} stop_loss {'}}'}</C>、<C>{'{{'} take_profit {'}}'}</C>、<C>{'{{'} time {'}}'}</C>、<C>{'{{'} to_email {'}}'}</C></>,
              <>在模板設定中，將 <C>To Email</C> 欄位設為 <C>{'{{'} to_email {'}}'}</C></>,
              <>複製你的 <C>Service ID</C>、<C>Template ID</C> 及 <C>Public Key</C>（帳戶 → API Keys）到下方表格</>,
            ]).map((step, i) => (
              <div key={i} style={styles.step}>
                <span style={styles.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
            <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              {isEN ? '→ Open EmailJS Dashboard' : '→ 開啟 EmailJS 控制台'}
            </a>
          </div>

          {/* ── Template hint ── */}
          <div style={styles.templateHint}>
            <div style={{ fontSize: '0.72rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 6 }}>
              {isEN ? '📋 Suggested Email Template Body:' : '📋 建議電郵模板內容：'}
            </div>
            <pre style={styles.pre}>{`Subject: {{subject}}

{{signal_type}} Signal — {{asset}}
Price:       ${{price}}
Stop Loss:   ${{stop_loss}}
Take Profit: ${{take_profit}}
Time:        {{time}}

⚠️ For reference only. Not financial advice.`}</pre>
          </div>

          {/* ── Form ── */}
          <div style={styles.form}>
            <label style={styles.label}>
              Service ID
              <input style={styles.input} type="text" placeholder="service_xxxxxxx"
                value={draft.serviceId} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })} />
            </label>
            <label style={styles.label}>
              Template ID
              <input style={styles.input} type="text" placeholder="template_xxxxxxx"
                value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value })} />
            </label>
            <label style={styles.label}>
              {isEN ? 'Public Key (API Key)' : '公開金鑰（API Key）'}
              <input style={styles.input} type="password" placeholder="xxxxxxxxxxxxxxx"
                value={draft.publicKey} onChange={(e) => setDraft({ ...draft, publicKey: e.target.value })} />
            </label>
            <label style={styles.label}>
              {isEN ? 'Your Email Address' : '你的電郵地址'}
              <input style={styles.input} type="email" placeholder="you@gmail.com"
                value={draft.toEmail} onChange={(e) => setDraft({ ...draft, toEmail: e.target.value })} />
            </label>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
              <span style={{ color: '#ccc' }}>
                {isEN ? 'Enable email signal notifications' : '啟用電郵訊號通知'}
              </span>
            </label>
          </div>

          {/* ── Actions ── */}
          <div style={styles.actions}>
            <button onClick={handleSave} style={styles.saveBtn}>
              {isEN ? '💾 Save Settings' : '💾 儲存設定'}
            </button>
            <button
              onClick={handleTest}
              disabled={!draft.serviceId || !draft.templateId || !draft.publicKey || !draft.toEmail || testing || sending}
              style={{ ...styles.testBtn, opacity: (!draft.serviceId || !draft.templateId || !draft.publicKey || !draft.toEmail) ? 0.4 : 1 }}
            >
              {testing || sending
                ? (isEN ? 'Sending…' : '發送中…')
                : (isEN ? '📤 Test Send' : '📤 測試發送')}
            </button>
          </div>

          {lastStatus && (
            <div style={{ ...styles.status, color: lastStatus === 'ok' ? '#00c853' : '#ff1744' }}>
              {lastStatus === 'ok'
                ? (isEN ? '✅ Sent! Check your inbox.' : '✅ 發送成功！請查看收件箱。')
                : (isEN ? '❌ Failed — check your Service ID, Template ID, and Public Key.' : '❌ 發送失敗，請檢查 Service ID、Template ID 及公開金鑰是否正確。')}
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
  whyBox: { background: '#0d1a0d', border: '1px solid #00c85322', borderRadius: 8, padding: '12px 14px' },
  whyTitle: { fontSize: '0.8rem', color: '#00c853', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 6 },
  whyText: { margin: 0, fontSize: '0.76rem', color: '#666', lineHeight: 1.6, fontFamily: 'monospace' },
  guide: { display: 'flex', flexDirection: 'column', gap: 8, background: '#0f0f1a', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a1a2e' },
  guideTitle: { fontSize: '0.78rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 4 },
  step: { fontSize: '0.78rem', color: '#aaa', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.6 },
  stepNum: { background: '#2a2a3e', color: '#f0b90b', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0, minWidth: 18 } as React.CSSProperties,
  link: { fontSize: '0.75rem', color: '#29b6f6', fontFamily: 'monospace', marginTop: 4 },
  templateHint: { background: '#0a0a16', border: '1px solid #2a2a3e', borderRadius: 8, padding: '12px 14px' },
  pre: { margin: 0, fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' },
  input: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '7px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none' },
  toggleRow: { display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'monospace' },
  actions: { display: 'flex', gap: 10 },
  saveBtn: { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  testBtn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  status: { fontSize: '0.8rem', fontFamily: 'monospace', padding: '6px 0' },
};
