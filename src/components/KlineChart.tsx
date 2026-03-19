import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { Candle, MAPoint, SignalEvent } from '../types/binance';
import { Lang } from '../i18n';

type ChartType = 'candle' | 'line';

interface Props {
  candles:    Candle[];
  ma20:       MAPoint[];
  ma60:       MAPoint[];
  signal:     SignalEvent | null;
  lang?:      Lang;
  ma1Period?: number;  // for dynamic series title e.g. "MA20"
  ma2Period?: number;  // for dynamic series title e.g. "MA60"
}

export default function KlineChart({ candles, ma20, ma60, signal, lang = 'ZH', ma1Period = 20, ma2Period = 60 }: Props) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<any>(null);
  const mainSeriesRef   = useRef<any>(null);
  const ma20SeriesRef   = useRef<any>(null);
  const ma60SeriesRef   = useRef<any>(null);
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [showGuide, setShowGuide] = useState(false);
  const isEN = lang === 'EN';

  // ── Build / rebuild chart whenever chartType or MA periods change ─────────
  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current     = null;
      mainSeriesRef.current  = null;
      ma20SeriesRef.current  = null;
      ma60SeriesRef.current  = null;
    }

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
      width:  containerRef.current.clientWidth,
      height: 360,
    });

    const mainSeries = chartType === 'candle'
      ? chart.addCandlestickSeries({
          upColor:        '#00c853',
          downColor:      '#ff1744',
          borderUpColor:  '#00c853',
          borderDownColor:'#ff1744',
          wickUpColor:    '#00c853',
          wickDownColor:  '#ff1744',
        })
      : chart.addLineSeries({
          color:             '#f0b90b',
          lineWidth:         2,
          priceLineVisible:  true,
          lastValueVisible:  true,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius:  5,
        });

    // Dynamic series titles using actual MA periods passed from App
    const ma20Series = chart.addLineSeries({
      color: '#2196f3', lineWidth: 2,
      title: `MA${ma1Period}`,
      priceLineVisible: false, lastValueVisible: true,
    });
    const ma60Series = chart.addLineSeries({
      color: '#ff9800', lineWidth: 2,
      title: `MA${ma2Period}`,
      priceLineVisible: false, lastValueVisible: true,
    });

    chartRef.current      = chart;
    mainSeriesRef.current  = mainSeries;
    ma20SeriesRef.current  = ma20Series;
    ma60SeriesRef.current  = ma60Series;

    const handleResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current      = null;
      mainSeriesRef.current  = null;
      ma20SeriesRef.current  = null;
      ma60SeriesRef.current  = null;
    };
  }, [chartType, ma1Period, ma2Period]); // rebuild when type or MA periods change

  // ── Feed candle data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mainSeriesRef.current || candles.length === 0) return;
    try {
      if (chartType === 'candle') {
        mainSeriesRef.current.setData(
          candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
        );
      } else {
        mainSeriesRef.current.setData(
          candles.map((c) => ({ time: c.time, value: c.close }))
        );
      }
      chartRef.current?.timeScale().fitContent();
    } catch (e) { console.error('Chart data update error:', e); }
  }, [candles, chartType]);

  // ── Feed MA data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ma20SeriesRef.current || ma20.length === 0) return;
    try { ma20SeriesRef.current.setData(ma20.map((p) => ({ time: p.time, value: p.value }))); }
    catch (e) { console.error('MA20 update error:', e); }
  }, [ma20, chartType]);

  useEffect(() => {
    if (!ma60SeriesRef.current || ma60.length === 0) return;
    try { ma60SeriesRef.current.setData(ma60.map((p) => ({ time: p.time, value: p.value }))); }
    catch (e) { console.error('MA60 update error:', e); }
  }, [ma60, chartType]);

  // ── Signal markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainSeriesRef.current) return;
    if (!signal) { mainSeriesRef.current.setMarkers([]); return; }
    try {
      mainSeriesRef.current.setMarkers([{
        time:     signal.time,
        position: signal.type === 'LONG' ? 'belowBar' : 'aboveBar',
        color:    signal.type === 'LONG' ? '#00c853'  : '#ff1744',
        shape:    signal.type === 'LONG' ? 'arrowUp'  : 'arrowDown',
        text:     signal.type === 'LONG' ? '入場 ▲' : '入場 ▼',
      }]);
    } catch (e) { console.error('Marker error:', e); }
  }, [signal, chartType]);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>
          {chartType === 'candle' ? '📉' : '📈'}{' '}
          {isEN ? (chartType === 'candle' ? 'Candlestick Chart' : 'Price Line Chart') : (chartType === 'candle' ? 'K線圖' : '價格線圖')}
        </span>

        <div style={styles.controls}>
          <div style={styles.toggleGroup}>
            <ToggleBtn active={chartType === 'candle'} onClick={() => setChartType('candle')} label={isEN ? '📊 Candle' : '📊 K線'} color="#f0b90b" />
            <ToggleBtn active={chartType === 'line'}   onClick={() => setChartType('line')}   label={isEN ? '📈 Line'   : '📈 線圖'} color="#f0b90b" />
          </div>

          <div style={styles.legend}>
            {chartType === 'candle' && (
              <>
                <LegendDot color="#00c853" label={isEN ? '▩ Up'   : '▩ 陽線'} />
                <LegendDot color="#ff1744" label={isEN ? '▩ Down' : '▩ 陰線'} />
              </>
            )}
            {chartType === 'line' && (
              <LegendDot color="#f0b90b" label={isEN ? '— Price' : '— 價格'} line />
            )}
            {/* Dynamic MA labels using actual periods */}
            <LegendDot color="#2196f3" label={`— MA${ma1Period}`} line />
            <LegendDot color="#ff9800" label={`— MA${ma2Period}`} line />
            {signal && (
              <span style={{ fontSize: '0.72rem', color: signal.type === 'LONG' ? '#00c853' : '#ff1744', fontFamily: 'monospace' }}>
                {signal.type === 'LONG' ? '▲ BUY' : '▼ SELL'}
              </span>
            )}
          </div>

          <button onClick={() => setShowGuide(!showGuide)} style={styles.guideBtn}>
            {showGuide ? (isEN ? 'Hide ▲' : '收起 ▲') : (isEN ? 'How to read ▼' : '如何閱讀 ▼')}
          </button>
        </div>
      </div>

      {/* Beginner guide */}
      {showGuide && (
        <div style={styles.guideBox}>
          <div style={styles.guideTitle}>{isEN ? '📚 How to read this chart' : '📚 如何閱讀圖表'}</div>
          <div style={styles.guideGrid}>
            <GuideChip icon="🟩" color="#00c853" title={isEN ? 'Green candle = price UP'    : '綠色K線 = 價格上漲'} desc={isEN ? 'Close > Open that period.'  : '收盤價高於開盤價。'} />
            <GuideChip icon="🟥" color="#ff1744" title={isEN ? 'Red candle = price DOWN'    : '紅色K線 = 價格下跌'} desc={isEN ? 'Close < Open that period.'  : '收盤價低於開盤價。'} />
            <GuideChip icon="📈" color="#f0b90b" title={isEN ? 'Yellow line = close price'  : '黃線 = 收盤價走勢'}  desc={isEN ? 'Visible in Line chart mode.' : '線圖模式顯示，直觀看價格走勢。'} />
            <GuideChip icon="—"  color="#2196f3" title={isEN ? `Blue = MA${ma1Period}`      : `藍線 = MA${ma1Period}`}  desc={isEN ? `Average of last ${ma1Period} candles.` : `最近${ma1Period}根K線均價。`} />
            <GuideChip icon="—"  color="#ff9800" title={isEN ? `Orange = MA${ma2Period}`    : `橙線 = MA${ma2Period}`}  desc={isEN ? 'The big-picture trend.'     : '代表大方向趨勢。'} />
            <GuideChip icon="▲"  color="#00c853" title={isEN ? '▲ = BUY signal'             : '▲ = 買入訊號'}           desc={isEN ? 'Short MA crossed above long MA.' : '短期均線穿上長期均線。'} />
            <GuideChip icon="▼"  color="#ff1744" title={isEN ? '▼ = SELL signal'            : '▼ = 賣出訊號'}           desc={isEN ? 'Short MA crossed below long MA.' : '短期均線穿下長期均線。'} />
          </div>
          <div style={styles.guideNote}>
            {isEN
              ? '💡 Tip: Switch between Candle and Line view using the buttons above.'
              : '💡 技巧：點擊上方按鈕可切換 K線 / 線圖模式。'}
          </div>
        </div>
      )}

      <div ref={containerRef} />

      <div style={styles.bottomBar}>
        <span style={styles.hint}>
          {isEN
            ? '👉 Drag to scroll · Scroll wheel to zoom · Toggle Candle/Line above'
            : '👉 拖動滾動 K線 · 滾輪縮放 · 點擊上方按鈕切換 K線/線圖'}
        </span>
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button onClick={onClick} style={{
      background:   active ? color + '22' : '#0f0f1a',
      border:       `1px solid ${active ? color : '#2a2a3e'}`,
      color:        active ? color : '#555',
      padding:      '3px 10px',
      borderRadius: 6,
      cursor:       'pointer',
      fontFamily:   'monospace',
      fontSize:     '0.72rem',
      fontWeight:   active ? 'bold' : 'normal',
      transition:   'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function LegendDot({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#888', fontFamily: 'monospace' }}>
      {line
        ? <span style={{ width: 14, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
        : <span style={{ width: 8,  height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {label}
    </span>
  );
}

function GuideChip({ icon, color, title, desc }: { icon: string; color: string; title: string; desc: string }) {
  return (
    <div style={{ background: '#0f0f1a', border: `1px solid ${color}33`, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color, marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: '0.72rem', color: '#666', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper:     { background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 12, overflow: 'hidden', maxWidth: 700, width: '100%' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 16px', borderBottom: '1px solid #1a1a2e', flexWrap: 'wrap', gap: 8 },
  title:       { color: '#fff', fontFamily: 'monospace', fontSize: '0.88rem', paddingTop: 2 },
  controls:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  toggleGroup: { display: 'flex', gap: 5 },
  legend:      { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  guideBtn:    { background: 'none', border: '1px solid #2a2a3e', color: '#555', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace' },
  guideBox:    { background: '#12122a', borderBottom: '1px solid #1a1a2e', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  guideTitle:  { fontSize: '0.8rem', color: '#888', fontWeight: 'bold', fontFamily: 'monospace' },
  guideGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 },
  guideNote:   { fontSize: '0.74rem', color: '#555', background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 6, padding: '8px 12px', lineHeight: 1.6 },
  bottomBar:   { padding: '6px 16px 8px', borderTop: '1px solid #1a1a2e' },
  hint:        { fontSize: '0.68rem', color: '#2a2a4e', fontFamily: 'monospace' },
};
