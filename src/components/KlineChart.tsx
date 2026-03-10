import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { Candle, MAPoint, SignalEvent } from '../types/binance';

interface Props {
  candles: Candle[];
  ma20: MAPoint[];
  ma60: MAPoint[];
  signal: SignalEvent | null;
}

export default function KlineChart({ candles, ma20, ma60, signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const ma20SeriesRef = useRef<any>(null);
  const ma60SeriesRef = useRef<any>(null);

  // Init chart once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f1a' },
        textColor: '#888888',
      },
      grid: {
        vertLines: { color: '#1a1a2e' },
        horzLines: { color: '#1a1a2e' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#333333' },
      timeScale: {
        borderColor: '#333333',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 360,
    });

    // v4 API: addCandlestickSeries / addLineSeries
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    const ma20Series = chart.addLineSeries({
      color: '#2196f3',
      lineWidth: 2,
      title: 'MA20',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const ma60Series = chart.addLineSeries({
      color: '#ff9800',
      lineWidth: 2,
      title: 'MA60',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ma20SeriesRef.current = ma20Series;
    ma60SeriesRef.current = ma60Series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma60SeriesRef.current = null;
    };
  }, []);

  // Update candles
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    try {
      candleSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      // Fit all data in view
      chartRef.current?.timeScale().fitContent();
    } catch (e) {
      console.error('Chart candle update error:', e);
    }
  }, [candles]);

  // Update MA20
  useEffect(() => {
    if (!ma20SeriesRef.current || ma20.length === 0) return;
    try {
      ma20SeriesRef.current.setData(ma20.map((p) => ({ time: p.time, value: p.value })));
    } catch (e) {
      console.error('MA20 update error:', e);
    }
  }, [ma20]);

  // Update MA60
  useEffect(() => {
    if (!ma60SeriesRef.current || ma60.length === 0) return;
    try {
      ma60SeriesRef.current.setData(ma60.map((p) => ({ time: p.time, value: p.value })));
    } catch (e) {
      console.error('MA60 update error:', e);
    }
  }, [ma60]);

  // Signal markers
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (!signal) {
      candleSeriesRef.current.setMarkers([]);
      return;
    }
    try {
      candleSeriesRef.current.setMarkers([
        {
          time: signal.time,
          position: signal.type === 'LONG' ? 'belowBar' : 'aboveBar',
          color: signal.type === 'LONG' ? '#00c853' : '#ff1744',
          shape: signal.type === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: signal.type === 'LONG' ? '入場' : '入場',
        },
      ]);
    } catch (e) {
      console.error('Marker error:', e);
    }
  }, [signal]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>📉 XAUUSDT 1H K線圖</span>
        <div style={styles.legend}>
          <LegendDot color="#00c853" label="陽線" />
          <LegendDot color="#ff1744" label="陰線" />
          <LegendDot color="#2196f3" label="MA20" />
          <LegendDot color="#ff9800" label="MA60" />
          {signal && (
            <span style={{ fontSize: '0.72rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744', fontFamily: 'monospace' }}>
              {signal.type === 'LONG' ? '▲ LONG' : '▼ SHORT'}
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} />
      <div style={styles.hint}>
        👉 拖動滾動 K線 · 滚輪縮放 · 鐄色線左方=MA20(MA60)最新價
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#888', fontFamily: 'monospace' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#0f0f1a',
    border: '1px solid #1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 700,
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #1a1a2e',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { color: '#fff', fontFamily: 'monospace', fontSize: '0.88rem' },
  legend: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  hint: { padding: '5px 16px', fontSize: '0.68rem', color: '#2a2a3e', fontFamily: 'monospace', borderTop: '1px solid #1a1a2e' },
};
