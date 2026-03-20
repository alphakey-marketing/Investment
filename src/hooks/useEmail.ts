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
    subject:        string;
    signal_type:    string;
    asset:          string;
    price:          string;
    stop_loss:      string;
    take_profit:    string;
    trend:          string;
    pivot_breached: string;
    ma5:            string;
    ma30:           string;
    ma150:          string;
    time:           string;
    message:        string;
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
          service_id:  emailConfig.serviceId,
          template_id: emailConfig.templateId,
          user_id:     emailConfig.publicKey,
          template_params: {
            to_email:        emailConfig.toEmail,
            subject:         params.subject,
            signal_type:     params.signal_type,
            asset:           params.asset,
            price:           params.price,
            stop_loss:       params.stop_loss,
            take_profit:     params.take_profit,
            trend:           params.trend,
            pivot_breached:  params.pivot_breached,
            ma5:             params.ma5,
            ma30:            params.ma30,
            ma150:           params.ma150,
            time:            params.time,
            message:         params.message,
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
      subject:        '✅ KMA Signal App — Email Alert Test',
      signal_type:    '🟢 LONG (TEST)',
      asset:          '3081.HK',
      price:          '29.850',
      stop_loss:      '29.420',
      take_profit:    '30.925',
      trend:          'BULL',
      pivot_breached: '29.730',
      ma5:            '29.810',
      ma30:           '29.750',
      ma150:          '28.600',
      time:           new Date().toLocaleString('en-HK'),
      message:        'Email alert is working correctly. You will receive LONG/SHORT KMA v2 signal emails here.',
    });
  }, [sendEmail]);

  return { emailConfig, saveEmailConfig, sendEmail, testEmail, emailSending, emailStatus };
}
