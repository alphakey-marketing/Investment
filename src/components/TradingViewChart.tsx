/**
 * TradingViewChart.tsx
 * R3 — Embeds the TradingView Advanced Real-Time Chart widget for HKEX:3081
 *
 * - Uses TradingView’s free embeddable widget (no API key required)
 * - Dark theme to match the app’s colour scheme
 * - Respects lang prop: zh_TW for ZH, en for EN
 * - Script is injected once and cleaned up on unmount
 * - Sits alongside the existing KlineChart (which still drives signal logic)
 */
import React, { useEffect, useRef } from 'react';
import { Lang } from '../i18n';

interface Props {
  lang?: Lang;
  interval?: string; // TradingView interval: '60' = 1h, 'D' = 1d, '240' = 4h etc.
}

// Map app intervals to TradingView widget interval codes
const TV_INTERVAL_MAP: Record<string, string> = {
  '5m':  '5',
  '15m': '15',
  '1h':  '60',
  '4h':  '240',
  '1d':  'D',
};

export default function TradingViewChart({ lang = 'ZH', interval = '1h' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvInterval = TV_INTERVAL_MAP[interval] ?? '60';
  const locale = lang === 'ZH' ? 'zh_TW' : 'en';

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous widget instance
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'HKEX:3081',
      interval: tvInterval,
      timezone: 'Asia/Hong_Kong',
      theme: 'dark',
      style: '1',           // 1 = candlestick
      locale,
      backgroundColor: '#0f0f1a',
      gridColor: '#1a1a2e',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [tvInterval, locale]);

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>
          🥇 {lang === 'ZH' ? '價値黃金ETF (03081) 圖表' : 'Value Gold ETF (03081) Chart'}
        </span>
        <span style={badgeStyle}>TradingView</span>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ width: '100%', height: 420 }}
      />
      <div style={footerStyle}>
        {lang === 'ZH'
          ? '💡 圖表由 TradingView 提供 · 即時行情 HKEX:3081 · 可在圖表內直接更改時間框和指標'
          : '💡 Chart powered by TradingView · Live data HKEX:3081 · Change timeframe & indicators directly in the chart'}
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  background: '#0f0f1a',
  border: '1px solid #1a1a2e',
  borderRadius: 12,
  overflow: 'hidden',
  maxWidth: 700,
  width: '100%',
};
const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  borderBottom: '1px solid #1a1a2e',
};
const titleStyle: React.CSSProperties = {
  color: '#f0b90b',
  fontFamily: 'monospace',
  fontSize: '0.88rem',
  fontWeight: 'bold',
};
const badgeStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#444',
  fontFamily: 'monospace',
  border: '1px solid #2a2a3e',
  borderRadius: 4,
  padding: '2px 6px',
};
const footerStyle: React.CSSProperties = {
  padding: '6px 16px 8px',
  borderTop: '1px solid #1a1a2e',
  fontSize: '0.68rem',
  color: '#2a2a4e',
  fontFamily: 'monospace',
};
