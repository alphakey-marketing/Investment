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
      `🤖 <b>K均交易法 v2</b> 連線測試成功！\n\n` +
      `✅ Telegram 警報已啟用\n` +
      `📡 訊號觸發時你將收到以下格式通知：\n\n` +
      `🟢 <b>LONG</b> 3081.HK\n` +
      `📍 入場：29.850\n` +
      `🛑 SL：29.420\n` +
      `🎯 TP：30.925\n` +
      `🧭 趨勢：BULL\n` +
      `📐 拐點突破：29.730\n` +
      `📊 MA5/30/150：29.81 / 29.75 / 28.60`
    );
  }, [sendMessage]);

  return { config, saveConfig, sendMessage, testSend, sending, lastStatus };
}
