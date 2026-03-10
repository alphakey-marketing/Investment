import { useState, useCallback } from 'react';

const STORAGE_KEY = 'kma_telegram_config';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

function loadConfig(): TelegramConfig {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { botToken: '', chatId: '', enabled: false };
  } catch {
    return { botToken: '', chatId: '', enabled: false };
  }
}

export function useTelegram() {
  const [config, setConfig] = useState<TelegramConfig>(loadConfig);
  const [sending, setSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<'ok' | 'error' | null>(null);

  const saveConfig = useCallback((updated: TelegramConfig) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!config.enabled || !config.botToken || !config.chatId) return false;
    setSending(true);
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text,
            parse_mode: 'HTML',
          }),
        }
      );
      const data = await res.json();
      const ok = data.ok === true;
      setLastStatus(ok ? 'ok' : 'error');
      return ok;
    } catch {
      setLastStatus('error');
      return false;
    } finally {
      setSending(false);
    }
  }, [config]);

  const testSend = useCallback(async () => {
    return sendMessage(
      `🤖 <b>KMA交易法</b> 連線測試成功!

✅ Telegram警報已啟用
有事發生時會收到即時訊號通知`
    );
  }, [sendMessage]);

  return { config, saveConfig, sendMessage, testSend, sending, lastStatus };
}
