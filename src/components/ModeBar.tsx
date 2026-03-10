import React from 'react';
import { AppMode } from '../types/mode';
import { Lang, tr } from '../i18n';

interface Props {
  mode: AppMode;
  onChange: (m: AppMode) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export default function ModeBar({ mode, onChange, lang, onLangChange }: Props) {
  const modes: { value: AppMode; labelKey: 'modeLive'|'modePaper'|'modeBacktest'; descKey: 'modeDescLive'|'modeDescPaper'|'modeDescBack'; color: string }[] = [
    { value: 'LIVE',     labelKey: 'modeLive',     descKey: 'modeDescLive',  color: '#f0b90b' },
    { value: 'PAPER',    labelKey: 'modePaper',    descKey: 'modeDescPaper', color: '#29b6f6' },
    { value: 'BACKTEST', labelKey: 'modeBacktest', descKey: 'modeDescBack',  color: '#ab47bc' },
  ];

  return (
    <div style={styles.bar}>
      <span style={styles.title}>{tr('modeLabel', lang)}</span>
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          style={{
            ...styles.btn,
            ...(mode === m.value ? { ...styles.active, borderColor: m.color, color: m.color, background: m.color + '18' } : {}),
          }}
        >
          {tr(m.labelKey, lang)}
          <span style={{ fontSize: '0.65rem', color: mode === m.value ? m.color : '#444', display: 'block', marginTop: 1 }}>
            {tr(m.descKey, lang)}
          </span>
        </button>
      ))}
      {/* Language toggle */}
      <button
        onClick={() => onLangChange(lang === 'ZH' ? 'EN' : 'ZH')}
        style={styles.langBtn}
        title="Switch Language / 切換語言"
      >
        {lang === 'ZH' ? '🌐 EN' : '🌐 中'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10,
    padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center',
    maxWidth: 700, width: '100%', flexWrap: 'wrap',
  },
  title: { fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 },
  btn: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#555',
    padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.4,
    flex: 1, minWidth: 90,
  },
  active: { fontWeight: 'bold' },
  langBtn: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#888',
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: 'auto',
  },
};
