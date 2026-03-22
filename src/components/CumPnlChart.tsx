import React from 'react';
interface Props { data: { label: string; cum: number }[]; height?: number; }
export default function CumPnlChart({ data, height = 100 }: Props) {
  if (data.length < 2) return null;
  const vals  = data.map((d) => d.cum);
  const minV  = Math.min(...vals, 0);
  const maxV  = Math.max(...vals, 0);
  const range = maxV - minV || 1;
  const W     = Math.max(data.length * 36, 400);
  const step  = W / (data.length - 1);
  const toY   = (v: number) => (height - 12) - ((v - minV) / range) * (height - 22);
  const zeroY = toY(0);
  const pts   = data.map((d, i) => `${i * step},${toY(d.cum)}`).join(' ');
  const area  = `M0,${toY(data[0].cum)} ` + data.slice(1).map((d, i) => `L${(i + 1) * step},${toY(d.cum)}`).join(' ') + ` L${(data.length - 1) * step},${zeroY} L0,${zeroY} Z`;
  const lastVal = vals[vals.length - 1];
  const col   = lastVal >= 0 ? '#00c853' : '#ff1744';
  return (
    <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '10px 8px', border: '1px solid #1a1a2e', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4" />
        <path d={area} fill={col + '20'} />
        <polyline points={pts} fill="none" stroke={col} strokeWidth="2" />
        {data.map((d, i) => <circle key={i} cx={i * step} cy={toY(d.cum)} r="3" fill={d.cum >= 0 ? '#00c853' : '#ff1744'} />)}
      </svg>
    </div>
  );
}
