import { useState, useCallback } from 'react';

const STORAGE_KEY = 'kma_email_config';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  enabled: boolean;
}

function loadConfig(): EmailConfig {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { serviceId: '', templateId: '', publicKey: '', toEmail: '', enabled: false };
  } catch {
    return { serviceId: '', templateId: '', publicKey: '', toEmail: '', enabled: false };
  }
}

export function useEmail() {
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(loadConfig);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'ok' | 'error' | null>(null);

  const saveEmailConfig = useCallback((updated: EmailConfig) => {
    setEmailConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const sendEmail = useCallback(async (params: {
    subject: string;
    signal_type: string;
    asset: string;
    price: string;
    stop_loss: string;
    take_profit: string;
    time: string;
    message: string;
  }): Promise<boolean> => {
    if (!emailConfig.enabled || !emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey || !emailConfig.toEmail) {
      return false;
    }
    setEmailSending(true);
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailConfig.serviceId,
          template_id: emailConfig.templateId,
          user_id: emailConfig.publicKey,
          template_params: {
            to_email: emailConfig.toEmail,
            ...params,
          },
        }),
      });
      const ok = res.status === 200;
      setEmailStatus(ok ? 'ok' : 'error');
      return ok;
    } catch {
      setEmailStatus('error');
      return false;
    } finally {
      setEmailSending(false);
    }
  }, [emailConfig]);

  const testEmail = useCallback(async () => {
    return sendEmail({
      subject: '✅ KMA Signal App — Email Alert Test',
      signal_type: 'TEST',
      asset: 'XAUUSDT',
      price: '0.00',
      stop_loss: '0.00',
      take_profit: '0.00',
      time: new Date().toLocaleString('en-HK'),
      message: 'Email alert is working correctly. You will receive LONG/SHORT signal emails here.',
    });
  }, [sendEmail]);

  return { emailConfig, saveEmailConfig, sendEmail, testEmail, emailSending, emailStatus };
}
