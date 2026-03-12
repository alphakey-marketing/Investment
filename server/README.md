# Futu Proxy Server

This Express server bridges the React app and **Futu OpenD** (the local Futu API gateway).

## Quick Start

### 1. Install FutuOpenD
Download from https://www.futunn.com/download/OpenAPI  
Launch it and log in with your Futu/Moomoo account.

### 2. Install server dependencies
```bash
npm install --prefix server
```

### 3. Run both servers
```bash
# Terminal 1 — Futu proxy
npm run server

# Terminal 2 — React app
npm run dev
```

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/klines/:symbol/:interval?limit=200` | Candlestick data |
| `GET /api/quote/:symbol` | Live quote |

## Symbols

| Symbol | Description |
|---|---|
| `HK.MHImain` | Mini Hang Seng Index Futures (主力合約) |
| `HK.HSImain` | Full Hang Seng Index Futures |
| `HK.HHImain` | H-Share Index Futures |
| `HK.00700`   | Tencent |
| `HK.00005`   | HSBC |
| `HK.09988`   | Alibaba HK |

## Environment Variables (optional)

| Variable | Default | Description |
|---|---|---|
| `FUTUD_HOST` | `localhost` | FutuOpenD host |
| `FUTUD_PORT` | `11111` | FutuOpenD port |
| `PROXY_PORT` | `3001` | This proxy's port |

## Architecture

```
React App (Vite :5173)
  ↓  /api/*  (proxied by Vite in dev)
Express Proxy (:3001)
  ↓  futu-api SDK
FutuOpenD (:11111)
  ↓  Futu servers (HK market data)
```
