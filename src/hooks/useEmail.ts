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

    const isLong = params.signal_type.includes('LONG');
    const accentColor = isLong ? '#00c853' : '#ff1744';
    const bgColor     = isLong ? '#0d3d1f' : '#3d0d0d';
    const emoji       = isLong ? '\uD83D\uDFE2' : '\uD83D\uDD34';

    // Full HTML card — passed as {{html_body}} via triple-mustache in the EmailJS template
    const html_body = [
      '<div style="font-family:monospace;background:#0a0a1a;padding:24px;border-radius:12px;',
      'max-width:520px;margin:0 auto;border:2px solid ' + accentColor + '">',

      '<div style="font-size:1.3rem;font-weight:bold;color:' + accentColor + ';margin-bottom:18px">',
      emoji + ' KMA ' + params.signal_type + ' Signal',
      '</div>',

      '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;font-family:monospace">',
      '<tr style="border-bottom:1px solid #1a1a2e">',
      '<td style="padding:9px 0;color:#888;width:40%">Asset</td>',
      '<td style="padding:9px 0;color:#ffffff;font-weight:bold">' + params.asset + '</td>',
      '</tr>',
      '<tr style="border-bottom:1px solid #1a1a2e">',
      '<td style="padding:9px 0;color:#888">Entry Price</td>',
      '<td style="padding:9px 0;color:#f0b90b;font-weight:bold">$' + params.price + '</td>',
      '</tr>',
      '<tr style="border-bottom:1px solid #1a1a2e">',
      '<td style="padding:9px 0;color:#888">Stop Loss</td>',
      '<td style="padding:9px 0;color:#ff1744;font-weight:bold">$' + params.stop_loss + '</td>',
      '</tr>',
      '<tr style="border-bottom:1px solid #1a1a2e">',
      '<td style="padding:9px 0;color:#888">Take Profit</td>',
      '<td style="padding:9px 0;color:#00c853;font-weight:bold">$' + params.take_profit + '</td>',
      '</tr>',
      '<tr>',
      '<td style="padding:9px 0;color:#888">Time</td>',
      '<td style="padding:9px 0;color:#aaaaaa">' + params.time + '</td>',
      '</tr>',
      '</table>',

      '<div style="margin-top:16px;padding:12px 14px;background:' + bgColor + ';border-radius:8px;',
      'font-size:0.82rem;color:#cccccc;line-height:1.7">',
      params.message,
      '</div>',

      '<div style="margin-top:16px;font-size:0.7rem;color:#444444;border-top:1px solid #1a1a2e;padding-top:12px">',
      '\u26A0\uFE0F For reference only. Not financial advice. | KMA Signal App',
      '</div>',

      '</div>',
    ].join('');

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailConfig.serviceId,
          template_id: emailConfig.templateId,
          user_id: emailConfig.publicKey,
          template_params: {
            to_email:    emailConfig.toEmail,
            subject:     params.subject,
            html_body,
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
      subject:     '\u2705 KMA Signal App \u2014 Email Alert Test',
      signal_type: '\uD83D\uDFE2 LONG (TEST)',
      asset:       'XAUUSDT',
      price:       '2345.00',
      stop_loss:   '2321.55',
      take_profit: '2415.35',
      time:        new Date().toLocaleString('en-HK'),
      message:     'Email alert is working correctly. You will receive LONG/SHORT signal emails here.',
    });
  }, [sendEmail]);

  return { emailConfig, saveEmailConfig, sendEmail, testEmail, emailSending, emailStatus };
}
