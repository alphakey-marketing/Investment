import React, { useState } from 'react';
import { TelegramConfig } from '../hooks/useTelegram';

interface Props {
  config: TelegramConfig;
  onSave: (c: TelegramConfig) => void;
  onTest: () => Promise<boolean>;
  sending: boolean;
  lastStatus: 'ok' | 'error' | null;
}

export default function TelegramSettings({ config, onSave, onTest, sending, lastStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    onSave(draft);
    setOpen(false);
  };

  const handleTest = async () => {
    onSave(draft); // save first
    setTesting(true);
    await onTest();
    setTesting(false);
  };

  return (
    <div style={styles.wrapper}>
      <button onClick={() => setOpen(!open)} style={styles.toggleBtn}>
        <span style={{ color: config.enabled ? '#00c853' : '#555' }}>
          {config.enabled ? '🟢' : '⚪'}
        </span>
          📨 Telegram警報設定
        {config.enabled && <span style={styles.onBadge}>開啟中</span>}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div style={styles.body}>
          {/* Guide */}
          <div style={styles.guide}>
            <div style={styles.guideTitle}>📖 如何設定 Telegram Bot?</div>
            <div style={styles.step}>
              <span style={styles.stepNum}>1</span>
              在Telegram搜尋 <code style={styles.code}>@BotFather</code>，發送 <code style={styles.code}>/newbot</code>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>2</span>
              輸入Bot名稱，獲得 <code style={styles.code}>Bot Token</code>（格式如 <code style={styles.code}>123456:ABC-xyz</code>）
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>3</span>
              先對你的Bot發送任意訊息，再到 <code style={styles.code}>@userinfobot</code> 獲得你的 <code style={styles.code}>Chat ID</code>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>4</span>
              填入下方表格，點「儲存」後按「測試發送」驗證
            </div>
          </div>

          {/* Form */}
          <div style={styles.form}>
            <label style={styles.label}>
              Bot Token
              <input
                style={styles.input}
                type="password"
                placeholder="123456789:ABCdefGhI..."
                value={draft.botToken}
                onChange={(e) => setDraft({ ...draft, botToken: e.target.value })}
              />
            </label>
            <label style={styles.label}>
              Chat ID
              <input
                style={styles.input}
                type="text"
                placeholder="-100123456789或你的User ID"
                value={draft.chatId}
                onChange={(e) => setDraft({ ...draft, chatId: e.target.value })}
              />
            </label>
            <label style={styles.toggleRow}>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              />
              <span style={{ color: '#ccc' }}>啟用Telegram訊號通知</span>
            </label>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button onClick={handleSave} style={styles.saveBtn}>
              💾 儲存設定
            </button>
            <button
              onClick={handleTest}
              disabled={!draft.botToken || !draft.chatId || testing}
              style={{
                ...styles.testBtn,
                opacity: !draft.botToken || !draft.chatId ? 0.4 : 1,
              }}
            >
              {testing ? '發送中...' : '📤 測試發送'}
            </button>
          </div>

          {/* Status */}
          {lastStatus && (
            <div style={{
              ...styles.status,
              color: lastStatus === 'ok' ? '#00c853' : '#ff1744',
            }}>
              {lastStatus === 'ok'
                ? '✅ 發送成功！檢查你的Telegram'
                : '❌ 發送失敗，檢查Token和Chat ID是否正確'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 700, width: '100%' },
  toggleBtn: {
    width: '100%',
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    color: '#888',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    textAlign: 'left',
  },
  onBadge: {
    background: '#0d3d1f',
    color: '#00c853',
    border: '1px solid #00c853',
    padding: '1px 7px',
    borderRadius: 10,
    fontSize: '0.68rem',
    marginLeft: 8,
  },
  body: {
    background: '#13131f',
    border: '1px solid #2a2a3e',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  guide: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: '#0f0f1a',
    borderRadius: 8,
    padding: '12px 14px',
    border: '1px solid #1a1a2e',
  },
  guideTitle: { fontSize: '0.78rem', color: '#f0b90b', fontWeight: 'bold', marginBottom: 4 },
  step: { fontSize: '0.78rem', color: '#aaa', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.6 },
  stepNum: {
    background: '#2a2a3e', color: '#f0b90b', width: 18, height: 18,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: 'bold', flexShrink: 0,
  },
  code: { background: '#2a2a3e', color: '#f0b90b', padding: '0 4px', borderRadius: 3, fontSize: '0.75rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' },
  input: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#fff',
    padding: '7px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.82rem', outline: 'none',
  },
  toggleRow: { display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'monospace' },
  actions: { display: 'flex', gap: 10 },
  saveBtn: {
    background: '#16213e', border: '1px solid #f0b90b', color: '#f0b90b',
    padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem',
  },
  testBtn: {
    background: '#0d3d1f', border: '1px solid #00c853', color: '#00c853',
    padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem',
  },
  status: { fontSize: '0.8rem', fontFamily: 'monospace', padding: '6px 0' },
};
