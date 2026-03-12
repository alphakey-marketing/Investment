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

// Plain string — no JSX expression parsing, no TS scope errors
const TEMPLATE_PREVIEW = [
  'Subject: {{subject}}',
  '',
  '{{signal_type}} Signal \u2014 {{asset}}',
  'Price:       ${{price}}',
  'Stop Loss:   ${{stop_loss}}',
  'Take Profit: ${{take_profit}}',
  'Time:        {{time}}',
  '',
  '\u26a0\ufe0f For reference only. Not financial advice.',
].join('\n');

export default function EmailSettings({ config, onSave, onTest, sending, lastStatus, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);
  const isEN = lang === 'EN';

  const handleSave = () => { onSave(draft); setOpen(false); };
  const handleTest = async () => { onSave(draft); setTesting(true); await onTest(); setTesting(false); };

  const vars = ['{{subject}}', '{{signal_type}}', '{{asset}}', '{{price}}', '{{stop_loss}}', '{{take_profit}}', '{{time}}', '{{to_email}}'];

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        <span style={{ color: config.enabled ? '#00c853' : '#555' }}>{config.enabled ? '\uD83D\uDFE2' : '\u26AA'}</span>
        {isEN ? '\uD83D\uDCE7 Email Alert Settings' : '\uD83D\uDCE7 \u96FB\u90F5\u8B66\u5831\u8A2D\u5B9A'}
        {config.enabled && <span style={styles.onBadge}>{isEN ? 'Active' : '\u958B\u555F\u4E2D'}</span>}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '\u25BC' : '\u25B6'}</span>
      </button>

      {open && (
        <div style={styles.body}>

          {/* Why use email */}
          <div style={styles.whyBox}>
            <div style={styles.whyTitle}>{isEN ? '\uD83D\uDCA1 Why set up Email alerts?' : '\uD83D\uDCA1 \u70BA\u4EC0\u9EBC\u8981\u8A2D\u5B9A\u96FB\u90F5\u8B66\u5831\uFF1F'}</div>
            <p style={styles.whyText}>
              {isEN
                ? 'Email alerts are a reliable backup to Telegram. They arrive in your inbox even if your phone has Telegram muted, and you can search/archive signal history easily.'
                : '\u96FB\u90F5\u8B66\u5831\u662F Telegram \u7684\u53EF\u9760\u5099\u4EFD\u3002\u5373\u4F7F\u4F60\u7684\u624B\u6A5F\u5C07 Telegram \u975C\u97F3\uFF0C\u96FB\u90F5\u4ECD\u6703\u9001\u9054\u6536\u4EF6\u7BB1\uFF0C\u4E14\u8A0A\u865F\u6B77\u53F2\u5BB9\u6613\u641C\u5C0B\u5B58\u6A94\u3002'}
            </p>
          </div>

          {/* Setup guide */}
          <div style={styles.guide}>
            <div style={styles.guideTitle}>
              {isEN ? '\uD83D\uDCD6 How to set up EmailJS (free, no backend needed)' : '\uD83D\uDCD6 \u5982\u4F55\u8A2D\u5B9A EmailJS\uFF08\u514D\u8CBB\uFF0C\u7121\u9700\u5F8C\u7AEF\uFF09'}
            </div>
            {(isEN ? [
              'emailjs.com \u2192 Sign up free \u2192 Dashboard \u2192 Add New Service \u2192 connect Gmail/Outlook',
              'Email Templates \u2192 Create New Template \u2192 paste the HTML template below \u2192 set Subject field to {{subject}}',
              'In template To Email field enter: {{to_email}}',
              'Copy your Service ID, Template ID, and Public Key (Account \u2192 API Keys) into the form below',
            ] : [
              'emailjs.com \u2192 \u514D\u8CBB\u8A3B\u518A \u2192 Dashboard \u2192 Add New Service \u2192 \u9023\u63A5 Gmail/Outlook',
              'Email Templates \u2192 Create New Template \u2192 \u8CBC\u4E0A\u4E0B\u65B9 HTML \u6A21\u677F \u2192 Subject \u6B04\u4F4D\u8A2D\u70BA {{subject}}',
              '\u5728\u6A21\u677F To Email \u6B04\u4F4D\u8F38\u5165\uFF1A{{to_email}}',
              '\u8907\u88FD\u4F60\u7684 Service ID\u3001Template ID \u53CA Public Key\uFF08\u5E33\u6236 \u2192 API Keys\uFF09\u5230\u4E0B\u65B9\u8868\u683C',
            ]).map((step, i) => (
              <div key={i} style={styles.step}>
                <span style={styles.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
            <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              {isEN ? '\u2192 Open EmailJS Dashboard' : '\u2192 \u958B\u555F EmailJS \u63A7\u5236\u53F0'}
            </a>
          </div>

          {/* Template variables reference */}
          <div style={styles.templateHint}>
            <div style={{ fontSize: '0.72rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 8 }}>
              {isEN ? '\uD83D\uDCCB Template variables your app sends:' : '\uD83D\uDCCB \u61C9\u7528\u7A0B\u5F0F\u767C\u9001\u7684\u6A21\u677F\u8B8A\u6578\uFF1A'}
            </div>
            <div style={styles.varsGrid}>
              {vars.map((v) => (
                <code key={v} style={styles.varChip}>{v}</code>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#f0b90b', fontWeight: 'bold', margin: '10px 0 6px' }}>
              {isEN ? '\uD83D\uDCCB Plain-text template preview:' : '\uD83D\uDCCB \u7D14\u6587\u5B57\u6A21\u677F\u9810\u89BD\uFF1A'}
            </div>
            <pre style={styles.pre}>{TEMPLATE_PREVIEW}</pre>
          </div>

          {/* Form */}
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
              {isEN ? 'Public Key (API Key)' : '\u516C\u958B\u91D1\u9470\uFF08API Key\uFF09'}
              <input style={styles.input} type="password" placeholder="xxxxxxxxxxxxxxx"
                value={draft.publicKey} onChange={(e) => setDraft({ ...draft, publicKey: e.target.value })} />
            </label>
            <label style={styles.label}>
              {isEN ? 'Your Email Address' : '\u4F60\u7684\u96FB\u90F5\u5730\u5740'}
              <input style={styles.input} type="email" placeholder="you@gmail.com"
                value={draft.toEmail} onChange={(e) => setDraft({ ...draft, toEmail: e.target.value })} />
            </label>
            <label style={styles.toggleRow}>
              <input type="checkbox" checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
              <span style={{ color: '#ccc' }}>
                {isEN ? 'Enable email signal notifications' : '\u555F\u7528\u96FB\u90F5\u8A0A\u865F\u901A\u77E5'}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button onClick={handleSave} style={styles.saveBtn}>
              {isEN ? '\uD83D\uDCBE Save Settings' : '\uD83D\uDCBE \u5132\u5B58\u8A2D\u5B9A'}
            </button>
            <button
              onClick={handleTest}
              disabled={!draft.serviceId || !draft.templateId || !draft.publicKey || !draft.toEmail || testing || sending}
              style={{ ...styles.testBtn, opacity: (!draft.serviceId || !draft.templateId || !draft.publicKey || !draft.toEmail) ? 0.4 : 1 }}
            >
              {testing || sending
                ? (isEN ? 'Sending\u2026' : '\u767C\u9001\u4E2D\u2026')
                : (isEN ? '\uD83D\uDCE4 Test Send' : '\uD83D\uDCE4 \u6E2C\u8A66\u767C\u9001')}
            </button>
          </div>

          {lastStatus && (
            <div style={{ ...styles.status, color: lastStatus === 'ok' ? '#00c853' : '#ff1744' }}>
              {lastStatus === 'ok'
                ? (isEN ? '\u2705 Sent! Check your inbox.' : '\u2705 \u767C\u9001\u6210\u529F\uFF01\u8ACB\u67E5\u770B\u6536\u4EF6\u7BB1\u3002')
                : (isEN ? '\u274C Failed \u2014 check your Service ID, Template ID, and Public Key.' : '\u274C \u767C\u9001\u5931\u6557\uFF0C\u8ACB\u6AA2\u67E5 Service ID\u3001Template ID \u53CA\u516C\u958B\u91D1\u9470\u662F\u5426\u6B63\u78BA\u3002')}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  varsGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  varChip: { background: '#1a1a2e', color: '#f0b90b', border: '1px solid #2a2a3e', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontFamily: 'monospace' },
  pre: { margin: '0', fontSize: '0.72rem', color: '#555', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#0f0f1a', padding: '10px', borderRadius: 6 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' },
  input: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff', padding: '7px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none' },
  toggleRow: { display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'monospace' },
  actions: { display: 'flex', gap: 10 },
  saveBtn: { background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  testBtn: { background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem' },
  status: { fontSize: '0.8rem', fontFamily: 'monospace', padding: '6px 0' },
};
