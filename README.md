# 📈 K均交易法 Investment Signal App

Real-time **XAUUSDT (Gold)** trading signal app based on **K均交易法** (K-MA Trading Method).

## Strategy
Based on the book 《K均交易法：股票期货只看K线均线做到稳定盈利》:
- **線上多，線下空** (Above MA = bullish, Below MA = bearish)
- **到位就動，不到位就不動** (Only act when price reaches MA)
- **3:1 盈虧比** (3:1 profit-to-loss ratio)

## Signals
- 🟢 **LONG**: Price above MA20 + new high forming near MA20
- 🔴 **SHORT**: Price below MA60 + new low forming near MA60

## Tech Stack
- **Vite 4** + **React 18** + **TypeScript 5**
- **Binance Futures API** (XAUUSDT, 1h klines)
- **WebSocket** for real-time updates
- **react-hot-toast** for signal notifications

## Sprint Roadmap
- [x] Sprint 1: Binance API fetch + WebSocket + MA calculation + Signal panel
- [ ] Sprint 2: Lightweight Charts K-line visual chart
- [ ] Sprint 3: Full Dashboard UI + interval selector
- [ ] Sprint 4: Telegram bot alerts + settings panel
- [ ] Sprint 5: Backtesting + Vercel deploy

## Run
```bash
npm install
npm run dev
```
