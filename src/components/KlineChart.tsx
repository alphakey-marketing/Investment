import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  CandlestickData,
  LineData,
  Time,
} from 'lightweight-charts';
import { Candle, MAPoint, SignalEvent } from '../types/binance';

interface Props {
  candles: Candle[];
  ma20: MAPoint[];
  ma60: MAPoint[];
  signal: SignalEvent | null;
}

export default function KlineChart({ candles, ma20, ma60, signal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f1a' },
        textColor: '#888',
      },
      grid: {
        vertLines: { color: '#1a1a2e' },
        horzLines: { color: '#1a1a2e' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#333',
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    // MA20 line - blue
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 2,
      title: 'MA20',
    });

    // MA60 line - orange
    const ma60Series = chart.addSeries(LineSeries, {
      color: '#ff9800',
      lineWidth: 2,
      title: 'MA60',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ma20SeriesRef.current = ma20Series;
    ma60SeriesRef.current = ma60Series;

    // Responsive resize
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(data);
  }, [candles]);

  // Update MA20 line
  useEffect(() => {
    if (!ma20SeriesRef.current || ma20.length === 0) return;
    const data: LineData[] = ma20.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    ma20SeriesRef.current.setData(data);
  }, [ma20]);

  // Update MA60 line
  useEffect(() => {
    if (!ma60SeriesRef.current || ma60.length === 0) return;
    const data: LineData[] = ma60.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    ma60SeriesRef.current.setData(data);
  }, [ma60]);

  // Mark signal on chart with a marker
  useEffect(() => {
    if (!candleSeriesRef.current || !signal) return;
    candleSeriesRef.current.setMarkers([
      {
        time: signal.time as Time,
        position: signal.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color: signal.type === 'LONG' ? '#00c853' : '#ff1744',
        shape: signal.type === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: signal.type === 'LONG' ? 'LONG 入場' : 'SHORT 入場',
      },
    ]);
  }, [signal]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.title}>📉 XAUUSDT 1H K線圖</span>
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#00c853' }} />陰線
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#ff1744' }} />陰線
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#2196f3' }} />MA20
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.dot, background: '#ff9800' }} />MA60
          </span>
          {signal && (
            <span style={styles.legendItem}>
              <span style={{ color: signal.type === 'LONG' ? '#00c853' : '#ff1744' }}>
                {signal.type === 'LONG' ? '▲ LONG' : '▼ SHORT'}
              </span>
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} style={styles.chart} />
      <div style={styles.hint}>
        👉 拖動可左右滾動 ・ 滚輪可縮放 ・ 双擊可高亮 K線
      </div>
    </div>
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
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a2e',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
  },
  legend: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.72rem',
    color: '#888',
    fontFamily: 'monospace',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  chart: {
    width: '100%',
  },
  hint: {
    padding: '6px 16px',
    fontSize: '0.7rem',
    color: '#333',
    fontFamily: 'monospace',
    borderTop: '1px solid #1a1a2e',
  },
};
