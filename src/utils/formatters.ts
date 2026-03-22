export function fmtHKD(n: number): string {
  return `HK$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
export function fmtTime(unix: number): string {
  return new Date(unix * 1000).toLocaleString('en-GB', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
